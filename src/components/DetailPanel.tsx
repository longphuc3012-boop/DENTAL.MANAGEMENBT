import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Calendar,
  Clock,
  Award,
  Sparkles,
  CreditCard,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  FileText,
  Printer,
  Copy,
  Check,
  Send,
  Trash2,
  ChevronRight,
  ShieldAlert,
  Wallet,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import {
  AppointmentItem,
  DOCTORS,
  CHAIRS,
  treatmentGroups,
  findTreatment,
  getServiceTotalCost,
  getVisitMax,
  getVisitDescription,
  TEETH_DESCRIPTIONS
} from '../data/dentalData';

interface DetailPanelProps {
  selectedItem: AppointmentItem;
  setSelectedItem: (item: AppointmentItem | null) => void;
  handleCellChange: (id: string, field: string, value: any) => void;
  handleVisitStep: (id: string, delta: number) => void;
  openToothModal: (item: AppointmentItem) => void;
  onOpenZaloModal?: (item: AppointmentItem) => void;
  onDeleteRow?: () => void;
}

const formatVND = (digits: string | number) => {
  const clean = String(digits || '').replace(/\D/g, '');
  if (!clean || clean === '0') return '0 đ';
  return `${Number(clean).toLocaleString('vi-VN')} đ`;
};

export default function DetailPanel({
  selectedItem,
  setSelectedItem,
  handleCellChange,
  handleVisitStep,
  openToothModal,
  onOpenZaloModal,
  onDeleteRow
}: DetailPanelProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedMessageNotice, setCopiedMessageNotice] = useState(false);
  const [activeTab, setActiveTab] = useState<'treatment' | 'billing' | 'notes'>('treatment');
  const [showZaloMessage, setShowZaloMessage] = useState(false);

  const treatment = findTreatment(selectedItem.serviceCode);
  const totalCost = getServiceTotalCost(selectedItem.serviceCode, selectedItem.optionId);
  const maxVisits = getVisitMax(selectedItem.serviceCode);
  const currentVisit = selectedItem.visitNumber || 1;
  const visitDescription = getVisitDescription(selectedItem.serviceCode, currentVisit);

  const currentGroup = treatmentGroups[selectedItem.groupCode] || treatmentGroups.GR001;
  const availableTreatments = currentGroup?.treatments || {};
  const currentOptions = treatment?.options || [];

  const payments = selectedItem.payments || [];
  const totalPaid = payments.reduce(
    (sum, p) => sum + (parseInt(p.amount, 10) || 0),
    0
  );
  const remaining = Math.max(0, totalCost - totalPaid);

  const handleCopyPhone = () => {
    if (!selectedItem.phone) return;
    navigator.clipboard.writeText(selectedItem.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 1500);
  };

  const handleAddPaymentInstallment = () => {
    const nextInstallment = payments.length + 1;
    const updated = [
      ...payments,
      { installment: nextInstallment, amount: '', method: 'Tiền mặt' }
    ];
    handleCellChange(selectedItem.id, 'payments', updated);
  };

  const reminderText = `Kính gửi Quý khách ${selectedItem.name}, Nha Khoa SmileCare xin nhắc lịch hẹn khám vào lúc ${selectedItem.time} ngày ${selectedItem.date} với Bác sĩ ${selectedItem.doctor}. Quý khách vui lòng đến trước 10 phút để được chuẩn bị chu đáo nhất. Hotline phòng khám: 0900-123-456.`;

  const selectedTeethList = selectedItem.tooth
    ? selectedItem.tooth.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <aside className="w-[380px] lg:w-[420px] bg-white border-l border-slate-300 flex flex-col h-full overflow-hidden shadow-lg animate-in slide-in-from-right duration-200 z-20">
      {/* Clean Header */}
      <div className="p-4 bg-slate-100 border-b border-slate-300 text-slate-900 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
            {selectedItem.name ? selectedItem.name.charAt(0).toUpperCase() : 'BN'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-950 text-sm leading-tight">
                {selectedItem.name || 'Bệnh nhân mới'}
              </h2>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold border border-slate-300">
                #{selectedItem.id}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-2">
              <span>{selectedItem.chair || 'Ghế 1'}</span>
              <span>·</span>
              <span>{selectedItem.date}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSelectedItem(null)}
          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          title="Đóng bảng chi tiết"
        >
          <X size={18} />
        </button>
      </div>

      {/* Quick Action Contact Bar */}
      <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-mono font-bold text-slate-900">
          <Phone size={14} className="text-blue-600" />
          <span>{selectedItem.phone || 'Chưa có SĐT'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyPhone}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800 transition-colors cursor-pointer"
            title="Sao chép SĐT"
          >
            {copiedPhone ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
            <span>{copiedPhone ? 'Đã chép' : 'Copy SĐT'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenZaloModal) {
                onOpenZaloModal(selectedItem);
              } else {
                setShowZaloMessage((prev) => !prev);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
            title="Gửi thông báo Zalo tự động"
          >
            <MessageCircle size={13} />
            <span>Gửi Zalo</span>
          </button>
        </div>
      </div>

      {/* Zalo Reminder Preview Drawer */}
      {showZaloMessage && (
        <div className="p-3 bg-blue-50 border-b border-blue-300 text-xs animate-in fade-in">
          <div className="flex items-center justify-between font-bold text-blue-950 mb-1.5">
            <span>Mẫu tin nhắn nhắc hẹn:</span>
            {copiedMessageNotice && (
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <Check size={12} /> Đã chép tin nhắn!
              </span>
            )}
          </div>
          <p className="text-slate-900 font-mono text-[11px] leading-relaxed p-2.5 bg-white rounded-xl border border-blue-300 shadow-2xs whitespace-pre-wrap select-text">
            {reminderText}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-200">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(reminderText);
                setCopiedMessageNotice(true);
                setTimeout(() => setCopiedMessageNotice(false), 2000);
              }}
              className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
            >
              Sao chép nội dung
            </button>

            {selectedItem.phone && (
              <a
                href={`https://zalo.me/${selectedItem.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  navigator.clipboard.writeText(reminderText);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors shadow-2xs"
              >
                <span>Mở Zalo ngay</span>
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-300 bg-white text-xs font-bold text-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('treatment')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'treatment'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Điều trị & Răng
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'billing'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Thu phí theo đợt
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'notes'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Hồ sơ lâm sàng
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {activeTab === 'treatment' && (
          <>
            {/* Time & Doctor Setup */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Lịch hẹn & Bác sĩ phụ trách
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-500 text-[11px] font-medium block mb-1">
                    Giờ bắt đầu
                  </label>
                  <input
                    type="time"
                    value={selectedItem.time || '08:00'}
                    onChange={(e) => handleCellChange(selectedItem.id, 'time', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 text-[11px] font-medium block mb-1">
                    Thời lượng dự kiến
                  </label>
                  <div className="w-full bg-slate-200/70 border border-slate-300 rounded-xl p-2 font-mono font-semibold text-slate-800">
                    {selectedItem.duration || 30}' ({selectedItem.time} - {selectedItem.endTime})
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-slate-500 text-[11px] font-medium block mb-1">
                    Bác sĩ khám
                  </label>
                  <select
                    value={selectedItem.doctor}
                    onChange={(e) => handleCellChange(selectedItem.id, 'doctor', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium text-slate-800 outline-none focus:border-blue-500"
                  >
                    {DOCTORS.map((doc) => (
                      <option key={doc} value={doc}>
                        {doc}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 text-[11px] font-medium block mb-1">
                    Ghế điều trị
                  </label>
                  <select
                    value={selectedItem.chair || CHAIRS[0]}
                    onChange={(e) => handleCellChange(selectedItem.id, 'chair', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium text-slate-800 outline-none focus:border-blue-500"
                  >
                    {CHAIRS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Treatment Selector & Sub-options */}
            <div className="space-y-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Nhóm điều trị</label>
                <select
                  value={selectedItem.groupCode}
                  onChange={(e) => handleCellChange(selectedItem.id, 'groupCode', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium outline-none focus:border-blue-500"
                >
                  {Object.values(treatmentGroups).map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Thủ thuật / Dịch vụ</label>
                <select
                  value={selectedItem.serviceCode}
                  onChange={(e) => handleCellChange(selectedItem.id, 'serviceCode', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold outline-none focus:border-blue-500"
                >
                  {Object.values(availableTreatments).map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {currentOptions.length > 0 && (
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">
                    Vật liệu / Gói lựa chọn
                  </label>
                  <select
                    value={selectedItem.optionId || ''}
                    onChange={(e) => handleCellChange(selectedItem.id, 'optionId', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                  >
                    <option value="">Lựa chọn cơ bản</option>
                    {currentOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} (+{formatVND(opt.costModifier)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Multi-Visit Progress Tracker */}
            <div className="bg-blue-50/70 rounded-2xl p-3.5 border border-blue-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-blue-900 text-xs">
                  Lộ trình điều trị: Buổi {currentVisit} / {maxVisits}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleVisitStep(selectedItem.id, -1)}
                    disabled={currentVisit <= 1}
                    className="p-1 bg-white hover:bg-slate-100 disabled:opacity-40 rounded-lg border border-blue-300 text-blue-700 cursor-pointer shadow-2xs"
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVisitStep(selectedItem.id, 1)}
                    disabled={currentVisit >= maxVisits}
                    className="p-1 bg-white hover:bg-slate-100 disabled:opacity-40 rounded-lg border border-blue-300 text-blue-700 cursor-pointer shadow-2xs"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(currentVisit / maxVisits) * 100}%` }}
                />
              </div>

              <div className="text-[11.5px] text-blue-900 bg-white p-2.5 rounded-xl border border-blue-100">
                <strong>Nội dung buổi {currentVisit}:</strong> {visitDescription}
              </div>
            </div>

            {/* Teeth Map Card */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 text-xs">Vị trí răng điều trị FDI</span>
                <button
                  type="button"
                  onClick={() => openToothModal(selectedItem)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Mở sơ đồ răng FDI →
                </button>
              </div>

              {selectedTeethList.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTeethList.map((tooth) => (
                      <span
                        key={tooth}
                        className="px-2.5 py-1 bg-blue-100 text-blue-900 font-mono font-bold rounded-lg border border-blue-200 text-xs"
                      >
                        Răng {tooth}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed">
                    {selectedTeethList
                      .map((t) => TEETH_DESCRIPTIONS[t] || `Răng ${t}`)
                      .join(' · ')}
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-slate-400">
                  <p className="text-xs">Chưa chọn vị trí răng nào</p>
                  <button
                    type="button"
                    onClick={() => openToothModal(selectedItem)}
                    className="mt-1 text-xs text-blue-600 font-semibold hover:underline"
                  >
                    + Chọn răng trên sơ đồ
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* BILLING & MULTI-INSTALLMENT TAB */}
        {activeTab === 'billing' && (
          <div className="space-y-4">
            {/* Clean summary card */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Tổng giá trị điều trị</div>
              <div className="text-2xl font-bold font-mono tracking-tight mt-1 text-white">
                {formatVND(totalCost)}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <div className="text-slate-400">Tổng đã thu các đợt:</div>
                  <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                    {formatVND(totalPaid)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Còn nợ viện phí:</div>
                  <div className="font-mono font-bold text-rose-400 text-sm mt-0.5">
                    {formatVND(remaining)}
                  </div>
                </div>
              </div>
            </div>

            {/* Installments Breakdown */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>Chi tiết các đợt thanh toán ({payments.length} đợt)</span>
                <button
                  type="button"
                  onClick={handleAddPaymentInstallment}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer"
                >
                  <Plus size={11} /> Thêm đợt thu
                </button>
              </div>

              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.installment}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                          {p.installment}
                        </span>
                        <span>Đợt {p.installment} (Lần hẹn {p.installment})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {p.method || 'Tiền mặt'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={p.amount}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          const updated = payments.map((entry) =>
                            entry.installment === p.installment
                              ? { ...entry, amount: raw }
                              : entry
                          );
                          handleCellChange(selectedItem.id, 'payments', updated);
                        }}
                        placeholder="0"
                        className="w-28 text-right font-mono font-bold text-xs bg-white border border-slate-300 focus:border-blue-500 rounded-lg p-1.5 outline-none"
                      />
                      <span className="text-xs text-slate-500 font-medium">đ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CLINICAL NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-800 font-bold block mb-1">
                Ghi chú lâm sàng & Dặn dò bệnh nhân
              </label>
              <textarea
                rows={5}
                value={selectedItem.note || ''}
                onChange={(e) => handleCellChange(selectedItem.id, 'note', e.target.value)}
                placeholder="Nhập tiền sử bệnh, dị ứng thuốc (Penicillin...), lưu ý khi thực hiện thủ thuật..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:border-blue-500 outline-none leading-relaxed"
              />
            </div>

            {/* Quick Prescriptions */}
            <div>
              <div className="text-xs font-bold text-slate-800 mb-2">
                Mẫu dặn dò lâm sàng nhanh:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Cắn chặt gạc 45 phút, không súc miệng nước muối trong 24h',
                  'Chườm lạnh ngoài má 15 phút giảm sưng sau nhổ răng',
                  'Tránh nhai thức ăn cứng/dai bên răng điều trị',
                  'Kháng sinh Augmentin 1g x 5 ngày sau bữa ăn',
                  'Giảm đau Paracetamol 500mg khi có cảm giác đau'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      const newNote = selectedItem.note
                        ? `${selectedItem.note}\n- ${preset}`
                        : `- ${preset}`;
                      handleCellChange(selectedItem.id, 'note', newNote);
                    }}
                    className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-900 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors text-left cursor-pointer font-medium"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 transition-colors cursor-pointer shadow-2xs"
        >
          <Printer size={14} className="text-slate-600" />
          <span>In phiếu hẹn khám</span>
        </button>

        {onDeleteRow && (
          <button
            type="button"
            onClick={onDeleteRow}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Xóa lịch hẹn này"
          >
            <Trash2 size={14} />
            <span>Xóa</span>
          </button>
        )}
      </div>
    </aside>
  );
}
