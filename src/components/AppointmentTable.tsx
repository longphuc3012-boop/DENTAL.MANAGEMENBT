import React, { useState } from 'react';
import {
  Clock,
  User,
  Phone,
  FileText,
  ChevronDown,
  Plus,
  Minus,
  Edit2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ExternalLink,
  CreditCard,
  X,
  Calendar,
  MessageCircle
} from 'lucide-react';
import {
  AppointmentItem,
  DOCTORS,
  CHAIRS,
  treatmentGroups,
  findTreatment,
  getServiceTotalCost,
  getVisitMax
} from '../data/dentalData';
import { ColumnVisibility } from './ColumnSettingsModal';

interface AppointmentTableProps {
  appointments: AppointmentItem[];
  visibleAppointments: AppointmentItem[];
  selectedItem: AppointmentItem | null;
  setSelectedItem: (item: AppointmentItem | null) => void;
  editingCell: { id: string | null; field: string | null };
  setEditingCell: (cell: { id: string | null; field: string | null }) => void;
  handleCellChange: (id: string, field: string, value: any) => void;
  handleVisitStep: (id: string, delta: number) => void;
  getPaymentEntries: (item: AppointmentItem) => { installment: number; amount: string; method?: string }[];
  handlePaymentAmountChange: (id: string, installment: number, amount: string) => void;
  paymentListOpenId: string | null;
  setPaymentListOpenId: (id: string | null) => void;
  handleAddRow: () => void;
  getBadgeStyle: (status: string) => { bg: string; color: string };
  onOpenToothModal: (item: AppointmentItem) => void;
  onOpenZalo?: (item: AppointmentItem) => void;
  columnVisibility?: ColumnVisibility;
}

const formatVND = (digits: string | number) => {
  const clean = String(digits || '').replace(/\D/g, '');
  if (!clean || clean === '0') return '0 đ';
  return `${Number(clean).toLocaleString('vi-VN')} đ`;
};

export default function AppointmentTable({
  appointments,
  visibleAppointments,
  selectedItem,
  setSelectedItem,
  editingCell,
  setEditingCell,
  handleCellChange,
  handleVisitStep,
  getPaymentEntries,
  handlePaymentAmountChange,
  paymentListOpenId,
  setPaymentListOpenId,
  handleAddRow,
  getBadgeStyle,
  onOpenToothModal,
  onOpenZalo,
  columnVisibility = {
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
  }
}: AppointmentTableProps) {
  const [inlineTimePresetOpenId, setInlineTimePresetOpenId] = useState<string | null>(null);

  const timePresets = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden border-r border-slate-300">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs table-grid border border-slate-300">
          {/* Table Header with High-Contrast Solid Dividers */}
          <thead className="bg-slate-200 text-slate-900 font-bold sticky top-0 z-10 border-b-2 border-slate-400 shadow-2xs">
            <tr>
              {columnVisibility.id && (
                <th className="py-2.5 px-3 w-16 text-center text-slate-900 border-r border-slate-300 font-bold">Mã STT</th>
              )}
              {columnVisibility.time && (
                <th className="py-2.5 px-3 w-36 text-slate-900 border-r border-slate-300 font-bold">Giờ hẹn</th>
              )}
              {columnVisibility.name && (
                <th className="py-2.5 px-3 min-w-[150px] text-slate-950 border-r border-slate-300 font-bold">Bệnh nhân</th>
              )}
              {columnVisibility.phone && (
                <th className="py-2.5 px-3 w-40 text-slate-900 border-r border-slate-300 font-bold">Số điện thoại / Zalo</th>
              )}
              {columnVisibility.groupCode && (
                <th className="py-2.5 px-3 min-w-[140px] text-slate-900 border-r border-slate-300 font-bold">Nhóm điều trị</th>
              )}
              {columnVisibility.serviceCode && (
                <th className="py-2.5 px-3 min-w-[170px] text-slate-950 border-r border-slate-300 font-bold">Dịch vụ / Thủ thuật</th>
              )}
              {columnVisibility.tooth && (
                <th className="py-2.5 px-3 w-28 text-center text-blue-900 border-r border-slate-300 font-bold">Vị trí răng FDI</th>
              )}
              {columnVisibility.visitNumber && (
                <th className="py-2.5 px-3 w-28 text-center text-slate-900 border-r border-slate-300 font-bold">Lần khám</th>
              )}
              {columnVisibility.doctor && (
                <th className="py-2.5 px-3 w-32 text-slate-900 border-r border-slate-300 font-bold">Bác sĩ</th>
              )}
              {columnVisibility.status && (
                <th className="py-2.5 px-3 w-32 text-center text-slate-900 border-r border-slate-300 font-bold">Trạng thái</th>
              )}
              {columnVisibility.payments && (
                <th className="py-2.5 px-3 min-w-[220px] text-right text-slate-950 border-r border-slate-300 font-bold">
                  Thanh toán từng đợt
                </th>
              )}
              {columnVisibility.note && (
                <th className="py-2.5 px-3 min-w-[150px] text-slate-900 font-bold">Ghi chú</th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-300 bg-white">
            {visibleAppointments.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-20 text-center text-slate-400">
                  <div className="max-w-xs mx-auto flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                      <Clock size={22} />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Chưa có lịch hẹn nào phù hợp
                    </p>
                    <p className="text-xs text-slate-500">
                      Không tìm thấy lịch hẹn cho ngày đã chọn hoặc bộ lọc hiện tại.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="mt-2 primary-button flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Thêm ca hẹn mới
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              visibleAppointments.map((item, index) => {
                const isSelected = selectedItem?.id === item.id;
                const statusStyle = getBadgeStyle(item.status);
                const maxVisits = getVisitMax(item.serviceCode);
                const currentVisit = item.visitNumber || 1;
                const totalCost = getServiceTotalCost(item.serviceCode, item.optionId);
                const payments = getPaymentEntries(item);
                const currentPaymentEntry = payments.find(
                  (p) => Number(p.installment) === currentVisit
                );
                const totalPaid = payments.reduce(
                  (acc, p) => acc + (parseInt(p.amount, 10) || 0),
                  0
                );
                const remaining = Math.max(0, totalCost - totalPaid);

                const currentGroup = treatmentGroups[item.groupCode] || treatmentGroups.GR001;
                const availableTreatments = currentGroup?.treatments || {};

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`transition-colors cursor-pointer group border-b border-slate-300 ${
                      isSelected
                        ? 'bg-blue-100/90 hover:bg-blue-100 text-slate-950 font-medium border-l-4 border-l-blue-600'
                        : index % 2 === 0
                        ? 'bg-white hover:bg-slate-100'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {/* ID / STT */}
                    {columnVisibility.id && (
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 border-r border-slate-300">
                        {editingCell.id === item.id && editingCell.field === 'id' ? (
                          <input
                            autoFocus
                            type="text"
                            value={item.id}
                            onChange={(e) => handleCellChange(item.id, 'id', e.target.value)}
                            onBlur={() => setEditingCell({ id: null, field: null })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingCell({ id: null, field: null });
                            }}
                            className="w-14 text-center font-mono border-2 border-blue-600 rounded px-1 py-0.5 outline-none bg-white shadow-xs font-bold text-slate-900"
                          />
                        ) : (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCell({ id: item.id, field: 'id' });
                            }}
                            className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-900 hover:bg-blue-100 hover:text-blue-800 font-bold transition-colors text-[11px] border border-slate-300"
                            title="Bấm để sửa mã STT"
                          >
                            #{item.id}
                          </span>
                        )}
                      </td>
                    )}

                    {/* Time & Duration */}
                    {columnVisibility.time && (
                      <td className="py-2 px-3 relative border-r border-slate-300">
                        <div className="flex items-center gap-1.5">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setInlineTimePresetOpenId(
                                inlineTimePresetOpenId === item.id ? null : item.id
                              );
                            }}
                            className="flex items-center gap-1 font-mono font-bold text-slate-950 bg-slate-100 hover:bg-blue-100 text-[11.5px] px-2 py-0.5 rounded-md border border-slate-400 transition-colors cursor-pointer"
                            title="Bấm để đổi nhanh giờ hẹn"
                          >
                            <Clock size={11} className="text-blue-700 shrink-0 font-bold" />
                            <span>{item.time || '08:00'}</span>
                            <span className="text-slate-400">-</span>
                            <span className="text-slate-700 font-semibold">
                              {item.endTime || '08:30'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-600 font-mono font-bold">
                            {item.duration || 30}'
                          </span>
                        </div>

                        {/* Time Presets Popover */}
                        {inlineTimePresetOpenId === item.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute left-2 top-full mt-1 bg-white border-2 border-slate-400 rounded-xl shadow-xl p-2.5 z-30 min-w-[210px] grid grid-cols-4 gap-1 animate-in fade-in"
                          >
                            {timePresets.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  handleCellChange(item.id, 'time', t);
                                  setInlineTimePresetOpenId(null);
                                }}
                                className={`px-2 py-1 text-center font-mono text-[11px] rounded-lg transition-colors cursor-pointer font-bold ${
                                  item.time === t
                                    ? 'bg-blue-600 text-white font-bold'
                                    : 'hover:bg-slate-200 text-slate-800'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Patient Name */}
                    {columnVisibility.name && (
                      <td className="py-2 px-3 font-bold text-slate-950 border-r border-slate-300">
                        {editingCell.id === item.id && editingCell.field === 'name' ? (
                          <input
                            autoFocus
                            type="text"
                            value={item.name}
                            onChange={(e) => handleCellChange(item.id, 'name', e.target.value)}
                            onBlur={() => setEditingCell({ id: null, field: null })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingCell({ id: null, field: null });
                            }}
                            className="w-full border-2 border-blue-600 rounded-md px-2 py-1 outline-none bg-white shadow-xs text-xs font-bold text-slate-950"
                          />
                        ) : (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCell({ id: item.id, field: 'name' });
                            }}
                            className="flex items-center justify-between group/cell hover:bg-slate-200/70 p-1 rounded-md transition-colors"
                          >
                            <span className="font-bold text-slate-950 text-xs truncate">
                              {item.name || 'Chưa nhập tên'}
                            </span>
                            <Edit2
                              size={11}
                              className="opacity-0 group-hover/cell:opacity-100 text-slate-500 ml-1 shrink-0"
                            />
                          </div>
                        )}
                      </td>
                    )}

                    {/* Phone & Direct Zalo Button */}
                    {columnVisibility.phone && (
                      <td className="py-2 px-3 text-slate-900 font-mono border-r border-slate-300">
                        {editingCell.id === item.id && editingCell.field === 'phone' ? (
                          <input
                            autoFocus
                            type="text"
                            value={item.phone}
                            onChange={(e) => handleCellChange(item.id, 'phone', e.target.value)}
                            onBlur={() => setEditingCell({ id: null, field: null })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingCell({ id: null, field: null });
                            }}
                            placeholder="09xx..."
                            className="w-full font-mono font-bold border-2 border-blue-600 rounded-md px-2 py-1 outline-none bg-white shadow-xs text-xs text-slate-950"
                          />
                        ) : (
                          <div className="flex items-center justify-between gap-1.5">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCell({ id: item.id, field: 'phone' });
                              }}
                              className="hover:bg-slate-200/80 p-1 rounded-md transition-colors truncate font-semibold"
                              title="Bấm để sửa số điện thoại"
                            >
                              {item.phone ? (
                                <span className="text-slate-900 font-bold">{item.phone}</span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Chưa có SĐT</span>
                              )}
                            </div>
                            {item.phone && onOpenZalo && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenZalo(item);
                                }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-800 border border-blue-400 font-bold text-[11px] transition-colors shrink-0 cursor-pointer shadow-2xs"
                                title="Nhấp để tự động tạo và gửi tin nhắn Zalo"
                              >
                                <MessageCircle size={11} className="shrink-0" />
                                <span>Zalo</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Treatment Group */}
                    {columnVisibility.groupCode && (
                      <td className="py-2 px-3 border-r border-slate-300">
                        <select
                          value={item.groupCode}
                          onChange={(e) => handleCellChange(item.id, 'groupCode', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-white hover:bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-md py-1 px-1.5 text-xs text-slate-900 font-medium outline-none cursor-pointer transition-colors"
                        >
                          {Object.values(treatmentGroups).map((group) => (
                            <option key={group.code} value={group.code}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}

                    {/* Specific Treatment */}
                    {columnVisibility.serviceCode && (
                      <td className="py-2 px-3 border-r border-slate-300">
                        <select
                          value={item.serviceCode}
                          onChange={(e) => handleCellChange(item.id, 'serviceCode', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-white hover:bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-md py-1 px-1.5 text-xs text-slate-950 font-bold outline-none cursor-pointer transition-colors"
                        >
                          {Object.values(availableTreatments).map((treatment) => (
                            <option key={treatment.code} value={treatment.code}>
                              {treatment.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}

                    {/* Tooth Selection FDI */}
                    {columnVisibility.tooth && (
                      <td className="py-2 px-3 text-center border-r border-slate-300">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenToothModal(item);
                          }}
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                            item.tooth
                              ? 'bg-blue-100 text-blue-900 border-blue-400 hover:bg-blue-200'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-400'
                          }`}
                          title="Bấm để mở sơ đồ răng tương tác FDI"
                        >
                          <span>{item.tooth || 'Chọn răng'}</span>
                        </button>
                      </td>
                    )}

                    {/* Visit / Session Step */}
                    {columnVisibility.visitNumber && (
                      <td className="py-2 px-3 text-center border-r border-slate-300">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 bg-slate-100 border border-slate-300 rounded-lg p-0.5"
                        >
                          <button
                            type="button"
                            onClick={() => handleVisitStep(item.id, -1)}
                            disabled={currentVisit <= 1}
                            className="w-5 h-5 flex items-center justify-center text-slate-700 hover:text-slate-950 disabled:opacity-30 rounded cursor-pointer font-bold"
                            title="Lần trước"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="font-mono font-bold text-[11px] text-slate-950 px-1 min-w-[28px] text-center">
                            {currentVisit}/{maxVisits}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleVisitStep(item.id, 1)}
                            disabled={currentVisit >= maxVisits}
                            className="w-5 h-5 flex items-center justify-center text-slate-700 hover:text-slate-950 disabled:opacity-30 rounded cursor-pointer font-bold"
                            title="Lần tiếp theo"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </td>
                    )}

                    {/* Doctor */}
                    {columnVisibility.doctor && (
                      <td className="py-2 px-3 border-r border-slate-300">
                        <select
                          value={item.doctor}
                          onChange={(e) => handleCellChange(item.id, 'doctor', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-white hover:bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-md py-1 px-1.5 text-xs text-slate-900 font-semibold outline-none cursor-pointer transition-colors"
                        >
                          {DOCTORS.map((doc) => (
                            <option key={doc} value={doc}>
                              {doc}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}

                    {/* Status Badge Dropdown */}
                    {columnVisibility.status && (
                      <td className="py-2 px-3 text-center border-r border-slate-300">
                        <select
                          value={item.status}
                          onChange={(e) => handleCellChange(item.id, 'status', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color
                          }}
                          className="w-full font-bold border border-black/20 rounded-lg py-1 px-2 text-xs outline-none cursor-pointer transition-colors text-center shadow-xs"
                        >
                          <option value="Đã đặt">Đã đặt</option>
                          <option value="Chờ đến lượt">Chờ đến lượt</option>
                          <option value="Đang khám">Đang khám</option>
                          <option value="Đã khám">Đã khám</option>
                          <option value="Hoàn thành">Hoàn thành</option>
                          <option value="Hủy">Hủy</option>
                        </select>
                      </td>
                    )}

                    {/* Payment Installments - CLEAN CLEAR BREAKDOWN */}
                    {columnVisibility.payments && (
                      <td className="py-2 px-3 text-right relative border-r border-slate-300">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaymentListOpenId(paymentListOpenId === item.id ? null : item.id);
                          }}
                          className="inline-flex flex-col items-end gap-1 cursor-pointer group/pay hover:bg-slate-200/80 p-1.5 rounded-lg border border-transparent hover:border-slate-300 transition-all"
                          title="Bấm để xem và sửa chi tiết từng đợt thanh toán"
                        >
                          {/* Installments Badges */}
                          <div className="flex flex-wrap justify-end gap-1 max-w-[240px]">
                            {payments.map((p) => {
                              const amt = parseInt(p.amount, 10) || 0;
                              return (
                                <span
                                  key={p.installment}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-mono font-bold border ${
                                    amt > 0
                                      ? 'bg-blue-100 text-blue-900 border-blue-400'
                                      : 'bg-slate-200 text-slate-700 border-slate-300'
                                  }`}
                                >
                                  <span className="text-slate-600">Đợt {p.installment}:</span>
                                  <span className="font-bold">{formatVND(p.amount || 0)}</span>
                                </span>
                              );
                            })}
                          </div>

                          {/* Summary Row */}
                          <div className="flex items-center gap-1.5 text-[10.5px] font-mono mt-0.5 font-bold">
                            <span className="text-emerald-800">
                              Đã thu: {formatVND(totalPaid)}
                            </span>
                            <span className="text-slate-400">/</span>
                            {remaining > 0 ? (
                              <span className="text-rose-700">
                                Nợ: {formatVND(remaining)}
                              </span>
                            ) : (
                              <span className="text-emerald-700">
                                Đã đủ
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Payment Installments Editor Popover */}
                        {paymentListOpenId === item.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-2 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-3.5 z-40 min-w-[270px] text-left animate-in fade-in"
                          >
                            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                              <div>
                                <span className="font-bold text-xs text-slate-900 block">
                                  Thu tiền theo đợt khám
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Bệnh nhân: {item.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setPaymentListOpenId(null)}
                                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            {/* All installments inputs */}
                            <div className="space-y-2 mb-3 max-h-44 overflow-y-auto">
                              {payments.map((p) => (
                                <div
                                  key={p.installment}
                                  className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200"
                                >
                                  <span className="text-xs font-semibold text-slate-700">
                                    Đợt {p.installment}:
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={p.amount || ''}
                                      onChange={(e) =>
                                        handlePaymentAmountChange(
                                          item.id,
                                          p.installment,
                                          e.target.value
                                        )
                                      }
                                      placeholder="0"
                                      className="w-24 text-right font-mono font-bold text-xs bg-white border border-slate-300 focus:border-blue-500 rounded-lg p-1 outline-none"
                                    />
                                    <span className="text-[11px] text-slate-500">đ</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Summary breakdown */}
                            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                              <div className="flex justify-between">
                                <span>Tổng viện phí:</span>
                                <strong className="font-mono text-slate-900">{formatVND(totalCost)}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Đã thu các đợt:</span>
                                <strong className="font-mono text-emerald-600">{formatVND(totalPaid)}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Còn lại:</span>
                                <strong className="font-mono text-rose-600">{formatVND(remaining)}</strong>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setPaymentListOpenId(null)}
                              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                            >
                              Xong
                            </button>
                          </div>
                        )}
                      </td>
                    )}

                    {/* Note */}
                    {columnVisibility.note && (
                      <td className="py-2 px-3 text-slate-900 font-medium">
                        {editingCell.id === item.id && editingCell.field === 'note' ? (
                          <input
                            autoFocus
                            type="text"
                            value={item.note}
                            onChange={(e) => handleCellChange(item.id, 'note', e.target.value)}
                            onBlur={() => setEditingCell({ id: null, field: null })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingCell({ id: null, field: null });
                            }}
                            placeholder="Ghi chú lâm sàng..."
                            className="w-full border-2 border-blue-600 rounded-md px-2 py-1 outline-none bg-white shadow-xs text-xs font-medium text-slate-950"
                          />
                        ) : (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCell({ id: item.id, field: 'note' });
                            }}
                            className="truncate max-w-[200px] hover:bg-slate-100/80 p-1 rounded-md transition-colors cursor-text"
                            title={item.note || 'Nhấp để thêm ghi chú'}
                          >
                            {item.note ? (
                              <span className="text-slate-700">{item.note}</span>
                            ) : (
                              <span className="text-slate-300 italic text-[11px]">
                                Thêm ghi chú...
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Action Bar */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <button
          type="button"
          onClick={handleAddRow}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={14} /> Thêm bệnh nhân vào danh sách
        </button>

        <span className="text-xs text-slate-500">
          Hiển thị <strong>{visibleAppointments.length}</strong> /{' '}
          <strong>{appointments.length}</strong> ca khám
        </span>
      </div>
    </div>
  );
}
