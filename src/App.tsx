import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Trash2,
  Plus,
  Download,
  Upload,
  Filter,
  Settings,
  X,
  Printer,
  Sparkles,
  CalendarDays,
  CheckCircle2,
  RotateCcw,
  FileSpreadsheet,
  Cloud,
  CloudOff,
  MessageCircle
} from 'lucide-react';
import { User, onAuthStateChanged } from 'firebase/auth';
import AppHeader from './components/AppHeader';
import AppointmentTable from './components/AppointmentTable';
import DetailPanel from './components/DetailPanel';
import ToothModal from './components/ToothModal';
import DentalChairTimeline from './components/DentalChairTimeline';

import ColumnSettingsModal, { ColumnVisibility } from './components/ColumnSettingsModal';
import BackupManagerModal from './components/BackupManagerModal';
import ExcelSyncModal from './components/ExcelSyncModal';
import ZaloNotificationModal from './components/ZaloNotificationModal';
import {
  MULTI_VISIT_CODES,
  FULL_MOUTH_CODES,
  DOCTORS,
  CHAIRS,
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
  initialSheets,
  AppointmentItem,
  PaymentEntry
} from './data/dentalData';
import {
  auth,
  loginWithGoogle,
  logoutGoogle,
  saveDailySchedule,
  loadDailySchedule,
  subscribeDailySchedule,
  testFirestoreConnection
} from './lib/firebase';
import {
  BackupHistoryItem,
  exportDentalScheduleToExcel,
  createDentalExcelWorkbook
} from './lib/excelBackup';

const formatMoneyDigits = (value: string | number): string =>
  String(value ?? '').replace(/\D/g, '');

const formatMoneyDisplay = (value: string | number): string => {
  const digits = formatMoneyDigits(value);
  if (!digits) return '';
  return Number(digits).toLocaleString('vi-VN');
};

const getBadgeStyle = (status: string) => {
  switch (status) {
    case 'Đã đặt':
      return { bg: '#DBEAFE', color: '#1D4ED8' }; // Bright Blue
    case 'Đã khám':
      return { bg: '#CCFBF1', color: '#0F766E' }; // Medical Teal
    case 'Đang khám':
      return { bg: '#FEF3C7', color: '#B45309' }; // Amber
    case 'Chờ đến lượt':
    case 'Chờ khám':
      return { bg: '#F3E8FF', color: '#7E22CE' }; // Purple
    case 'Hủy':
      return { bg: '#FEE2E2', color: '#B91C1C' }; // Red
    case 'Hoàn thành':
      return { bg: '#DCFCE7', color: '#15803D' }; // Green
    default:
      return { bg: '#F1F5F9', color: '#475569' };
  }
};

const normalizePaymentEntries = (
  payments: PaymentEntry[] = [],
  visitNumber = 1
): PaymentEntry[] => {
  const entries: PaymentEntry[] = Array.isArray(payments) ? payments.slice() : [];
  const installment = Math.max(1, Number(visitNumber) || 1);
  const normalized = entries.map((entry) => ({
    ...entry,
    installment: Math.max(1, Number(entry.installment) || installment),
    amount: formatMoneyDigits(entry.amount ?? '')
  }));

  const existing = normalized.find((entry) => Number(entry.installment) === installment);
  if (!existing) {
    normalized.push({ installment, amount: '', method: 'Tiền mặt' });
  }

  return normalized.sort((a, b) => Number(a.installment) - Number(b.installment));
};

const getPaymentEntries = (item: AppointmentItem): PaymentEntry[] =>
  normalizePaymentEntries(item.payments, item.visitNumber || 1);

const recalculateSequentialTimes = (items: AppointmentItem[]): AppointmentItem[] => {
  let cursorMinutes = parseTimeToMinutes('08:00');

  return items.map((item, index) => {
    const duration = getVisitDuration(item.serviceCode, item.visitNumber || 1) || 30;
    let startMinutes = index === 0 ? parseTimeToMinutes(item.time || '08:00') : cursorMinutes + 5;
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

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
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

const calculateAutoVisitNumber = (
  name: string,
  phone: string,
  serviceCode: string,
  currentDate: string,
  currentId: string,
  allList: AppointmentItem[]
): number => {
  if (!MULTI_VISIT_CODES.includes(serviceCode)) return 1;

  const maxAllowed = getVisitMax(serviceCode);
  const history = allList.filter(
    (item) =>
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
  return Math.min(sameDateItem ? sameDateItem.visitNumber || 1 : 1, maxAllowed);
};

export default function App() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2024, 4, 18));
  const [sheetsData, setSheetsData] = useState<Record<string, AppointmentItem[]>>(() => {
    try {
      const saved = localStorage.getItem('dental_scheduler_sheets_v2');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return initialSheets;
  });

  const [selectedItem, setSelectedItem] = useState<AppointmentItem | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string | null; field: string | null }>({
    id: null,
    field: null
  });
  const [activeToothModal, setActiveToothModal] = useState<AppointmentItem | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showZaloModal, setShowZaloModal] = useState(false);
  const [zaloTargetPatient, setZaloTargetPatient] = useState<AppointmentItem | null>(null);
  const [droppedExcelFile, setDroppedExcelFile] = useState<File | null>(null);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [dragOverlay, setDragOverlay] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [filterDoctor, setFilterDoctor] = useState('Tất cả');
  const [paymentListOpenId, setPaymentListOpenId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'table' | 'timeline'>('table');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Firebase Auth & Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // 10-Minute Auto Backup State
  const [nextBackupInSeconds, setNextBackupInSeconds] = useState<number>(600); // 10 minutes = 600s
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    return localStorage.getItem('dental_last_backup_time') || null;
  });
  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('dental_backup_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    id: true,
    time: true,
    name: true,
    phone: true,
    groupCode: true,
    serviceCode: true,
    tooth: true,
    visitNumber: true,
    doctor: true,
    status: true,
    payments: true,
    note: true
  });

  const currentKey = formatDateToKey(selectedDate);
  const appointments = sheetsData[currentKey] || [];

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setIsCloudSynced(true);
      }
    });
    testFirestoreConnection().then((connected) => {
      if (connected) setIsCloudSynced(true);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time updates for selected date
  useEffect(() => {
    if (!currentKey) return;

    // Load initial from Firestore
    loadDailySchedule(currentKey).then((cloudAppts) => {
      if (cloudAppts && cloudAppts.length > 0) {
        setSheetsData((prev) => ({
          ...prev,
          [currentKey]: cloudAppts
        }));
      }
    });

    // Realtime listener
    const unsub = subscribeDailySchedule(
      currentKey,
      (cloudAppts) => {
        if (cloudAppts && cloudAppts.length > 0) {
          setSheetsData((prev) => ({
            ...prev,
            [currentKey]: cloudAppts
          }));
        }
      },
      () => {
        // Fallback to offline local storage
      }
    );

    return () => unsub();
  }, [currentKey]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dental_scheduler_sheets_v2', JSON.stringify(sheetsData));
    } catch {
      // ignore
    }
  }, [sheetsData]);

  // Keep selected item synced
  useEffect(() => {
    if (!selectedItem && appointments.length > 0) {
      setSelectedItem(appointments[0]);
    } else if (selectedItem) {
      const found = appointments.find((a) => a.id === selectedItem.id);
      if (found) setSelectedItem(found);
    }
  }, [appointments]);

  // Global Drag & Drop Listener for Excel Files
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
        setDragOverlay(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (
        e.clientX <= 0 ||
        e.clientY <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        setDragOverlay(false);
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverlay(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const fileName = file.name.toLowerCase();
        if (
          fileName.endsWith('.xlsx') ||
          fileName.endsWith('.xls') ||
          fileName.endsWith('.csv')
        ) {
          setDroppedExcelFile(file);
          setShowSyncModal(true);
        }
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  // Handle synchronization from Excel importer
  const handleApplySync = (
    importedData: Record<string, AppointmentItem[]>,
    mode: 'replace_current' | 'merge_current' | 'import_all',
    selectedDateToSwitch?: string
  ) => {
    let totalCount = 0;
    const nextData = { ...sheetsData };

    if (mode === 'import_all') {
      Object.entries(importedData).forEach(([dateKey, items]) => {
        const existing = nextData[dateKey] || [];
        const existingMap = new Map(existing.map((item) => [item.id, item]));
        items.forEach((item) => existingMap.set(item.id, item));
        const merged = Array.from(existingMap.values());
        nextData[dateKey] = recalculateSequentialTimes(merged);
        totalCount += items.length;
        saveDailySchedule(dateKey, nextData[dateKey]).catch(() => {});
      });
    } else if (mode === 'replace_current') {
      const items = importedData[currentKey] || Object.values(importedData)[0] || [];
      nextData[currentKey] = recalculateSequentialTimes(items);
      totalCount = items.length;
      saveDailySchedule(currentKey, nextData[currentKey]).catch(() => {});
    } else if (mode === 'merge_current') {
      const items = importedData[currentKey] || Object.values(importedData)[0] || [];
      const existing = nextData[currentKey] || [];
      const existingMap = new Map(existing.map((item) => [item.id, item]));
      items.forEach((item) => existingMap.set(item.id, item));
      const merged = Array.from(existingMap.values());
      nextData[currentKey] = recalculateSequentialTimes(merged);
      totalCount = items.length;
      saveDailySchedule(currentKey, nextData[currentKey]).catch(() => {});
    }

    setSheetsData(nextData);

    if (selectedDateToSwitch && selectedDateToSwitch !== currentKey) {
      const parts = selectedDateToSwitch.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        setSelectedDate(d);
        setSelectedItem((nextData[selectedDateToSwitch] && nextData[selectedDateToSwitch][0]) || null);
      }
    } else {
      setSelectedItem((nextData[currentKey] && nextData[currentKey][0]) || null);
    }

    setSyncToastMessage(`Đã đồng bộ thành công ${totalCount} lịch khám từ file Excel!`);
    setTimeout(() => {
      setSyncToastMessage(null);
    }, 4500);
  };

  // Execute an auto-backup snapshot
  const executeBackupSnapshot = useCallback(
    (type: 'auto' | 'manual' = 'auto') => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      // Calculate total revenue of today
      const totalRevenue = appointments.reduce((sum, item) => {
        return (
          sum +
          (item.payments || []).reduce(
            (pSum, p) => pSum + (parseInt(p.amount, 10) || 0),
            0
          )
        );
      }, 0);

      // Create workbook in memory to ensure validity
      createDentalExcelWorkbook(currentKey, appointments);

      const newHistoryItem: BackupHistoryItem = {
        id: `${Date.now()}`,
        timestamp: `${timeStr} (${formatDateDisplay(now)})`,
        dateKey: currentKey,
        totalAppointments: appointments.length,
        totalRevenue,
        type
      };

      const updatedHistory = [newHistoryItem, ...backupHistory.slice(0, 19)];
      setBackupHistory(updatedHistory);
      setLastBackupTime(timeStr);

      try {
        localStorage.setItem('dental_backup_history', JSON.stringify(updatedHistory));
        localStorage.setItem('dental_last_backup_time', timeStr);
      } catch {
        // ignore
      }
    },
    [appointments, backupHistory, currentKey]
  );

  // 10-Minute Auto-Backup Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setNextBackupInSeconds((prev) => {
        if (prev <= 1) {
          executeBackupSnapshot('auto');
          return 600; // Reset to 10 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [executeBackupSnapshot]);

  const handleTriggerBackupNow = () => {
    executeBackupSnapshot('manual');
    exportDentalScheduleToExcel(currentKey, appointments);
    setNextBackupInSeconds(600);
  };

  const visibleAppointments = appointments.filter((item) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const searchMatch =
      !normalizedSearch ||
      [
        String(item.id || ''),
        String(item.name || ''),
        String(item.phone || ''),
        String(item.serviceCode || ''),
        String(item.doctor || ''),
        String(item.tooth || ''),
        String(item.note || '')
      ].some((value) => value.toLowerCase().includes(normalizedSearch));

    const statusMatch = filterStatus === 'Tất cả' || item.status === filterStatus;
    const doctorMatch = filterDoctor === 'Tất cả' || item.doctor === filterDoctor;
    return searchMatch && statusMatch && doctorMatch;
  });

  const handleDateChange = (newDate: Date) => {
    const key = formatDateToKey(newDate);
    setSelectedDate(newDate);

    if (!sheetsData[key]) {
      setSheetsData((prev) => ({ ...prev, [key]: [] }));
      setSelectedItem(null);
    } else {
      setSelectedItem(sheetsData[key][0] || null);
    }
  };

  const handleShiftDate = (days: number) => {
    const updated = new Date(selectedDate);
    updated.setDate(updated.getDate() + days);
    handleDateChange(updated);
  };

  const updateCurrentAppointments = (newAppointments: AppointmentItem[]) => {
    setSheetsData((prev) => ({ ...prev, [currentKey]: newAppointments }));
    // Save to Firebase asynchronously
    saveDailySchedule(currentKey, newAppointments).catch(() => {
      // Local copy already saved
    });
  };

  const handleCellChange = (id: string, field: string, value: any) => {
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

      const updatedItem: AppointmentItem = { ...item, [field]: value };

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

    const reordered = recalculateSequentialTimes(updated);
    updateCurrentAppointments(reordered);
    setSelectedItem(reordered.find((item) => item.id === id) || null);
  };

  const handleVisitStep = (id: string, delta: number) => {
    const updated = appointments.map((item) => {
      if (item.id !== id) return item;

      const maxVisit = getVisitMax(item.serviceCode);
      const currentVisit = item.visitNumber || 1;
      const newVisit = Math.min(maxVisit, Math.max(1, currentVisit + delta));
      const currentPayments = normalizePaymentEntries(item.payments, currentVisit);
      const nextPayments = currentPayments.some((entry) => Number(entry.installment) === newVisit)
        ? currentPayments
        : [...currentPayments, { installment: newVisit, amount: '', method: 'Tiền mặt' }];

      const updatedItem: AppointmentItem = {
        ...item,
        visitNumber: newVisit,
        duration: getVisitDuration(item.serviceCode, newVisit),
        payments: nextPayments.sort((a, b) => Number(a.installment) - Number(b.installment))
      };

      const duration = updatedItem.duration || getVisitDuration(item.serviceCode, newVisit) || 30;
      updatedItem.duration = duration;
      const startMinutes = parseTimeToMinutes(updatedItem.time || '08:00');
      updatedItem.endTime = formatMinutesToTime(startMinutes + duration);
      return updatedItem;
    });

    const reordered = recalculateSequentialTimes(updated);
    updateCurrentAppointments(reordered);
    setSelectedItem(reordered.find((item) => item.id === id) || null);
  };

  const handleToggleToothSelect = (toothCode: string) => {
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

  const handleSetTeethString = (teethStr: string) => {
    if (!activeToothModal) return;
    setActiveToothModal({ ...activeToothModal, tooth: teethStr });
    handleCellChange(activeToothModal.id, 'tooth', teethStr);
  };

  const handleAddRow = (chairName?: string) => {
    let lastNum = 34245 + appointments.length;
    const lastItem = appointments[appointments.length - 1];
    if (lastItem && !Number.isNaN(parseInt(lastItem.id, 10))) {
      lastNum = parseInt(lastItem.id, 10);
    }

    const dDisplay = formatDateDisplay(selectedDate);
    const newId = String(lastNum + 1);
    const duration = getVisitDuration('TR001', 1);

    const priorEndMinutes =
      appointments.length > 0
        ? appointments.reduce((max, item) => {
            const start = parseTimeToMinutes(item.time || '08:00');
            const end = parseTimeToMinutes(
              item.endTime ||
                formatMinutesToTime(start + (getServiceDuration(item.serviceCode) || 30))
            );
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

    const newRow: AppointmentItem = {
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
      payments: [{ installment: 1, amount: '', method: 'Tiền mặt' }],
      duration,
      endTime: formatMinutesToTime(startMinutes + duration),
      chair: chairName || CHAIRS[0]
    };

    const updated = [...appointments, newRow];
    updateCurrentAppointments(updated);
    setSelectedItem(newRow);
  };

  const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return;

    const headers = parseCsvLine(lines[0]);
    const importedRows = lines.slice(1).map((line) => parseCsvLine(line));
    const mapped: AppointmentItem[] = importedRows
      .map((cols) => {
        const row: Record<string, string> = {};
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
        status: (row.status as any) || 'Đã đặt',
        note: row.note || '',
        payments: (() => {
          const raw = row.paymentInstallments || '';
          if (!raw) return [{ installment: 1, amount: '', method: 'Tiền mặt' }];
          return raw
            .split('|')
            .filter(Boolean)
            .map((segment) => {
              const [installmentText, amountText] = segment.split(':');
              return {
                installment: Number(installmentText) || 1,
                amount: amountText || '',
                method: 'Tiền mặt'
              };
            });
        })(),
        duration: getVisitDuration(row.serviceCode || 'TR001', Number(row.visitNumber) || 1),
        endTime: formatMinutesToTime(
          parseTimeToMinutes(row.time || '08:00') +
            getVisitDuration(row.serviceCode || 'TR001', Number(row.visitNumber) || 1)
        ),
        chair: row.chair || CHAIRS[0]
      }));

    updateCurrentAppointments(mapped.length ? mapped : []);
    setSelectedItem(mapped[0] || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteSelectedRow = () => {
    if (!selectedItem) return;
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa lịch hẹn của bệnh nhân "${selectedItem.name}" (#${selectedItem.id}) không?`
    );
    if (!confirmDelete) return;

    const updated = appointments.filter((item) => item.id !== selectedItem.id);
    updateCurrentAppointments(updated);
    setSelectedItem(updated[0] || null);
  };

  const handleResetData = () => {
    if (window.confirm('Khôi phục lại toàn bộ dữ liệu mẫu ban đầu của phòng khám?')) {
      setSheetsData(initialSheets);
      localStorage.removeItem('dental_scheduler_sheets_v2');
      setSelectedItem(initialSheets[currentKey]?.[0] || null);
    }
  };

  const openToothModal = (item: AppointmentItem) => {
    setActiveToothModal(item);
  };

  const handleOpenZaloModal = (patient?: AppointmentItem | null) => {
    if (patient) {
      setZaloTargetPatient(patient);
      setSelectedItem(patient);
    } else if (selectedItem) {
      setZaloTargetPatient(selectedItem);
    } else if (appointments.length > 0) {
      setZaloTargetPatient(appointments[0]);
    }
    setShowZaloModal(true);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 text-[13px] font-sans antialiased overflow-hidden select-none">
      {/* Top Application Header */}
      <AppHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedDate={selectedDate}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        handleShiftDate={handleShiftDate}
        handleDateChange={handleDateChange}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onResetData={handleResetData}
        onOpenBackupModal={() => setShowBackupModal(true)}
        nextBackupInSeconds={nextBackupInSeconds}
        lastBackupTime={lastBackupTime}
        onOpenZaloModal={() => handleOpenZaloModal()}
        currentUser={currentUser}
        onLoginGoogle={loginWithGoogle}
        onLogoutGoogle={logoutGoogle}
        isCloudSynced={isCloudSynced}
      />

      {/* Main Sub-Toolbar with High-Contrast Solid Borders */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b-2 border-slate-300 z-10 shadow-xs">
        <div className="flex items-center gap-2 relative">
          {/* Zalo Direct Button */}
          <button
            type="button"
            onClick={() => handleOpenZaloModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 border border-blue-400 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Gửi tin nhắn nhắc hẹn tự động qua Zalo cho bệnh nhân"
          >
            <MessageCircle size={15} className="text-blue-700" />
            <span>Nhắc hẹn Zalo</span>
          </button>

          {/* Excel Export Button */}
          <button
            type="button"
            onClick={() => exportDentalScheduleToExcel(currentKey, appointments)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-400 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Xuất bảng lịch hẹn ra file Excel (.xlsx) đa bảng tính"
          >
            <FileSpreadsheet size={15} className="text-emerald-700" />
            <span>Xuất Excel</span>
          </button>

          {/* Excel Import & Sync Button */}
          <button
            type="button"
            onClick={() => setShowSyncModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-400 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Đồng bộ lịch khám từ file Excel hoặc kéo thả file trực tiếp"
          >
            <Upload size={14} className="text-blue-700" />
            <span>Đồng bộ Excel</span>
            <span className="hidden lg:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-200 text-blue-900">
              Kéo thả
            </span>
          </button>

          {/* Filter Popover Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                filterStatus !== 'Tất cả' || filterDoctor !== 'Tất cả'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Filter size={14} />
              <span>
                Bộ lọc
                {filterStatus !== 'Tất cả' || filterDoctor !== 'Tất cả' ? ' (Đang lọc)' : ''}
              </span>
            </button>

            {showFilterPanel && (
              <div className="absolute top-[calc(100%+8px)] left-0 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 min-w-[250px] z-30 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                  <span className="font-bold text-xs text-slate-800">Bộ lọc lịch khám</span>
                  <button
                    type="button"
                    onClick={() => setShowFilterPanel(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Trạng thái ca khám:
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2 text-xs bg-white text-slate-800 outline-none focus:border-blue-500"
                    >
                      <option>Tất cả</option>
                      <option>Đã đặt</option>
                      <option>Chờ đến lượt</option>
                      <option>Đang khám</option>
                      <option>Đã khám</option>
                      <option>Hoàn thành</option>
                      <option>Hủy</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Bác sĩ khám:
                    </label>
                    <select
                      value={filterDoctor}
                      onChange={(e) => setFilterDoctor(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2 text-xs bg-white text-slate-800 outline-none focus:border-blue-500"
                    >
                      <option>Tất cả</option>
                      {DOCTORS.map((doc) => (
                        <option key={doc} value={doc}>
                          {doc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterStatus('Tất cả');
                        setFilterDoctor('Tất cả');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                    >
                      Đặt lại
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFilterPanel(false)}
                      className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column Settings */}
          <button
            type="button"
            onClick={() => setShowColumnSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Settings size={14} className="text-slate-500" />
            <span>Cài đặt cột</span>
          </button>
        </div>

        {/* Right Row Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDeleteSelectedRow}
            disabled={!selectedItem}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              selectedItem
                ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-2xs'
                : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <Trash2 size={13} />
            <span>Xóa dòng</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddRow()}
            className="primary-button flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} />
            <span>Thêm ca khám mới</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Table or Dental Chair Timeline + Side Detail Panel */}
      <div className="flex flex-1 overflow-hidden">
        {currentView === 'table' ? (
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
                const entries = normalizePaymentEntries(item.payments, item.visitNumber || 1).map(
                  (entry) => {
                    if (Number(entry.installment) === Number(installment)) {
                      return { ...entry, amount: normalizedAmount };
                    }
                    return entry;
                  }
                );
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
            onOpenZalo={(item) => handleOpenZaloModal(item)}
            columnVisibility={columnVisibility}
          />
        ) : (
          <DentalChairTimeline
            appointments={appointments}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            getBadgeStyle={getBadgeStyle}
            onAddAppointmentForChair={(chairName) => handleAddRow(chairName)}
          />
        )}

        {/* Detail Panel */}
        {selectedItem && (
          <DetailPanel
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            handleCellChange={handleCellChange}
            handleVisitStep={handleVisitStep}
            openToothModal={openToothModal}
            onOpenZaloModal={(item) => handleOpenZaloModal(item)}
            onDeleteRow={handleDeleteSelectedRow}
          />
        )}
      </div>

      {/* Bottom Footer Statistics Bar with Clean Medical Theme */}
      <footer className="flex items-center justify-between px-5 h-9 bg-white text-slate-600 text-xs border-t border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <span>
            Tổng ca khám ngày{' '}
            <strong className="text-blue-600 font-semibold font-mono">
              {formatDateDisplay(selectedDate)}
            </strong>
            : <strong className="text-slate-900 font-bold font-mono">{appointments.length}</strong>
          </span>

          <span className="text-slate-300">|</span>

          <span className="text-slate-500 text-[11px] hidden md:inline">
            Tự sao lưu Excel định kỳ mỗi 10 phút · Đồng bộ Cloud Firestore
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Đã đặt:{' '}
            <strong className="text-slate-800 font-mono font-semibold">
              {appointments.filter((a) => a.status === 'Đã đặt').length}
            </strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Đang khám:{' '}
            <strong className="text-slate-800 font-mono font-semibold">
              {appointments.filter((a) => a.status === 'Đang khám').length}
            </strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Chờ khám:{' '}
            <strong className="text-slate-800 font-mono font-semibold">
              {appointments.filter((a) => a.status === 'Chờ đến lượt' || a.status === 'Chờ khám').length}
            </strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Hoàn thành:{' '}
            <strong className="text-slate-800 font-mono font-semibold">
              {appointments.filter((a) => a.status === 'Hoàn thành' || a.status === 'Đã khám').length}
            </strong>
          </span>
        </div>
      </footer>

      {/* Interactive Tooth FDI Modal */}
      {activeToothModal && (
        <ToothModal
          activeToothModal={activeToothModal}
          onClose={() => setActiveToothModal(null)}
          onToggleToothSelect={handleToggleToothSelect}
          onSetTeethString={handleSetTeethString}
        />
      )}

      {/* Column Customization Modal */}
      <ColumnSettingsModal
        isOpen={showColumnSettings}
        onClose={() => setShowColumnSettings(false)}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      />

      {/* 10-Minute Excel Auto-Backup & Restore Center Modal */}
      <BackupManagerModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        dateKey={currentKey}
        appointments={appointments}
        allSheetsData={sheetsData}
        backupHistory={backupHistory}
        onTriggerBackupNow={handleTriggerBackupNow}
        nextBackupInSeconds={nextBackupInSeconds}
        lastBackupTime={lastBackupTime}
      />

      {/* Excel Drag & Drop Synchronization Modal */}
      <ExcelSyncModal
        isOpen={showSyncModal}
        onClose={() => {
          setShowSyncModal(false);
          setDroppedExcelFile(null);
        }}
        currentDateKey={currentKey}
        initialFile={droppedExcelFile}
        onApplySync={handleApplySync}
      />

      {/* Global Drag & Drop Overlay Indicator */}
      {dragOverlay && (
        <div className="fixed inset-0 z-50 bg-blue-600/20 backdrop-blur-xs border-4 border-dashed border-blue-500 m-4 rounded-3xl flex flex-col items-center justify-center pointer-events-none transition-all">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-sm animate-bounce border border-blue-100">
            <FileSpreadsheet size={48} className="text-emerald-600 mb-3" />
            <h3 className="text-base font-bold text-slate-800">Thả file Excel vào đây</h3>
            <p className="text-xs text-slate-500 mt-1">
              Phần mềm sẽ tự động đọc bảng lịch hẹn và đồng bộ ngay lập tức!
            </p>
          </div>
        </div>
      )}

      {/* Floating Sync Notification Toast */}
      {syncToastMessage && (
        <div className="fixed bottom-12 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 text-xs font-semibold">
          <CheckCircle2 size={18} />
          <span>{syncToastMessage}</span>
          <button
            type="button"
            onClick={() => setSyncToastMessage(null)}
            className="ml-2 hover:bg-emerald-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Zalo Automated Notification Center Modal */}
      <ZaloNotificationModal
        isOpen={showZaloModal}
        onClose={() => setShowZaloModal(false)}
        appointments={appointments}
        selectedPatient={zaloTargetPatient}
        onSelectPatient={(item) => {
          setZaloTargetPatient(item);
          setSelectedItem(item);
        }}
        currentDateDisplay={formatDateDisplay(selectedDate)}
      />
    </div>
  );
}
