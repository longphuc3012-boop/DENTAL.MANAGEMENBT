import * as XLSX from 'xlsx';
import {
  AppointmentItem,
  findTreatment,
  getServiceTotalCost,
  getVisitMax,
  getVisitDescription,
  TEETH_DESCRIPTIONS,
  treatmentGroups
} from '../data/dentalData';

export interface BackupHistoryItem {
  id: string;
  timestamp: string;
  dateKey: string;
  totalAppointments: number;
  totalRevenue: number;
  type: 'auto' | 'manual';
}

const formatNumberVND = (num: number): number => num;

/**
 * Generates a clean, structured multi-sheet Excel workbook
 */
export function createDentalExcelWorkbook(
  dateKey: string,
  appointments: AppointmentItem[]
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: Tổng Hợp Lịch Hẹn Ngày
  const sheet1Data = appointments.map((item, idx) => {
    const treatment = findTreatment(item.serviceCode);
    const group = treatmentGroups[item.groupCode];
    const totalCost = getServiceTotalCost(item.serviceCode, item.optionId);
    const payments = item.payments || [];
    const totalPaid = payments.reduce(
      (sum, p) => sum + (parseInt(p.amount, 10) || 0),
      0
    );
    const remaining = Math.max(0, totalCost - totalPaid);
    const paymentsBreakdown = payments
      .map((p) => `Đợt ${p.installment}: ${Number(p.amount || 0).toLocaleString('vi-VN')} đ`)
      .join(' | ');

    return {
      'STT': idx + 1,
      'Mã Lịch': item.id,
      'Giờ Bắt Đầu': item.time || '08:00',
      'Giờ Kết Thúc': item.endTime || '',
      'Thời Lượng (Phút)': item.duration || 30,
      'Bệnh Nhân': item.name,
      'Số Điện Thoại': item.phone || '',
      'Ngày Khám': item.date,
      'Bác Sĩ': item.doctor,
      'Ghế Điều Trị': item.chair || 'Ghế 1 (Tổng quát)',
      'Nhóm Điều Trị': group?.name || item.groupCode,
      'Dịch Vụ': treatment?.name || item.serviceCode,
      'Vị Trí Răng FDI': item.tooth || 'Không chỉ định',
      'Lần Khám': `Buổi ${item.visitNumber || 1} / ${getVisitMax(item.serviceCode)}`,
      'Trạng Thái': item.status,
      'Tổng Chi Phí (VNĐ)': totalCost,
      'Đã Thu (VNĐ)': totalPaid,
      'Còn Lại (VNĐ)': remaining,
      'Chi Tiết Đợt Thu': paymentsBreakdown,
      'Ghi Chú Lâm Sàng': item.note || ''
    };
  });

  const ws1 = XLSX.utils.json_to_sheet(sheet1Data);

  // Column widths for Sheet 1
  ws1['!cols'] = [
    { wch: 6 },  // STT
    { wch: 10 }, // Mã Lịch
    { wch: 12 }, // Giờ Bắt Đầu
    { wch: 12 }, // Giờ Kết Thúc
    { wch: 16 }, // Thời Lượng
    { wch: 22 }, // Bệnh Nhân
    { wch: 14 }, // Số Điện Thoại
    { wch: 12 }, // Ngày Khám
    { wch: 14 }, // Bác Sĩ
    { wch: 20 }, // Ghế Điều Trị
    { wch: 24 }, // Nhóm Điều Trị
    { wch: 30 }, // Dịch Vụ
    { wch: 18 }, // Vị Trí Răng
    { wch: 15 }, // Lần Khám
    { wch: 15 }, // Trạng Thái
    { wch: 18 }, // Tổng Chi Phí
    { wch: 16 }, // Đã Thu
    { wch: 16 }, // Còn Lại
    { wch: 35 }, // Chi Tiết Đợt Thu
    { wch: 40 }  // Ghi Chú
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Lich_Kham_Ngay');

  // 2. Sheet 2: Lộ Trình Điều Trị & Răng
  const sheet2Data = appointments.map((item) => {
    const treatment = findTreatment(item.serviceCode);
    const maxVisits = getVisitMax(item.serviceCode);
    const currentVisit = item.visitNumber || 1;
    const visitDesc = getVisitDescription(item.serviceCode, currentVisit);
    const teethNames = (item.tooth || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => TEETH_DESCRIPTIONS[t] || t)
      .join(', ');

    return {
      'Mã Lịch': item.id,
      'Bệnh Nhân': item.name,
      'Dịch Vụ Điều Trị': treatment?.name || item.serviceCode,
      'Vị Trí Răng (Mã FDI)': item.tooth || 'Toàn hàm',
      'Mô Tả Răng': teethNames || 'Toàn bộ cung hàm',
      'Buổi Hiện Tại': currentVisit,
      'Tổng Số Buổi': maxVisits,
      'Nội Dung Lâm Sàng Buổi Này': visitDesc,
      'Bác Sĩ Phụ Trách': item.doctor,
      'Ghi Chú Thủ Thuật': item.note || ''
    };
  });

  const ws2 = XLSX.utils.json_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 10 },
    { wch: 22 },
    { wch: 30 },
    { wch: 20 },
    { wch: 35 },
    { wch: 14 },
    { wch: 14 },
    { wch: 45 },
    { wch: 15 },
    { wch: 35 }
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Lo_Trinh_Dieu_Tri');

  // 3. Sheet 3: Sổ Thu Chi & Đợt Thanh Toán
  const sheet3Data = appointments.map((item) => {
    const treatment = findTreatment(item.serviceCode);
    const totalCost = getServiceTotalCost(item.serviceCode, item.optionId);
    const payments = item.payments || [];

    const p1 = payments.find((p) => p.installment === 1)?.amount || '0';
    const p2 = payments.find((p) => p.installment === 2)?.amount || '0';
    const p3 = payments.find((p) => p.installment === 3)?.amount || '0';
    const p4 = payments.find((p) => p.installment === 4)?.amount || '0';
    const p5Plus = payments
      .filter((p) => p.installment >= 5)
      .reduce((sum, p) => sum + (parseInt(p.amount, 10) || 0), 0);

    const totalPaid = payments.reduce(
      (sum, p) => sum + (parseInt(p.amount, 10) || 0),
      0
    );
    const debt = Math.max(0, totalCost - totalPaid);

    return {
      'Mã Lịch': item.id,
      'Bệnh Nhân': item.name,
      'Số Điện Thoại': item.phone || '',
      'Dịch Vụ': treatment?.name || item.serviceCode,
      'Tổng Viện Phí (VNĐ)': totalCost,
      'Thu Đợt 1 (VNĐ)': parseInt(p1, 10) || 0,
      'Thu Đợt 2 (VNĐ)': parseInt(p2, 10) || 0,
      'Thu Đợt 3 (VNĐ)': parseInt(p3, 10) || 0,
      'Thu Đợt 4 (VNĐ)': parseInt(p4, 10) || 0,
      'Thu Đợt 5 Trở Đi (VNĐ)': p5Plus,
      'Tổng Đã Thu (VNĐ)': totalPaid,
      'Còn Nợ (VNĐ)': debt,
      'Tình Trạng Công Nợ': debt === 0 ? 'Đã thanh toán đủ' : 'Đang thanh toán từng đợt'
    };
  });

  const ws3 = XLSX.utils.json_to_sheet(sheet3Data);
  ws3['!cols'] = [
    { wch: 10 },
    { wch: 22 },
    { wch: 14 },
    { wch: 30 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'So_Thu_Tien_Tung_Dot');

  return wb;
}

/**
 * Downloads the Excel file to user's computer
 */
export function downloadExcelFile(wb: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(wb, filename);
}

/**
 * Trigger download of current schedule to Excel
 */
export function exportDentalScheduleToExcel(
  dateKey: string,
  appointments: AppointmentItem[]
): string {
  const wb = createDentalExcelWorkbook(dateKey, appointments);
  const filename = `NhaKhoa_SmileCare_SoLichKham_${dateKey}.xlsx`;
  downloadExcelFile(wb, filename);
  return filename;
}
