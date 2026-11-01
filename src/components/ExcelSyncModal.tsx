import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  X,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { AppointmentItem } from '../data/dentalData';
import { parseExcelDentalFile, ParseResult } from '../lib/excelImporter';

interface ExcelSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDateKey: string;
  initialFile?: File | null;
  onApplySync: (
    importedData: Record<string, AppointmentItem[]>,
    mode: 'replace_current' | 'merge_current' | 'import_all',
    selectedDateToSwitch?: string
  ) => void;
}

export default function ExcelSyncModal({
  isOpen,
  onClose,
  currentDateKey,
  initialFile,
  onApplySync
}: ExcelSyncModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [syncMode, setSyncMode] = useState<'replace_current' | 'merge_current' | 'import_all'>('import_all');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (isOpen && initialFile) {
      processFile(initialFile);
    }
  }, [isOpen, initialFile]);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await parseExcelDentalFile(file, currentDateKey);
      setParseResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể đọc dữ liệu từ file Excel này. Vui lòng kiểm tra lại định dạng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleConfirmSync = () => {
    if (!parseResult) return;

    // Pick first detected date to switch to if applicable
    const firstDate = parseResult.detectedDates[0];
    onApplySync(parseResult.appointmentsByDate, syncMode, firstDate);
    onClose();
  };

  // Preview items across detected dates
  const previewItems: AppointmentItem[] = [];
  if (parseResult) {
    Object.values(parseResult.appointmentsByDate).forEach((list) => {
      previewItems.push(...list);
    });
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                Đồng Bộ Lịch Khám Từ File Excel
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kéo thả file .xlsx, .xls để tự động cập nhật danh sách bệnh nhân và đợt thanh toán
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Drag & Drop Area */}
          {!parseResult && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                hidden
                onChange={handleFileInputChange}
              />
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                <Upload size={26} className={isLoading ? 'animate-bounce' : ''} />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  {isLoading
                    ? 'Đang phân tích file Excel...'
                    : 'Kéo thả file Excel vào đây, hoặc nhấp để chọn'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Hỗ trợ định dạng .xlsx, .xls và .csv (tự động nhận diện cột và ngày khám)
                </p>
              </div>

              <button
                type="button"
                className="mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                Chọn file từ máy tính
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Result & Options */}
          {parseResult && (
            <div className="space-y-4">
              {/* Success Info Banner */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-950 text-xs">
                      Đã đọc thành công: {parseResult.fileName}
                    </div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">
                      Tìm thấy <strong>{parseResult.totalCount}</strong> ca khám trên{' '}
                      <strong>{parseResult.detectedDates.length}</strong> ngày khám ({parseResult.detectedDates.join(', ')})
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setParseResult(null);
                    setErrorMsg(null);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Chọn file khác
                </button>
              </div>

              {/* Sync Mode Selection */}
              <div>
                <label className="font-bold text-slate-800 block mb-2">
                  Phương thức đồng bộ vào hệ thống:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <label
                    onClick={() => setSyncMode('import_all')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      syncMode === 'import_all'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        Đồng bộ tất cả ngày
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Lưu toàn bộ lịch khám của các ngày có trong file
                      </p>
                    </div>
                    <span className="text-[10px] text-blue-700 font-bold mt-2">
                      (Khuyến nghị)
                    </span>
                  </label>

                  <label
                    onClick={() => setSyncMode('replace_current')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      syncMode === 'replace_current'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        Ghi đè ngày hiện tại
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Thay thế toàn bộ danh sách ngày đang mở bằng file này
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setSyncMode('merge_current')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      syncMode === 'merge_current'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        Ghép thêm ca khám
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Thêm các ca mới vào danh sách hiện tại (giữ nguyên ca cũ)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Data Preview Table */}
              <div>
                <div className="font-bold text-slate-800 text-xs mb-1.5 flex items-center justify-between">
                  <span>Xem trước danh sách (5 ca khám đầu tiên):</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Tổng số {previewItems.length} ca
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11.5px] border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-14">STT</th>
                        <th className="p-2 w-20">Giờ</th>
                        <th className="p-2 min-w-[120px]">Bệnh nhân</th>
                        <th className="p-2 w-24">SĐT</th>
                        <th className="p-2 min-w-[140px]">Dịch vụ</th>
                        <th className="p-2 w-24">Bác sĩ</th>
                        <th className="p-2 w-20">Răng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewItems.slice(0, 5).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono text-slate-500">#{item.id}</td>
                          <td className="p-2 font-mono font-semibold text-slate-800">{item.time}</td>
                          <td className="p-2 font-semibold text-slate-900">{item.name}</td>
                          <td className="p-2 font-mono text-slate-600">{item.phone || '-'}</td>
                          <td className="p-2 truncate max-w-[160px] text-blue-700">{item.serviceCode}</td>
                          <td className="p-2 text-slate-700">{item.doctor}</td>
                          <td className="p-2 text-slate-700 font-mono">{item.tooth || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Dữ liệu sau khi đồng bộ sẽ được tự động lưu lên Firebase Firestore và bộ đệm an toàn
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-medium text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!parseResult}
              onClick={handleConfirmSync}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>Đồng bộ ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
