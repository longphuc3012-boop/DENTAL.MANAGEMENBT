import React, { useEffect, useState, useRef } from 'react';
import { Trash2, Plus, Download, Upload, Filter, Settings, X } from 'lucide-react';
import AppHeader from './components/AppHeader';
import AppointmentTable from './components/AppointmentTable';
import DetailPanel from './components/DetailPanel';
import {
  MULTI_VISIT_CODES,
  FULL_MOUTH_CODES,
  DOCTORS,
  TEETH_UPPER,
  TEETH_LOWER,
  treatmentGroups,
  parseTimeToMinutes,
  formatMinutesToTime,
  formatDateToKey,
  formatDateDisplay,
  getServiceDuration,
  getVisitMax,
  getVisitDuration,
  getServiceTotalCost,
  initialSheets
} from './data/dentalData';

const formatMoneyDigits = (value) => String(value ?? '').replace(/\D/g, '');

const formatMoneyDisplay = (value) => {
  const digits = formatMoneyDigits(value);
  if (!digits) return '';
  return Number(digits).toLocaleString('vi-VN');
};

const getBadgeStyle = (status) => {
  switch (status) {
    case 'Đã đặt':
      return { bg: '#DBEAFE', color: '#1D4ED8' };
    case 'Đã khám':
      return { bg: '#dcfce7', color: '#15803d' };
    case 'Đang khám':
      return { bg: '#fef3c7', color: '#b45309' };
    case 'Chờ đến lượt':
    case 'Chờ khám':
      return { bg: '#F3E8FF', color: '#7C3AED' };
    case 'Hủy':
      return { bg: '#fee2e2', color: '#b91c1c' };
    case 'Hoàn thành':
      return { bg: '#dbeafe', color: '#1d4ed8' };
    default:
      return { bg: '#f1f5f9', color: '#475569' };
  }
};

const normalizePaymentEntries = (payments = [], visitNumber = 1) => {
  const entries = Array.isArray(payments) ? payments.slice() : [];
  const installment = Math.max(1, Number(visitNumber) || 1);
  const normalized = entries.map((entry) => ({
    installment: Math.max(1, Number(entry.installment) || installment),
    amount: formatMoneyDigits(entry.amount ?? '')
  }));

  const existing = normalized.find((entry) => Number(entry.installment) === installment);
  if (!existing) {
    normalized.push({ installment, amount: '' });
  }

  return normalized.sort((a, b) => Number(a.installment) - Number(b.installment));
};

const getPaymentEntries = (item) => normalizePaymentEntries(item.payments, item.visitNumber || 1);

const recalculateSequentialTimes = (items) => {
  let cursorMinutes = parseTimeToMinutes('08:00');

  return items.map((item, index) => {
    const duration = getVisitDuration(item.serviceCode, item.visitNumber || 1) || 30;
    let startMinutes = index === 0 ? parseTimeToMinutes('08:00') : cursorMinutes + 5;
    const morningLimit = parseTimeToMinutes('11:30');
    const eveningStart = parseTimeToMinutes('14:00');
    const eveningLimit = parseTimeToMinutes('19:30');

    if (startMinutes < morningLimit && startMinutes + duration > morningLimit) {
      startMinutes = eveningStart;
    }

    if (startMinutes >= eveningStart && startMinutes + duration > eveningLimit) {
      startMinutes = parseTimeToMinutes('08:00');
    }

    const endMinutes = startMinutes + duration;
    cursorMinutes = endMinutes;

    return {
      ...item,
      time: formatMinutesToTime(startMinutes),
      duration,
      endTime: formatMinutesToTime(endMinutes)
    };
  });
};

const parseCsvLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  result.push(current);
  return result;
};

const calculateAutoVisitNumber = (name, phone, serviceCode, currentDate, currentId, allList) => {
  if (!MULTI_VISIT_CODES.includes(serviceCode)) return 1;

  const maxAllowed = getVisitMax(serviceCode);
  const history = allList.filter((item) =>
    item.id !== currentId &&
    (item.phone === phone || item.name === name) &&
    item.serviceCode === serviceCode
  );

  if (history.length === 0) return 1;

  const differentDateHistory = history.filter((item) => item.date !== currentDate);
  if (differentDateHistory.length > 0) {
    const maxPreviousVisit = Math.max(...history.map((item) => item.visitNumber || 1));
    return Math.min(maxPreviousVisit + 1, maxAllowed);
  }

  const sameDateItem = history.find((item) => item.date === currentDate);
  return Math.min(sameDateItem ? (sameDateItem.visitNumber || 1) : 1, maxAllowed);
};

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date(2024, 4, 18));
  const [sheetsData, setSheetsData] = useState(initialSheets);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingCell, setEditingCell] = useState({ id: null, field: null });
  const [activeToothModal, setActiveToothModal] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [filterDoctor, setFilterDoctor] = useState('Tất cả');
  const [paymentListOpenId, setPaymentListOpenId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  const currentKey = formatDateToKey(selectedDate);
  const appointments = sheetsData[currentKey] || [];

  useEffect(() => {
    if (!selectedItem && appointments.length > 0) {
      setSelectedItem(appointments[0]);
    }
  }, [appointments, selectedItem]);

  useEffect(() => {
    fetch('http://localhost:3000')
      .then((res) => res.text())
      .then((data) => console.log(data))
      .catch((err) => console.error(err));
  }, []);

  const visibleAppointments = appointments.filter((item) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const searchMatch = !normalizedSearch || [
      String(item.id || ''),
      String(item.name || ''),
      String(item.phone || ''),
      String(item.serviceCode || ''),
      String(item.doctor || '')
    ].some((value) => value.toLowerCase().includes(normalizedSearch));

    const statusMatch = filterStatus === 'Tất cả' || item.status === filterStatus;
    const doctorMatch = filterDoctor === 'Tất cả' || item.doctor === filterDoctor;
    return searchMatch && statusMatch && doctorMatch;
  });

  const handleDateChange = (newDate) => {
    const key = formatDateToKey(newDate);
    setSelectedDate(newDate);

    if (!sheetsData[key]) {
      setSheetsData((prev) => ({ ...prev, [key]: [] }));
      setSelectedItem(null);
    } else {
      setSelectedItem(sheetsData[key][0] || null);
    }
  };

  const handleShiftDate = (days) => {
    const updated = new Date(selectedDate);
    updated.setDate(updated.getDate() + days);
    handleDateChange(updated);
  };

  const updateCurrentAppointments = (newAppointments) => {
    setSheetsData((prev) => ({ ...prev, [currentKey]: newAppointments }));
  };

  const handleCellChange = (id, field, value) => {
    if (field === 'id') {
      const rowIndex = appointments.findIndex((item) => item.id === id);
      const startNum = parseInt(value, 10);
      if (!Number.isNaN(startNum)) {
        const updated = appointments.map((item, idx) => {
          if (idx >= rowIndex) {
            const currentNum = startNum + (idx - rowIndex);
            return { ...item, id: String(currentNum) };
          }
          return item;
        });
        updateCurrentAppointments(updated);
        setSelectedItem(updated[rowIndex] || updated[0] || null);
      }
      return;
    }

    const updated = appointments.map((item) => {
      if (item.id !== id) return item;

      const updatedItem = { ...item, [field]: value };

      if (field === 'groupCode') {
        const availableTreatments = treatmentGroups[value]?.treatments || {};
        const firstServiceCode = Object.keys(availableTreatments)[0] || '';
        updatedItem.serviceCode = firstServiceCode;
        updatedItem.optionId = '';

        if (FULL_MOUTH_CODES.includes(firstServiceCode)) {
          updatedItem.tooth = 'Toàn hàm';
        } else if (updatedItem.tooth === 'Toàn hàm') {
          updatedItem.tooth = '';
        }

        updatedItem.visitNumber = calculateAutoVisitNumber(
          updatedItem.name,
          updatedItem.phone,
          firstServiceCode,
          updatedItem.date,
          id,
          appointments
        );
      }

      if (field === 'serviceCode') {
        updatedItem.optionId = '';
        updatedItem.duration = getVisitDuration(value, updatedItem.visitNumber || 1);

        if (FULL_MOUTH_CODES.includes(value)) {
          updatedItem.tooth = 'Toàn hàm';
        } else if (updatedItem.tooth === 'Toàn hàm') {
          updatedItem.tooth = '';
        }

        updatedItem.visitNumber = calculateAutoVisitNumber(
          updatedItem.name,
          updatedItem.phone,
          value,
          updatedItem.date,
          id,
          appointments
        );
        updatedItem.duration = getVisitDuration(value, updatedItem.visitNumber || 1);

        const startMinutes = parseTimeToMinutes(updatedItem.time || '08:00');
        updatedItem.endTime = formatMinutesToTime(startMinutes + updatedItem.duration);
      }

      if (field === 'time') {
        const duration = getVisitDuration(updatedItem.serviceCode, updatedItem.visitNumber || 1);
        const startMinutes = parseTimeToMinutes(value || '08:00');
        updatedItem.endTime = formatMinutesToTime(startMinutes + duration);
      }

      if (['name', 'phone', 'date'].includes(field)) {
        updatedItem.visitNumber = calculateAutoVisitNumber(
          updatedItem.name,
          updatedItem.phone,
          updatedItem.serviceCode,
          updatedItem.date,
          id,
          appointments
        );
      }

      return updatedItem;
    });

    updateCurrentAppointments(recalculateSequentialTimes(updated));
    setSelectedItem(updated.find((item) => item.id === id) || null);
  };

  const handleVisitStep = (id, delta) => {
    const updated = appointments.map((item) => {
      if (item.id !== id) return item;

      const maxVisit = getVisitMax(item.serviceCode);
      const currentVisit = item.visitNumber || 1;
      const newVisit = Math.min(maxVisit, Math.max(1, currentVisit + delta));
      const currentPayments = normalizePaymentEntries(item.payments, currentVisit);
      const nextPayments = currentPayments.some((entry) => Number(entry.installment) === newVisit)
        ? currentPayments
        : [...currentPayments, { installment: newVisit, amount: '' }];

      const updatedItem = {
        ...item,
        visitNumber: newVisit,
        duration: getVisitDuration(item.serviceCode, newVisit),
        payments: nextPayments.sort((a, b) => Number(a.installment) - Number(b.installment))
      };

      const startMinutes = parseTimeToMinutes(updatedItem.time || '08:00');
      updatedItem.endTime = formatMinutesToTime(startMinutes + updatedItem.duration);
      return updatedItem;
    });

    const reordered = recalculateSequentialTimes(updated);
    updateCurrentAppointments(reordered);
    setSelectedItem(reordered.find((item) => item.id === id) || null);
  };

  const handleToggleToothSelect = (toothCode) => {
    if (!activeToothModal) return;

    let currentTeeth = activeToothModal.tooth
      ? activeToothModal.tooth.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    if (currentTeeth.includes(toothCode)) {
      currentTeeth = currentTeeth.filter((t) => t !== toothCode);
    } else {
      currentTeeth.push(toothCode);
    }

    const newToothString = currentTeeth.join(', ');
    setActiveToothModal({ ...activeToothModal, tooth: newToothString });
    handleCellChange(activeToothModal.id, 'tooth', newToothString);
  };

  const handleAddRow = () => {
    let lastNum = 34245 + appointments.length;
    const lastItem = appointments[appointments.length - 1];
    if (lastItem && !Number.isNaN(parseInt(lastItem.id, 10))) {
      lastNum = parseInt(lastItem.id, 10);
    }

    const dDisplay = `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}`;
    const newId = String(lastNum + 1);
    const duration = getVisitDuration('TR001', 1);

    const priorEndMinutes = appointments.length > 0
      ? appointments.reduce((max, item) => {
          const start = parseTimeToMinutes(item.time || '08:00');
          const end = parseTimeToMinutes(item.endTime || formatMinutesToTime(start + (getServiceDuration(item.serviceCode) || 30)));
          return Math.max(max, end);
        }, parseTimeToMinutes('08:00'))
      : parseTimeToMinutes('08:00');

    let startMinutes = appointments.length > 0 ? priorEndMinutes + 5 : parseTimeToMinutes('08:00');
    const morningLimit = parseTimeToMinutes('11:30');
    const eveningStart = parseTimeToMinutes('14:00');
    const eveningLimit = parseTimeToMinutes('19:30');

    if (startMinutes < morningLimit && startMinutes + duration > morningLimit) {
      startMinutes = eveningStart;
    }

    if (startMinutes >= eveningStart && startMinutes + duration > eveningLimit) {
      startMinutes = parseTimeToMinutes('08:00');
    }

    const newRow = {
      id: newId,
      time: formatMinutesToTime(startMinutes),
      name: 'Bệnh nhân mới',
      phone: '',
      date: dDisplay,
      groupCode: 'GR001',
      serviceCode: 'TR001',
      optionId: '',
      tooth: '',
      visitNumber: 1,
      doctor: 'Bs.Dinh',
      status: 'Đã đặt',
      note: '',
      payments: [{ installment: 1, amount: '' }],
      duration,
      endTime: formatMinutesToTime(startMinutes + duration)
    };

    const updated = [...appointments, newRow];
    updateCurrentAppointments(updated);
    setSelectedItem(newRow);
  };

  const handleExportCsv = () => {
    const headers = ['id', 'time', 'name', 'phone', 'date', 'groupCode', 'serviceCode', 'optionId', 'tooth', 'visitNumber', 'doctor', 'status', 'note', 'paymentInstallments'];
    const rows = appointments.map((item) => {
      const payments = getPaymentEntries(item).map((entry) => `${entry.installment}:${entry.amount || 0}`).join('|');
      return [
        item.id,
        item.time || '',
        item.name || '',
        item.phone || '',
        item.date || '',
        item.groupCode || '',
        item.serviceCode || '',
        item.optionId || '',
        item.tooth || '',
        item.visitNumber || 1,
        item.doctor || '',
        item.status || '',
        item.note || '',
        payments
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dental_schedule_${currentKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return;

    const headers = parseCsvLine(lines[0]);
    const importedRows = lines.slice(1).map((line) => parseCsvLine(line));
    const mapped = importedRows
      .map((cols) => {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = cols[index] ?? '';
        });
        return row;
      })
      .filter((row) => row.id || row.name || row.phone)
      .map((row) => ({
        id: String(row.id || `${Date.now()}-${Math.random()}`),
        time: row.time || '08:00',
        name: row.name || 'Bệnh nhân mới',
        phone: row.phone || '',
        date: row.date || formatDateDisplay(selectedDate),
        groupCode: row.groupCode || 'GR001',
        serviceCode: row.serviceCode || 'TR001',
        optionId: row.optionId || '',
        tooth: row.tooth || '',
        visitNumber: Number(row.visitNumber) || 1,
        doctor: row.doctor || 'Bs.Dinh',
        status: row.status || 'Đã đặt',
        note: row.note || '',
        payments: (() => {
          const raw = row.paymentInstallments || '';
          if (!raw) return [{ installment: 1, amount: '' }];
          return raw.split('|').filter(Boolean).map((segment) => {
            const [installmentText, amountText] = segment.split(':');
            return {
              installment: Number(installmentText) || 1,
              amount: amountText || ''
            };
          });
        })(),
        duration: getVisitDuration(row.serviceCode || 'TR001', Number(row.visitNumber) || 1),
        endTime: formatMinutesToTime(parseTimeToMinutes(row.time || '08:00') + getVisitDuration(row.serviceCode || 'TR001', Number(row.visitNumber) || 1))
      }));

    updateCurrentAppointments(mapped.length ? mapped : []);
    setSelectedItem(mapped[0] || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteSelectedRow = () => {
    if (!selectedItem) return;
    const updated = appointments.filter((item) => item.id !== selectedItem.id);
    updateCurrentAppointments(updated);
    setSelectedItem(updated[0] || null);
  };

  const openToothModal = (item) => {
    setActiveToothModal(item);
  };

  const handleConfirm = () => {
    setActiveToothModal(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#F7F9FC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: '13px', color: '#1e293b' }}>
      <style>{`\n        @keyframes fadeIn {\n          from { opacity: 0; transform: translateY(-10px); }\n          to { opacity: 1; transform: translateY(0); }\n        }\n      `}</style>

      <AppHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedDate={selectedDate}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        handleShiftDate={handleShiftDate}
        handleDateChange={handleDateChange}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#fff', borderRadius: '0 0 16px 16px' }}>
        <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
          <button onClick={handleExportCsv} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#475569', fontWeight: '500', borderRadius: '10px', padding: '6px 8px', transition: 'all 0.25s ease' }}>
            <Upload size={15} /> Xuất file
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#475569', fontWeight: '500', borderRadius: '10px', padding: '6px 8px', transition: 'all 0.25s ease' }}>
            <Download size={15} /> Nhập file
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={handleImportCsv} />
          <button onClick={() => setShowFilterPanel(!showFilterPanel)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#475569', fontWeight: '500', borderRadius: '10px', padding: '6px 8px', transition: 'all 0.25s ease' }}>
            <Filter size={15} /> Lọc
          </button>
          {showFilterPanel && (
            <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: 0, backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '16px', boxShadow: '0 18px 30px rgba(15, 23, 42, 0.08)', padding: '12px', minWidth: '220px', zIndex: 20, animation: 'fadeIn 0.25s ease' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Bộ lọc</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#475569' }}>
                  Trạng thái
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px 10px', fontSize: '12px', backgroundColor: '#fff' }}>
                    <option>Tất cả</option>
                    <option>Đã đặt</option>
                    <option>Đang khám</option>
                    <option>Chờ đến lượt</option>
                    <option>Hoàn thành</option>
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#475569' }}>
                  Bác sĩ
                  <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px 10px', fontSize: '12px', backgroundColor: '#fff' }}>
                    <option>Tất cả</option>
                    {DOCTORS.map((doctor) => (
                      <option key={doctor} value={doctor}>{doctor}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#475569', fontWeight: '500', borderRadius: '10px', padding: '6px 8px', transition: 'all 0.25s ease' }}>
            <Settings size={15} /> Cài đặt cột
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleDeleteSelectedRow} disabled={!selectedItem} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #fecaca', backgroundColor: selectedItem ? '#fff1f2' : '#f8fafc', borderRadius: '12px', padding: '6px 12px', cursor: selectedItem ? 'pointer' : 'not-allowed', fontWeight: '500', color: selectedItem ? '#dc2626' : '#94a3b8', transition: 'all 0.25s ease' }}>
            <Trash2 size={14} /> Xóa dòng
          </button>
          <button onClick={handleAddRow} className="primary-button" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Thêm dòng
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <AppointmentTable
          appointments={appointments}
          visibleAppointments={visibleAppointments}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          handleCellChange={handleCellChange}
          handleVisitStep={handleVisitStep}
          getPaymentEntries={getPaymentEntries}
          handlePaymentAmountChange={(id, installment, amount) => {
            const normalizedAmount = formatMoneyDigits(amount);
            const updated = appointments.map((item) => {
              if (item.id !== id) return item;
              const entries = normalizePaymentEntries(item.payments, item.visitNumber || 1).map((entry) => {
                if (Number(entry.installment) === Number(installment)) {
                  return { ...entry, amount: normalizedAmount };
                }
                return entry;
              });
              return { ...item, payments: entries };
            });
            updateCurrentAppointments(updated);
            setSelectedItem(updated.find((item) => item.id === id) || null);
          }}
          paymentListOpenId={paymentListOpenId}
          setPaymentListOpenId={setPaymentListOpenId}
          handleAddRow={handleAddRow}
          getBadgeStyle={getBadgeStyle}
          onOpenToothModal={openToothModal}
        />

        {selectedItem && (
          <DetailPanel
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            handleCellChange={handleCellChange}
            handleVisitStep={handleVisitStep}
            openToothModal={openToothModal}
          />
        )}
      </div>

      <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '36px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
        <div>
          Tổng số lịch hẹn ngày <strong style={{ color: '#2563eb' }}>{selectedDate.getDate()}/{selectedDate.getMonth() + 1}</strong>: <strong style={{ color: '#0f172a' }}>{appointments.length}</strong>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Đã đặt: <strong style={{ color: '#0369a1' }}>{appointments.filter((a) => a.status === 'Đã đặt').length}</strong></span>
          <span>Đang khám: <strong style={{ color: '#d97706' }}>{appointments.filter((a) => a.status === 'Đang khám').length}</strong></span>
          <span>Chờ đến lượt: <strong style={{ color: '#7e22ce' }}>{appointments.filter((a) => a.status === 'Chờ đến lượt').length}</strong></span>
          <span>Hoàn thành: <strong style={{ color: '#15803d' }}>{appointments.filter((a) => a.status === 'Hoàn thành').length}</strong></span>
        </div>
      </footer>

      {activeToothModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '12px', width: '640px', padding: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Sơ đồ chọn vị trí răng</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Bệnh nhân: <strong>{activeToothModal.name}</strong> ({activeToothModal.id})</p>
              </div>
              <X size={20} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => setActiveToothModal(null)} />
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#2563eb', marginBottom: '8px', textAlign: 'center' }}>HÀM TRÊN</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
                {TEETH_UPPER.map((tooth) => {
                  const isSelected = (activeToothModal.tooth || '').includes(tooth);
                  return (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => handleToggleToothSelect(tooth)}
                      style={{
                        padding: '6px 8px', borderRadius: '6px', border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        backgroundColor: isSelected ? '#2563eb' : '#fff', color: isSelected ? '#fff' : '#334155',
                        fontWeight: '600', cursor: 'pointer', fontSize: '11px', minWidth: '34px'
                      }}
                    >
                      {tooth}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #cbd5e1', margin: '4px 0' }} />

            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#2563eb', marginBottom: '8px', textAlign: 'center' }}>HÀM DƯỚI</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
                {TEETH_LOWER.map((tooth) => {
                  const isSelected = (activeToothModal.tooth || '').includes(tooth);
                  return (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => handleToggleToothSelect(tooth)}
                      style={{
                        padding: '6px 8px', borderRadius: '6px', border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        backgroundColor: isSelected ? '#2563eb' : '#fff', color: isSelected ? '#fff' : '#334155',
                        fontWeight: '600', cursor: 'pointer', fontSize: '11px', minWidth: '34px'
                      }}
                    >
                      {tooth}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px' }}>
                Đã chọn: <strong style={{ color: '#2563eb' }}>{activeToothModal.tooth || 'Chưa chọn răng nào'}</strong>
              </div>
              <button
                type="button"
                onClick={handleConfirm}
                style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 16px', cursor: 'pointer', fontWeight: '700' }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
