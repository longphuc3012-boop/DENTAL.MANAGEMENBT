import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Clock,
  CheckCircle,
  X,
  History,
  ShieldCheck,
  RotateCw,
  FolderDown,
  Sparkles
} from 'lucide-react';
import { AppointmentItem } from '../data/dentalData';
import {
  exportDentalScheduleToExcel,
  BackupHistoryItem,
  createDentalExcelWorkbook,
  downloadExcelFile
} from '../lib/excelBackup';

interface BackupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateKey: string;
  appointments: AppointmentItem[];
  allSheetsData: Record<string, AppointmentItem[]>;
  backupHistory: BackupHistoryItem[];
  onTriggerBackupNow: () => void;
  nextBackupInSeconds: number;
  lastBackupTime: string | null;
}

export default function BackupManagerModal({
  isOpen,
  onClose,
  dateKey,
  appointments,
  allSheetsData,
  backupHistory,
  onTriggerBackupNow,
  nextBackupInSeconds,
  lastBackupTime
}: BackupManagerModalProps) {
  if (!isOpen) return null;

  const minutes = Math.floor(nextBackupInSeconds / 60);
  const seconds = nextBackupInSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleDownloadCurrentDay = () => {
    exportDentalScheduleToExcel(dateKey, appointments);
  };

  const handleDownloadAllData = () => {
    const allAppointments: AppointmentItem[] = [];
    Object.keys(allSheetsData).forEach((k) => {
      allAppointments.push(...(allSheetsData[k] || []));
    });

    const wb = createDentalExcelWorkbook('Toan_Bo_Phong_Kham', allAppointments);
    downloadExcelFile(wb, `NhaKhoa_SmileCare_TongHopTatCaNgay.xlsx`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        {/* Clean Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 text-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold shadow-2xs">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight">
                Trung Tâm Sao Lưu Excel Phòng Khám
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động kết xuất và bảo vệ dữ liệu lịch khám mỗi 10 phút
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* 10-minute Auto backup status card */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-950 text-sm">
                    Tự sao lưu định kỳ 10 phút
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-200/70 text-blue-900">
                    Đang chạy
                  </span>
                </div>
                <p className="text-blue-800 mt-0.5">
                  Lần sao lưu trước:{' '}
                  <strong>{lastBackupTime || 'Vừa khởi động'}</strong> · Lần tới sau:{' '}
                  <strong className="font-mono text-blue-950 font-bold">{timeFormatted}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onTriggerBackupNow}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <RotateCw size={13} />
              <span>Sao lưu ngay</span>
            </button>
          </div>

          {/* Quick Download Excel Actions */}
          <div className="space-y-2">
            <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>Tải file Excel ngay lập tức:</span>
              <span className="text-[11px] text-slate-500 font-normal">
                Gồm 3 trang tính (Lịch khám, Lộ trình răng, Sổ thu từng đợt)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadCurrentDay}
                className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-1 text-left transition-all hover:border-blue-400 hover:shadow-xs cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs group-hover:text-blue-700">
                  <Download size={14} />
                  <span>Tải Excel Ngày Này</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Ngày {dateKey} ({appointments.length} bệnh nhân)
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadAllData}
                className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-1 text-left transition-all hover:border-blue-400 hover:shadow-xs cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs group-hover:text-blue-600">
                  <FolderDown size={14} />
                  <span>Tải Toàn Bộ Các Ngày</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Tất cả các ngày trong hệ thống
                </span>
              </button>
            </div>
          </div>

          {/* Excel File Structure Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="font-semibold text-slate-800 text-[11.5px] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Cấu trúc 3 trang tính Excel tự tạo tối ưu quản lý:</span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <strong>Sheet 1 - Lich_Kham_Ngay:</strong> Danh sách ca khám, giờ bắt đầu/kết thúc, bác sĩ, ghế khám, chi phí.
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <strong>Sheet 2 - Lo_Trinh_Dieu_Tri:</strong> Từng răng FDI, giải phẫu răng, tiến độ buổi khám và mô tả thủ thuật.
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <strong>Sheet 3 - So_Thu_Tien_Tung_Dot:</strong> Bảng kê chi tiết số tiền đóng từng đợt (Đợt 1, 2, 3, 4, 5+), tổng đã thu và công nợ.
              </div>
            </div>
          </div>

          {/* Backup History Table */}
          <div>
            <div className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
              <History size={13} className="text-slate-500" />
              <span>Lịch sử các điểm sao lưu gần đây:</span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 bg-white">
              {backupHistory.length === 0 ? (
                <div className="text-center py-3 text-slate-400 text-xs">
                  Chưa có phiên bản sao lưu nào được lưu.
                </div>
              ) : (
                backupHistory.slice(0, 8).map((hist) => (
                  <div
                    key={hist.id}
                    className="pt-1.5 first:pt-0 flex items-center justify-between text-slate-700 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-500">{hist.timestamp}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                          hist.type === 'auto'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {hist.type === 'auto' ? 'Tự động 10p' : 'Thủ công'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        {hist.totalAppointments} ca khám
                      </span>
                      <span className="font-mono text-emerald-600 font-semibold">
                        {hist.totalRevenue.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Dữ liệu luôn được sao lưu an toàn cục bộ và đồng bộ Firebase
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
