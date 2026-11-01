import React from 'react';
import { X, Check } from 'lucide-react';

export interface ColumnVisibility {
  id: boolean;
  time: boolean;
  name: boolean;
  phone: boolean;
  groupCode: boolean;
  serviceCode: boolean;
  tooth: boolean;
  visitNumber: boolean;
  doctor: boolean;
  status: boolean;
  payments: boolean;
  note: boolean;
}

interface ColumnSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnVisibility: ColumnVisibility;
  setColumnVisibility: React.Dispatch<React.SetStateAction<ColumnVisibility>>;
}

export default function ColumnSettingsModal({
  isOpen,
  onClose,
  columnVisibility,
  setColumnVisibility
}: ColumnSettingsModalProps) {
  if (!isOpen) return null;

  const columnLabels: { key: keyof ColumnVisibility; label: string }[] = [
    { key: 'id', label: 'Mã STT (#ID)' },
    { key: 'time', label: 'Giờ hẹn (Bắt đầu - Kết thúc)' },
    { key: 'name', label: 'Tên bệnh nhân' },
    { key: 'phone', label: 'Số điện thoại' },
    { key: 'groupCode', label: 'Nhóm điều trị' },
    { key: 'serviceCode', label: 'Dịch vụ / Thủ thuật' },
    { key: 'tooth', label: 'Vị trí răng (Sơ đồ FDI)' },
    { key: 'visitNumber', label: 'Lần khám / Buổi điều trị' },
    { key: 'doctor', label: 'Bác sĩ phụ trách' },
    { key: 'status', label: 'Trạng thái hẹn' },
    { key: 'payments', label: 'Chi phí & Đợt thanh toán' },
    { key: 'note', label: 'Ghi chú lâm sàng' }
  ];

  const toggleColumn = (key: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleReset = () => {
    setColumnVisibility({
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
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden border border-slate-200">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-sm text-slate-800">Cài đặt hiển thị cột bảng</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto text-xs">
          {columnLabels.map(({ key, label }) => {
            const isChecked = columnVisibility[key];
            return (
              <label
                key={key}
                onClick={() => toggleColumn(key)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors"
              >
                <span className="font-medium text-slate-700">{label}</span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>
            );
          })}
        </div>

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-600 hover:underline cursor-pointer"
          >
            Hiện tất cả cột
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}
