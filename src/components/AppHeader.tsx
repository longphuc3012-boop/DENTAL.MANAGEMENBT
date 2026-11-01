import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Printer,
  Sparkles,
  LayoutGrid,
  ListFilter,
  Clock,
  RotateCcw,
  FileSpreadsheet,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  CloudCheck,
  MessageCircle
} from 'lucide-react';
import { User } from 'firebase/auth';
import { formatDateDisplay } from '../data/dentalData';


interface AppHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDate: Date;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean | ((prev: boolean) => boolean)) => void;
  handleShiftDate: (days: number) => void;
  handleDateChange: (date: Date) => void;
  currentView?: 'table' | 'timeline';
  setCurrentView?: (view: 'table' | 'timeline') => void;
  onResetData?: () => void;
  // Excel Auto Backup
  onOpenBackupModal: () => void;
  nextBackupInSeconds: number;
  lastBackupTime: string | null;
  // Zalo Automated Notification
  onOpenZaloModal: () => void;
  // Firebase Auth
  currentUser: User | null;
  onLoginGoogle: () => void;
  onLogoutGoogle: () => void;
  isCloudSynced: boolean;
}

export default function AppHeader({
  searchTerm,
  setSearchTerm,
  selectedDate,
  showDatePicker,
  setShowDatePicker,
  handleShiftDate,
  handleDateChange,
  currentView = 'table',
  setCurrentView,
  onResetData,
  onOpenBackupModal,
  nextBackupInSeconds,
  lastBackupTime,
  onOpenZaloModal,
  currentUser,
  onLoginGoogle,
  onLogoutGoogle,
  isCloudSynced
}: AppHeaderProps) {
  const dayOfWeekNames = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy'
  ];
  const dayName = dayOfWeekNames[selectedDate.getDay()];
  const formattedDate = formatDateDisplay(selectedDate);
  const isToday = new Date().toDateString() === selectedDate.toDateString();

  const minutes = Math.floor(nextBackupInSeconds / 60);
  const seconds = nextBackupInSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleSelectQuickDate = (type: 'yesterday' | 'today' | 'tomorrow') => {
    const d = new Date();
    if (type === 'yesterday') d.setDate(d.getDate() - 1);
    if (type === 'tomorrow') d.setDate(d.getDate() + 1);
    handleDateChange(d);
  };

  return (
    <header className="bg-white text-slate-900 px-5 py-2.5 border-b-2 border-slate-300 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Brand & Clinic Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-500/20">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C7.5 2 4 4.5 4 8c0 2.5 1.5 4.5 2.5 7.5.5 1.5.5 4.5 2.5 4.5s2.5-3 3-5c.5 2 1 5 3 5s2-3 2.5-4.5C18.5 12.5 20 10.5 20 8c0-3.5-3.5-6-8-6zm-4 6c-.8 0-1.5-.7-1.5-1.5S7.2 5 8 5s1.5.7 1.5 1.5S8.8 8 8 8zm8 0c-.8 0-1.5-.7-1.5-1.5S15.2 5 16 5s1.5.7 1.5 1.5S16.8 8 16 8z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-950 tracking-tight leading-tight">
                Nha Khoa SmileCare
              </h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-300">
                Lịch Hẹn Khám
              </span>
              {isCloudSynced && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Đồng bộ Cloud
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Quản lý điều trị, sơ đồ răng FDI & đợt thanh toán
            </p>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick jump buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-300 text-xs">
            <button
              type="button"
              onClick={() => handleSelectQuickDate('yesterday')}
              className="px-2.5 py-1 text-slate-700 hover:text-slate-950 rounded-lg transition-colors font-medium cursor-pointer"
            >
              Hôm qua
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickDate('today')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-bold cursor-pointer ${
                isToday
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-300'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickDate('tomorrow')}
              className="px-2.5 py-1 text-slate-700 hover:text-slate-950 rounded-lg transition-colors font-medium cursor-pointer"
            >
              Ngày mai
            </button>
          </div>

          {/* Stepper with current date */}
          <div className="relative flex items-center bg-white text-slate-900 border-2 border-slate-300 rounded-xl shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="p-1.5 text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer border-r border-slate-300 font-bold"
              title="Ngày trước"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => setShowDatePicker((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Calendar size={14} className="text-blue-600" />
              <span>
                {dayName}, {formattedDate}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="p-1.5 text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer border-l border-slate-300 font-bold"
              title="Ngày sau"
            >
              <ChevronRight size={16} />
            </button>

            {/* Date Picker Dropdown Popover */}
            {showDatePicker && (
              <div className="absolute top-[calc(100%+8px)] left-0 bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-xl p-3.5 z-50 min-w-[270px] animate-in fade-in">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900">
                    Chọn ngày khám
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <input
                  type="date"
                  value={`${selectedDate.getFullYear()}-${String(
                    selectedDate.getMonth() + 1
                  ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(
                    2,
                    '0'
                  )}`}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value
                        .split('-')
                        .map((n) => parseInt(n, 10));
                      handleDateChange(new Date(y, m - 1, d));
                      setShowDatePicker(false);
                    }
                  }}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 outline-none focus:border-blue-500 font-semibold"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Pills & Search & Auth */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Auto-Backup Status Pill */}
          <button
            type="button"
            onClick={onOpenBackupModal}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl border border-emerald-400 text-xs font-bold transition-all cursor-pointer shadow-2xs group"
            title="Nhấp để mở Trung Tâm Sao Lưu Excel & Tải file"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <FileSpreadsheet size={14} className="text-emerald-700" />
            <div className="flex items-center gap-1">
              <span>Sao lưu:</span>
              <span className="font-mono font-bold text-emerald-950 bg-white px-1.5 py-0.2 rounded border border-emerald-300">
                {timeFormatted}
              </span>
            </div>
          </button>

          {/* Zalo Automated Notification Button */}
          <button
            type="button"
            onClick={onOpenZaloModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl border border-blue-400 text-xs font-bold transition-all cursor-pointer shadow-2xs group"
            title="Mở Trung Tâm Gửi Thông Báo Zalo Tự Động"
          >
            <MessageCircle size={15} className="text-blue-600" />
            <span>Gửi Zalo</span>
            <span className="hidden xl:inline text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-600 text-white">
              Tự động
            </span>
          </button>

          {/* View Mode Toggle */}
          {setCurrentView && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-300 text-xs">
              <button
                type="button"
                onClick={() => setCurrentView('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-medium ${
                  currentView === 'table'
                    ? 'bg-white text-blue-600 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Dạng bảng chi tiết"
              >
                <ListFilter size={13} />
                <span className="hidden sm:inline">Bảng lịch</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('timeline')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-medium ${
                  currentView === 'timeline'
                    ? 'bg-white text-blue-600 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Sơ đồ theo ghế nha khoa & thời gian"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Sơ đồ ghế</span>
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative w-40 sm:w-52">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm bệnh nhân, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-6 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Google Auth / Profile Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Bác sĩ'}
                  className="w-6 h-6 rounded-full border border-slate-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {(currentUser.displayName || currentUser.email || 'B').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[100px] hidden sm:inline">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
              <button
                type="button"
                onClick={onLogoutGoogle}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg cursor-pointer transition-colors"
                title="Đăng xuất"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLoginGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              title="Đăng nhập Google để đồng bộ dữ liệu đám mây"
            >
              <LogIn size={13} />
              <span>Đăng nhập</span>
            </button>
          )}

          {/* Print button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
            title="In lịch khám ngày"
          >
            <Printer size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
