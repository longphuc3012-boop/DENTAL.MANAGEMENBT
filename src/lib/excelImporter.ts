import * as XLSX from 'xlsx';
import {
  AppointmentItem,
  PaymentEntry,
  getVisitDuration,
  formatDateToKey,
  parseTimeToMinutes,
  formatMinutesToTime,
  treatmentGroups
} from '../data/dentalData';

export interface ParseResult {
  appointmentsByDate: Record<string, AppointmentItem[]>;
  totalCount: number;
  fileName: string;
  detectedDates: string[];
}

/**
 * Normalizes Vietnamese text for fuzzy header matching
 */
const normalizeHeader = (header: string): string => {
  return String(header || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
};

/**
 * Finds matching groupCode and serviceCode based on imported text
 */
const matchTreatment = (
  serviceText: string,
  groupText: string
): { groupCode: string; serviceCode: string } => {
  const normService = normalizeHeader(serviceText);

  // Scan all treatment groups
  for (const group of Object.values(treatmentGroups)) {
    for (const [code, t] of Object.entries(group.treatments)) {
      if (
        code.toLowerCase() === serviceText.toLowerCase() ||
        normalizeHeader(t.name) === normService ||
        normService.includes(normalizeHeader(t.name)) ||
        normalizeHeader(t.name).includes(normService)
      ) {
        return { groupCode: group.code, serviceCode: code };
      }
    }
  }

  // Fallback defaults
  return { groupCode: 'GR001', serviceCode: 'TR001' };
};

/**
 * Parses payment details from various Excel column structures
 */
const parsePaymentsFromRow = (
  row: Record<string, any>,
  visitNumber: number
): PaymentEntry[] => {
  const entries: PaymentEntry[] = [];

  // Case 1: Composite string format: "Đợt 1: 5.000.000 đ | Đợt 2: 3.000.000 đ" or "1:5000000|2:3000000"
  for (const key of Object.keys(row)) {
    const norm = normalizeHeader(key);
    if (norm.includes('chitietdotthu') || norm.includes('paymentinstallment')) {
      const val = String(row[key] || '');
      if (val.includes('|')) {
        val.split('|').forEach((seg) => {
          const digits = seg.replace(/\D/g, '');
          const match = seg.match(/(?:đợt|dot|install)?\s*(\d+)[\s:]+(\d+[\d.,]*)/i);
          if (match) {
            entries.push({
              installment: parseInt(match[1], 10) || 1,
              amount: match[2].replace(/\D/g, ''),
              method: 'Tiền mặt'
            });
          } else if (digits) {
            entries.push({
              installment: entries.length + 1,
              amount: digits,
              method: 'Tiền mặt'
            });
          }
        });
        if (entries.length > 0) return entries;
      }
    }
  }

  // Case 2: Individual installment columns: "Thu Đợt 1", "Thu Đợt 2", "Đợt 1", "Đợt 2"...
  for (let i = 1; i <= 10; i += 1) {
    for (const key of Object.keys(row)) {
      const norm = normalizeHeader(key);
      if (
        norm === `thudot${i}` ||
        norm === `dot${i}` ||
        norm === `installment${i}` ||
        norm === `thudot${i}vnd`
      ) {
        const amt = String(row[key] || '').replace(/\D/g, '');
        if (amt && amt !== '0') {
          entries.push({
            installment: i,
            amount: amt,
            method: 'Tiền mặt'
          });
        }
      }
    }
  }

  // Case 3: Single "Đã thu" column
  if (entries.length === 0) {
    for (const key of Object.keys(row)) {
      const norm = normalizeHeader(key);
      if (norm === 'dathu' || norm === 'dathuvnd' || norm === 'paid') {
        const amt = String(row[key] || '').replace(/\D/g, '');
        if (amt) {
          entries.push({
            installment: Math.max(1, visitNumber),
            amount: amt,
            method: 'Tiền mặt'
          });
        }
      }
    }
  }

  // Fallback default
  if (entries.length === 0) {
    entries.push({
      installment: Math.max(1, visitNumber),
      amount: '',
      method: 'Tiền mặt'
    });
  }

  return entries.sort((a, b) => a.installment - b.installment);
};

/**
 * Parses a date value from Excel into 'DD/MM/YYYY' and 'YYYY-MM-DD'
 */
const parseExcelDate = (val: any): { display: string; key: string } => {
  const today = new Date();
  if (!val) {
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return { display: `${d}/${m}/${y}`, key: `${y}-${m}-${d}` };
  }

  // Handle Excel serial date numbers (e.g. 45430)
  if (typeof val === 'number') {
    const dateObj = new Date((val - (25567 + 2)) * 86400 * 1000);
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return { display: `${d}/${m}/${y}`, key: `${y}-${m}-${d}` };
  }

  const str = String(val).trim();
  // Check DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return { display: `${d}/${m}/${y}`, key: `${y}-${m}-${d}` };
  }

  // Check YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return { display: `${d}/${m}/${y}`, key: `${y}-${m}-${d}` };
  }

  const d = String(today.getDate()).padStart(2, '0');
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const y = today.getFullYear();
  return { display: `${d}/${m}/${y}`, key: `${y}-${m}-${d}` };
};

/**
 * Format Excel time value (e.g. 0.3541666667 or "08:30" or "8:30:00")
 */
const parseExcelTime = (val: any): string => {
  if (typeof val === 'number') {
    // Fractional day
    const totalMinutes = Math.round(val * 24 * 60);
    return formatMinutesToTime(totalMinutes);
  }
  const str = String(val || '').trim();
  const match = str.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    const h = match[1].padStart(2, '0');
    const m = match[2];
    return `${h}:${m}`;
  }
  return '08:00';
};

/**
 * Reads an Excel file buffer, parses rows across sheets, and maps into typed AppointmentItem objects
 */
export async function parseExcelDentalFile(
  file: File,
  fallbackDateKey: string
): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  // Select target sheet: prefer "Lich_Kham_Ngay" or first sheet with data
  let targetSheetName = wb.SheetNames[0];
  for (const name of wb.SheetNames) {
    const norm = normalizeHeader(name);
    if (norm.includes('lichkham') || norm.includes('appointment') || norm.includes('tonghop')) {
      targetSheetName = name;
      break;
    }
  }

  const worksheet = wb.Sheets[targetSheetName];
  if (!worksheet) {
    throw new Error('File Excel không có dữ liệu bảng tính hợp lệ.');
  }

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: ''
  });

  if (rawRows.length === 0) {
    throw new Error('Trang tính được chọn trong file Excel đang để trống.');
  }

  const appointmentsByDate: Record<string, AppointmentItem[]> = {};
  const detectedDatesSet = new Set<string>();

  rawRows.forEach((row, index) => {
    // Find fields using fuzzy header lookup
    let id = '';
    let name = '';
    let phone = '';
    let time = '08:00';
    let endTime = '';
    let dateVal: any = null;
    let doctor = 'Bs.Dinh';
    let chair = 'Ghế 1 (Tổng quát)';
    let groupText = '';
    let serviceText = '';
    let tooth = '';
    let visitNumber = 1;
    let status = 'Đã đặt';
    let note = '';
    let duration = 30;

    for (const [key, val] of Object.entries(row)) {
      const norm = normalizeHeader(key);
      const strVal = String(val).trim();

      if (norm === 'malich' || norm === 'mastt' || norm === 'id' || norm === 'stt') {
        id = strVal;
      } else if (
        norm === 'benhnhan' ||
        norm === 'hovaten' ||
        norm === 'tenbenhnhan' ||
        norm === 'name' ||
        norm === 'hoten'
      ) {
        name = strVal;
      } else if (norm === 'sodienthoai' || norm === 'sdt' || norm === 'phone') {
        phone = strVal;
      } else if (norm === 'giobatdau' || norm === 'giohen' || norm === 'time') {
        time = parseExcelTime(val);
      } else if (norm === 'gioketthuc' || norm === 'endtime') {
        endTime = parseExcelTime(val);
      } else if (norm === 'ngaykham' || norm === 'date' || norm === 'ngay') {
        dateVal = val;
      } else if (norm === 'bacsi' || norm === 'doctor') {
        doctor = strVal || 'Bs.Dinh';
      } else if (norm === 'ghedieutri' || norm === 'chair' || norm === 'ghe') {
        chair = strVal || 'Ghế 1 (Tổng quát)';
      } else if (norm === 'nhomdieutri' || norm === 'groupcode' || norm === 'nhom') {
        groupText = strVal;
      } else if (
        norm === 'dichvu' ||
        norm === 'servicecode' ||
        norm === 'thuthuat' ||
        norm === 'dichvudieutri'
      ) {
        serviceText = strVal;
      } else if (norm === 'vitrirangfdi' || norm === 'tooth' || norm === 'rang') {
        tooth = strVal;
      } else if (norm === 'lankham' || norm === 'visitnumber' || norm === 'buoikham') {
        const num = parseInt(strVal.replace(/\D/g, ''), 10);
        if (!Number.isNaN(num) && num > 0) visitNumber = num;
      } else if (norm === 'trangthai' || norm === 'status') {
        status = strVal || 'Đã đặt';
      } else if (norm === 'ghichulamssang' || norm === 'ghichu' || norm === 'note') {
        note = strVal;
      } else if (norm === 'thoiluongphut' || norm === 'thoiluong' || norm === 'duration') {
        const dur = parseInt(strVal, 10);
        if (!Number.isNaN(dur) && dur > 0) duration = dur;
      }
    }

    // Skip empty rows
    if (!name && !id && !phone) return;

    const parsedDate = parseExcelDate(dateVal);
    const dateKey = parsedDate.key;
    detectedDatesSet.add(dateKey);

    const { groupCode, serviceCode } = matchTreatment(serviceText, groupText);
    const serviceDuration = getVisitDuration(serviceCode, visitNumber) || duration || 30;

    const startMinutes = parseTimeToMinutes(time);
    const endMinutes = startMinutes + serviceDuration;
    const finalEndTime = endTime || formatMinutesToTime(endMinutes);

    const payments = parsePaymentsFromRow(row, visitNumber);

    const item: AppointmentItem = {
      id: id || String(34241 + index),
      time,
      endTime: finalEndTime,
      duration: serviceDuration,
      name: name || 'Bệnh nhân mới',
      phone,
      date: parsedDate.display,
      groupCode,
      serviceCode,
      tooth: tooth === 'Không chỉ định' ? '' : tooth,
      visitNumber,
      doctor: doctor || 'Bs.Dinh',
      status: (status as any) || 'Đã đặt',
      chair: chair || 'Ghế 1 (Tổng quát)',
      note,
      payments
    };

    if (!appointmentsByDate[dateKey]) {
      appointmentsByDate[dateKey] = [];
    }
    appointmentsByDate[dateKey].push(item);
  });

  const detectedDates = Array.from(detectedDatesSet);
  let totalCount = 0;
  Object.values(appointmentsByDate).forEach((list) => {
    totalCount += list.length;
  });

  return {
    appointmentsByDate,
    totalCount,
    fileName: file.name,
    detectedDates
  };
}
