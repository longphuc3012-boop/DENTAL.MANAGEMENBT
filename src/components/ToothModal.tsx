import React from 'react';
import { X, Sparkles, Check, RotateCcw } from 'lucide-react';
import {
  AppointmentItem,
  TEETH_UPPER,
  TEETH_LOWER,
  TEETH_DESCRIPTIONS
} from '../data/dentalData';

interface ToothModalProps {
  activeToothModal: AppointmentItem;
  onClose: () => void;
  onToggleToothSelect: (toothCode: string) => void;
  onSetTeethString: (teethStr: string) => void;
}

export default function ToothModal({
  activeToothModal,
  onClose,
  onToggleToothSelect,
  onSetTeethString
}: ToothModalProps) {
  const currentTeeth = activeToothModal.tooth
    ? activeToothModal.tooth.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const handleSelectPreset = (preset: string) => {
    switch (preset) {
      case 'all':
        onSetTeethString('Toàn hàm');
        break;
      case 'upper':
        onSetTeethString(TEETH_UPPER.join(', '));
        break;
      case 'lower':
        onSetTeethString(TEETH_LOWER.join(', '));
        break;
      case 'front':
        onSetTeethString('11, 12, 21, 22, 31, 32, 41, 42');
        break;
      case 'molars':
        onSetTeethString('16, 17, 26, 27, 36, 37, 46, 47');
        break;
      case 'wisdom':
        onSetTeethString('18, 28, 38, 48');
        break;
      case 'clear':
        onSetTeethString('');
        break;
      default:
        break;
    }
  };

  // Group teeth into quadrants
  // Q1: 18-11, Q2: 21-28
  const q1 = ['18', '17', '16', '15', '14', '13', '12', '11'];
  const q2 = ['21', '22', '23', '24', '25', '26', '27', '28'];
  // Q4: 48-41, Q3: 31-38
  const q4 = ['48', '47', '46', '45', '44', '43', '42', '41'];
  const q3 = ['31', '32', '33', '34', '35', '36', '37', '38'];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Sơ đồ định vị răng chuẩn quốc tế FDI
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bệnh nhân: <strong className="text-blue-700">{activeToothModal.name}</strong> (Mã:{' '}
              {activeToothModal.id})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Presets */}
          <div>
            <div className="text-xs font-bold text-slate-600 mb-2">Chọn nhanh vị trí hàm:</div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleSelectPreset('all')}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                Cả 2 hàm (Toàn hàm)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('upper')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Toàn hàm trên
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('lower')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Toàn hàm dưới
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('front')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Nhóm răng cửa
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('molars')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Răng hàm cối
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('wisdom')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Răng khôn (Số 8)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('clear')}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 font-medium rounded-xl border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Xóa chọn
              </button>
            </div>
          </div>

          {/* FDI Dental Arch Chart */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
            {/* UPPER ARCH */}
            <div className="text-center mb-3">
              <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-3 py-1 rounded-full uppercase tracking-wider">
                Hàm Trên (Cung Răng Trên)
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              {/* Q1 Right */}
              <div className="flex gap-1">
                {q1.map((tooth) => {
                  const isSelected =
                    activeToothModal.tooth === 'Toàn hàm' ||
                    currentTeeth.includes(tooth);
                  return (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => onToggleToothSelect(tooth)}
                      className={`w-9 h-12 flex flex-col items-center justify-between py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 scale-105'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                      title={TEETH_DESCRIPTIONS[tooth]}
                    >
                      <span className="text-[9px] opacity-70">
                        {tooth.startsWith('18') || tooth.startsWith('28') ? 'Khôn' : 'R'}
                      </span>
                      <span>{tooth}</span>
                    </button>
                  );
                })}
              </div>

              {/* Midline divider */}
              <div className="w-0.5 h-12 bg-blue-300 mx-1" title="Đường giữa" />

              {/* Q2 Left */}
              <div className="flex gap-1">
                {q2.map((tooth) => {
                  const isSelected =
                    activeToothModal.tooth === 'Toàn hàm' ||
                    currentTeeth.includes(tooth);
                  return (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => onToggleToothSelect(tooth)}
                      className={`w-9 h-12 flex flex-col items-center justify-between py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 scale-105'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                      title={TEETH_DESCRIPTIONS[tooth]}
                    >
                      <span className="text-[9px] opacity-70">
                        {tooth.startsWith('18') || tooth.startsWith('28') ? 'Khôn' : 'R'}
                      </span>
                      <span>{tooth}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Arch Horizontal Separator */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed border-slate-300" />
              </div>
              <div className="relative flex justify-center text-[10px] text-slate-400">
                <span className="bg-slate-50 px-2 font-semibold">Khớp Cắn Trung Tâm</span>
              </div>
            </div>

            {/* LOWER ARCH */}
            <div className="text-center mb-3">
              <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-3 py-1 rounded-full uppercase tracking-wider">
                Hàm Dưới (Cung Răng Dưới)
              </span>
            </div>

            <div className="flex items-center justify-center gap-2">
              {/* Q4 Right */}
              <div className="flex gap-1">
                {q4.map((tooth) => {
                  const isSelected =
                    activeToothModal.tooth === 'Toàn hàm' ||
                    currentTeeth.includes(tooth);
                  return (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => onToggleToothSelect(tooth)}
                      className={`w-9 h-12 flex flex-col items-center justify-between py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 scale-105'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                      title={TEETH_DESCRIPTIONS[tooth]}
                    >
                      <span>{tooth}</span>
                      <span className="text-[9px] opacity-70">
                        {tooth.startsWith('48') || tooth.startsWith('38') ? 'Khôn' : 'R'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Midline divider */}
              <div className="w-0.5 h-12 bg-blue-300 mx-1" title="Đường giữa" />

              {/* Q3 Left */}
              <div className="flex gap-1">
                {q3.map((tooth) => {
                  const isSelected =
                    activeToothModal.tooth === 'Toàn hàm' ||
                    currentTeeth.includes(tooth);
                  return (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => onToggleToothSelect(tooth)}
                      className={`w-9 h-12 flex flex-col items-center justify-between py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 scale-105'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                      title={TEETH_DESCRIPTIONS[tooth]}
                    >
                      <span>{tooth}</span>
                      <span className="text-[9px] opacity-70">
                        {tooth.startsWith('48') || tooth.startsWith('38') ? 'Khôn' : 'R'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Đã chọn:{' '}
            <strong className="text-blue-700 text-sm">
              {activeToothModal.tooth || 'Chưa chọn răng nào'}
            </strong>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Xác nhận vị trí
          </button>
        </div>
      </div>
    </div>
  );
}
