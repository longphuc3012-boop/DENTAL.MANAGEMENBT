import React, { useState } from 'react';
import {
  X,
  Send,
  MessageCircle,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Phone,
  User,
  Sparkles,
  Settings,
  HelpCircle,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Building
} from 'lucide-react';
import {
  AppointmentItem,
  findTreatment,
  getServiceTotalCost,
  getVisitMax
} from '../data/dentalData';

interface ZaloNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: AppointmentItem[];
  selectedPatient?: AppointmentItem | null;
  onSelectPatient?: (item: AppointmentItem) => void;
  currentDateDisplay: string;
}

export type ZaloTemplateType =
  | 'reminder'
  | 'confirmation'
  | 'roadmap'
  | 'payment'
  | 'postcare';

export default function ZaloNotificationModal({
  isOpen,
  onClose,
  appointments,
  selectedPatient,
  onSelectPatient,
  currentDateDisplay
}: ZaloNotificationModalProps) {
  // Active target patient
  const [activeItem, setActiveItem] = useState<AppointmentItem | null>(() => {
    return selectedPatient || appointments[0] || null;
  });

  // Selected message template
  const [templateType, setTemplateType] = useState<ZaloTemplateType>('reminder');

  // Clinic info configurable
  const [clinicName, setClinicName] = useState(() => {
    return localStorage.getItem('zalo_clinic_name') || 'Nha Khoa SmileCare';
  });
  const [clinicHotline, setClinicHotline] = useState(() => {
    return localStorage.getItem('zalo_clinic_hotline') || '0900-123-456';
  });
  const [clinicAddress, setClinicAddress] = useState(() => {
    return (
      localStorage.getItem('zalo_clinic_address') ||
      '123 Đường Nguyễn Tri Phương, Quận 10, TP. Hồ Chí Minh'
    );
  });

  // Tracking sent status: appointmentId -> timestamp
  const [sentLog, setSentLog] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('zalo_sent_log');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  const [copiedState, setCopiedState] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [customNote, setCustomNote] = useState('');

  if (!isOpen) return null;

  const currentTarget = activeItem || appointments[0] || null;

  // Clean phone number for Zalo URL (e.g. 0901234567 -> 0901234567)
  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  // Generate message text according to template
  const generateMessage = (item: AppointmentItem | null, type: ZaloTemplateType): string => {
    if (!item) return '';

    const patientName = item.name || 'Quý khách';
    const apptTime = item.time || '08:00';
    const apptDate = item.date || currentDateDisplay;
    const doctor = item.doctor || 'Bác sĩ phụ trách';
    const chair = item.chair || 'Ghế 1';
    const treatment = findTreatment(item.serviceCode);
    const serviceName = treatment?.name || 'Khám và tư vấn nha khoa';
    const toothInfo = item.tooth ? ` (Vị trí răng: ${item.tooth})` : '';
    const maxVisits = getVisitMax(item.serviceCode);
    const currentVisit = item.visitNumber || 1;

    // Financial
    const totalCost = getServiceTotalCost(item.serviceCode, item.optionId);
    const payments = item.payments || [];
    const totalPaid = payments.reduce(
      (sum, p) => sum + (parseInt(p.amount, 10) || 0),
      0
    );
    const remaining = Math.max(0, totalCost - totalPaid);

    const formatVND = (num: number) => `${num.toLocaleString('vi-VN')} đ`;

    switch (type) {
      case 'reminder':
        return `🦷 [${clinicName.toUpperCase()}] - NHẮC LỊCH HẸN KHÁM

Kính gửi Quý khách ${patientName},
Phòng khám xin trân trọng nhắc lịch hẹn khám nha khoa của Quý khách:
⏰ Thời gian: ${apptTime}, ngày ${apptDate}
👨‍⚕️ Bác sĩ khám: ${doctor} (${chair})
📋 Dịch vụ: ${serviceName}${toothInfo}
${customNote ? `📝 Ghi chú: ${customNote}\n` : ''}
📍 Địa chỉ: ${clinicAddress}
📞 Hotline hỗ trợ: ${clinicHotline}

Quý khách vui lòng đến trước 10 phút để được chuẩn bị chu đáo. Nếu cần dời lịch hẹn, xin liên hệ lại phòng khám qua Zalo này hoặc hotline. Trân trọng cảm ơn Quý khách!`;

      case 'confirmation':
        return `✅ [${clinicName.toUpperCase()}] - XÁC NHẬN ĐẶT LỊCH THÀNH CÔNG

Kính chào Quý khách ${patientName},
${clinicName} đã ghi nhận lịch hẹn của Quý khách như sau:
⏰ Giờ hẹn: ${apptTime} - ${apptDate}
👨‍⚕️ Bác sĩ: ${doctor}
📋 Dịch vụ dự kiến: ${serviceName}${toothInfo}

Chúng tôi rất hân hạnh được đồng hành cùng nụ cười của Quý khách!
📍 Địa chỉ: ${clinicAddress}
📞 Hotline: ${clinicHotline}`;

      case 'roadmap':
        return `📅 [${clinicName.toUpperCase()}] - LỘ TRÌNH ĐIỀU TRỊ NHA KHOA

Kính gửi Quý khách ${patientName},
Hôm nay là BUỔI ${currentVisit}/${maxVisits} trong phác đồ điều trị ${serviceName}${toothInfo}.
⏰ Giờ khám: ${apptTime} ngày ${apptDate}
👨‍⚕️ Bác sĩ phụ trách: ${doctor}
${customNote ? `📌 Nội dung đợt này: ${customNote}\n` : ''}
Quý khách vui lòng đến đúng giờ để tiến độ điều trị đạt kết quả tốt nhất. Trân trọng!
📞 Hotline: ${clinicHotline}`;

      case 'payment':
        return `💳 [${clinicName.toUpperCase()}] - THÔNG BÁO VIỆN PHÍ & THANH TOÁN

Kính gửi Quý khách ${patientName},
Phòng khám xin gửi thông tin viện phí điều trị:
📋 Dịch vụ: ${serviceName}
💰 Tổng chi phí: ${formatVND(totalCost)}
💵 Đã thanh toán các đợt: ${formatVND(totalPaid)}
${
  remaining > 0
    ? `⚠️ Số tiền còn lại/đợt này: ${formatVND(remaining)}`
    : `✨ Trạng thái: Đã hoàn tất 100% viện phí`
}

Quý khách có thể thanh toán bằng Tiền mặt, Chuyển khoản hoặc Quẹt thẻ POS tại quầy lễ tân.
📞 Hotline: ${clinicHotline}`;

      case 'postcare':
        return `❤️ [${clinicName.toUpperCase()}] - DẶN DÒ CHĂM SÓC SAU ĐIỀU TRỊ

Kính chào Quý khách ${patientName},
Sau buổi khám và thực hiện ${serviceName}${toothInfo}, Quý khách vui lòng lưu ý:
1. Uống thuốc theo đúng hướng dẫn của Bác sĩ ${doctor} (nếu có toa).
2. Tránh nhai thức ăn quá cứng, dai hoặc quá nóng/lạnh trong 24 giờ đầu.
3. Vệ sinh răng miệng nhẹ nhàng, không súc miệng quá mạnh vào vùng vừa điều trị.
4. Chườm lạnh bên ngoài má nếu cảm thấy hơi ê buốt nhẹ.

Nếu có bất kỳ dấu hiệu bất thường nào, Quý khách hãy liên hệ ngay hotline 24/7: ${clinicHotline}. Chúc Quý khách sớm bình phục!`;

      default:
        return '';
    }
  };

  const messageText = generateMessage(currentTarget, templateType);

  // Send single via Zalo: Copy message and open zalo.me/{phone}
  const handleSendZalo = (item: AppointmentItem | null) => {
    if (!item || !item.phone) {
      alert('Bệnh nhân này chưa có số điện thoại. Vui lòng cập nhật số điện thoại trước khi gửi Zalo!');
      return;
    }

    const phoneDigits = cleanPhone(item.phone);
    if (phoneDigits.length < 9) {
      alert('Số điện thoại không hợp lệ (phải từ 9-11 chữ số)!');
      return;
    }

    const textToSend = generateMessage(item, templateType);

    // 1. Copy message text to clipboard
    navigator.clipboard.writeText(textToSend);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2500);

    // 2. Mark as sent with timestamp
    const nowTime = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const updatedLog = { ...sentLog, [item.id]: nowTime };
    setSentLog(updatedLog);
    try {
      localStorage.setItem('zalo_sent_log', JSON.stringify(updatedLog));
    } catch {
      // ignore
    }

    // 3. Open Zalo chat directly: https://zalo.me/{phone}
    const zaloUrl = `https://zalo.me/${phoneDigits}`;
    window.open(zaloUrl, '_blank', 'noopener,noreferrer');
  };

  // Save clinic config
  const handleSaveConfig = () => {
    localStorage.setItem('zalo_clinic_name', clinicName);
    localStorage.setItem('zalo_clinic_hotline', clinicHotline);
    localStorage.setItem('zalo_clinic_address', clinicAddress);
    setShowConfig(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between border-b border-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-blue-600 flex items-center justify-center font-bold shadow-sm">
              <MessageCircle size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight">
                  Trung Tâm Gửi Thông Báo Zalo Tự Động
                </h3>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                  zalo.me Direct Link
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Tự động tạo nội dung cá nhân hóa, sao chép và mở trực tiếp hội thoại Zalo bệnh nhân
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                showConfig
                  ? 'bg-white text-blue-600 border-white font-semibold'
                  : 'bg-blue-700/60 hover:bg-blue-700 text-white border-blue-500'
              }`}
              title="Cài đặt thông tin phòng khám"
            >
              <Settings size={18} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Configuration Panel (collapsible) */}
        {showConfig && (
          <div className="p-4 bg-slate-100 border-b border-slate-300 text-xs animate-in slide-in-from-top-2">
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Tên phòng khám:</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 block mb-1">Hotline CSKH:</label>
                <input
                  type="text"
                  value={clinicHotline}
                  onChange={(e) => setClinicHotline(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 block mb-1">Địa chỉ phòng khám:</label>
                <input
                  type="text"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 font-semibold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>
            <div className="flex justify-end mt-2.5">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Lưu cài đặt
              </button>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-300">
          {/* Left Column: Patient List (5 cols) */}
          <div className="lg:col-span-5 flex flex-col h-full bg-slate-50 overflow-hidden">
            <div className="p-3 bg-white border-b border-slate-300 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">
                Danh sách ca khám ({appointments.length} bệnh nhân)
              </span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {currentDateDisplay}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-200 p-2 space-y-1.5">
              {appointments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Không có lịch hẹn nào trong ngày đã chọn.
                </div>
              ) : (
                appointments.map((item) => {
                  const isCurrent = currentTarget?.id === item.id;
                  const isSent = !!sentLog[item.id];
                  const hasPhone = !!cleanPhone(item.phone);

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setActiveItem(item);
                        if (onSelectPatient) onSelectPatient(item);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-50/90 border-blue-500 shadow-xs'
                          : 'bg-white hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isCurrent
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            #{item.id}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 leading-tight">
                              {item.name || 'Bệnh nhân mới'}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 mt-0.5">
                              <Phone size={10} className="text-blue-600" />
                              <span>{item.phone || 'Chưa có SĐT'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end">
                          <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {item.time || '08:00'}
                          </span>
                          {isSent ? (
                            <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              <CheckCircle2 size={10} /> Đã gửi {sentLog[item.id]}
                            </span>
                          ) : (
                            <span className="mt-1 text-[10px] text-slate-500">Chưa gửi</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                        <span className="truncate max-w-[180px]">
                          {findTreatment(item.serviceCode)?.name || item.serviceCode}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveItem(item);
                            handleSendZalo(item);
                          }}
                          disabled={!hasPhone}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            hasPhone
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                          title={hasPhone ? 'Gửi Zalo cho bệnh nhân này' : 'Thiếu SĐT'}
                        >
                          <Send size={10} />
                          <span>Gửi Zalo</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Template Selector & Live Message Editor (7 cols) */}
          <div className="lg:col-span-7 flex flex-col h-full bg-white overflow-hidden p-5">
            {/* Template Selector Tabs */}
            <div className="mb-3">
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                Chọn mẫu tin nhắn tự động:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { id: 'reminder', label: '1. Nhắc lịch hẹn' },
                  { id: 'confirmation', label: '2. Xác nhận đặt lịch' },
                  { id: 'roadmap', label: '3. Tái khám lộ trình' },
                  { id: 'payment', label: '4. Viện phí & Đợt tiền' },
                  { id: 'postcare', label: '5. Dặn dò sau khám' }
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setTemplateType(tpl.id as ZaloTemplateType)}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border text-left transition-all cursor-pointer ${
                      templateType === tpl.id
                        ? 'bg-blue-50 text-blue-700 border-blue-500 shadow-2xs ring-1 ring-blue-400'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom note option */}
            <div className="mb-3">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Ghi chú thêm cho ca khám này (tự chèn vào tin nhắn):
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="VD: Cần nhịn ăn sáng trước khi làm xét nghiệm / Đã chuẩn bị máng niềng..."
                className="w-full text-xs border border-slate-300 rounded-xl p-2 outline-none focus:border-blue-500 bg-slate-50"
              />
            </div>

            {/* Live Message Preview Box */}
            <div className="flex-1 flex flex-col overflow-hidden mb-4">
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600" />
                  Nội dung tin nhắn sẽ gửi tới bệnh nhân:
                </span>
                <span className="text-[11px] font-mono font-semibold text-slate-500">
                  {messageText.length} ký tự
                </span>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 rounded-2xl border border-slate-300 p-3.5 text-xs font-mono leading-relaxed text-slate-900 whitespace-pre-wrap select-text">
                {messageText || 'Vui lòng chọn một bệnh nhân ở danh sách bên trái.'}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(messageText);
                    setCopiedState(true);
                    setTimeout(() => setCopiedState(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {copiedState ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>{copiedState ? 'Đã sao chép' : 'Sao chép văn bản'}</span>
                </button>

                {currentTarget?.phone && (
                  <span className="text-xs font-mono text-slate-600">
                    Gửi tới: <strong>{currentTarget.phone}</strong>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleSendZalo(currentTarget)}
                disabled={!currentTarget || !currentTarget.phone}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                  currentTarget && currentTarget.phone
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:scale-[1.02]'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send size={15} />
                <span>Gửi qua Zalo ngay (zalo.me)</span>
                <ExternalLink size={13} className="opacity-80" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer instructions */}
        <div className="px-6 py-2.5 bg-slate-100 border-t border-slate-300 text-slate-600 text-[11.5px] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-blue-600 shrink-0" />
            <span>
              <strong>Cách thức hoạt động:</strong> Bấm "Gửi qua Zalo", hệ thống sẽ tự động sao chép toàn bộ tin nhắn vào bộ nhớ đệm và mở trang chat Zalo của bệnh nhân, bạn chỉ cần nhấn <code>Ctrl + V</code> (Dán) và Gửi.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
