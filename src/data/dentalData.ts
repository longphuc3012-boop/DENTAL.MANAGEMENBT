/**
 * Dental Clinic Data and Utility Definitions
 * Dữ liệu nghiệp vụ Nha Khoa & Quản lý lịch hẹn
 */

export interface TreatmentOption {
  id: string;
  name: string;
  costModifier: number; // additional cost in VND
  description?: string;
}

export interface TreatmentDetail {
  code: string;
  name: string;
  defaultDuration: number; // in minutes
  maxVisits: number;
  baseCost: number; // in VND
  visitDurations?: number[]; // duration in minutes per visit index (1-based)
  visitDescriptions?: string[]; // description of clinical step for each visit
  options?: TreatmentOption[];
}

export interface TreatmentGroup {
  name: string;
  code: string;
  treatments: Record<string, TreatmentDetail>;
}

export interface PaymentEntry {
  installment: number;
  amount: string; // digits string e.g. "500000"
  paidAt?: string;
  method?: string; // 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ'
}

export interface AppointmentItem {
  id: string;
  time: string; // 'HH:mm'
  endTime?: string;
  duration?: number;
  name: string;
  phone: string;
  date: string; // 'DD/MM/YYYY'
  groupCode: string;
  serviceCode: string;
  optionId?: string;
  tooth: string; // e.g. '16, 17' or 'Toàn hàm'
  visitNumber: number;
  doctor: string;
  status: 'Đã đặt' | 'Chờ đến lượt' | 'Chờ khám' | 'Đang khám' | 'Hoàn thành' | 'Đã khám' | 'Hủy';
  note: string;
  payments: PaymentEntry[];
  gender?: 'Nam' | 'Nữ';
  birthYear?: number;
  chair?: string; // e.g. 'Ghế 1', 'Ghế 2', 'Ghế 3', 'Phòng tiểu phẫu'
}

export const DOCTORS = [
  'Bs.Dinh',
  'Bs.Minh',
  'Bs.Lan',
  'Bs.Thao',
  'Bs.Tuan',
  'Bs.Huong'
];

export const CHAIRS = [
  'Ghế 1 (Tổng quát)',
  'Ghế 2 (Chỉnh nha)',
  'Ghế 3 (Thẩm mỹ)',
  'Phòng Phẫu thuật'
];

export const STATUS_LIST = [
  'Đã đặt',
  'Chờ đến lượt',
  'Đang khám',
  'Đã khám',
  'Hoàn thành',
  'Hủy'
];

// FDI 2-digit dental notation
// Upper Arch: Q1 (18->11) and Q2 (21->28)
export const TEETH_UPPER = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28'
];

// Lower Arch: Q4 (48->41) and Q3 (31->38)
export const TEETH_LOWER = [
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38'
];

export const TEETH_DESCRIPTIONS: Record<string, string> = {
  '18': 'Răng khôn trên phải', '17': 'Răng cối 2 trên phải', '16': 'Răng cối 1 trên phải',
  '15': 'Răng tiền cối 2 trên phải', '14': 'Răng tiền cối 1 trên phải', '13': 'Răng nanh trên phải',
  '12': 'Răng cửa bên trên phải', '11': 'Răng cửa giữa trên phải',
  '21': 'Răng cửa giữa trên trái', '22': 'Răng cửa bên trên trái', '23': 'Răng nanh trên trái',
  '24': 'Răng tiền cối 1 trên trái', '25': 'Răng tiền cối 2 trên trái', '26': 'Răng cối 1 trên trái',
  '27': 'Răng cối 2 trên trái', '28': 'Răng khôn trên trái',
  '48': 'Răng khôn dưới phải', '47': 'Răng cối 2 dưới phải', '46': 'Răng cối 1 dưới phải',
  '45': 'Răng tiền cối 2 dưới phải', '44': 'Răng tiền cối 1 dưới phải', '43': 'Răng nanh dưới phải',
  '42': 'Răng cửa bên dưới phải', '41': 'Răng cửa giữa dưới phải',
  '31': 'Răng cửa giữa dưới trái', '32': 'Răng cửa bên dưới trái', '33': 'Răng nanh dưới trái',
  '34': 'Răng tiền cối 1 dưới trái', '35': 'Răng tiền cối 2 dưới trái', '36': 'Răng cối 1 dưới trái',
  '37': 'Răng cối 2 dưới trái', '38': 'Răng khôn dưới trái'
};

export const MULTI_VISIT_CODES = [
  'TR008', // Điều trị tủy 1 chân (2 buổi)
  'TR009', // Điều trị tủy nhiều chân (3 buổi)
  'TR010', // Bọc răng sứ (3 buổi)
  'TR011', // Dán Veneer (2 buổi)
  'TR012', // Cấy ghép Implant (4 buổi)
  'TR014', // Niềng răng mắc cài (18 buổi)
  'TR015'  // Niềng răng Invisalign (12 buổi)
];

export const FULL_MOUTH_CODES = [
  'TR001', // Khám tổng quát
  'TR004', // Cạo vôi răng toàn hàm
  'TR014', // Niềng răng mắc cài
  'TR015', // Niềng răng Invisalign
  'TR016', // Tẩy trắng Laser toàn hàm
  'TR017'  // Tẩy trắng máng ngậm
];

export const treatmentGroups: Record<string, TreatmentGroup> = {
  GR001: {
    code: 'GR001',
    name: 'Khám & Chẩn đoán',
    treatments: {
      TR001: {
        code: 'TR001',
        name: 'Khám tổng quát & Lập phác đồ',
        defaultDuration: 30,
        maxVisits: 1,
        baseCost: 150000,
        visitDescriptions: ['Khám khoang miệng, chụp ảnh cận lâm sàng, tư vấn phác đồ']
      },
      TR002: {
        code: 'TR002',
        name: 'Chụp phim X-Quang / CT ConeBeam',
        defaultDuration: 20,
        maxVisits: 1,
        baseCost: 350000,
        visitDescriptions: ['Chụp phim kỹ thuật số đánh giá xương và chân răng']
      }
    }
  },
  GR002: {
    code: 'GR002',
    name: 'Nha khoa Tổng quát & Trám răng',
    treatments: {
      TR003: {
        code: 'TR003',
        name: 'Trám răng thẩm mỹ Composite',
        defaultDuration: 35,
        maxVisits: 1,
        baseCost: 350000,
        options: [
          { id: 'opt_comp_stand', name: 'Composite 3M tiêu chuẩn', costModifier: 0 },
          { id: 'opt_comp_prem', name: 'Composite Filtek Z350 cao cấp', costModifier: 150000 }
        ],
        visitDescriptions: ['Làm sạch xoang sâu, etch, bond, đắp composite thẩm mỹ và đánh bóng']
      },
      TR004: {
        code: 'TR004',
        name: 'Cạo vôi răng & Đánh bóng toàn hàm',
        defaultDuration: 30,
        maxVisits: 1,
        baseCost: 250000,
        visitDescriptions: ['Lấy vôi siêu âm hạn chế ê buốt, đánh bóng làm sạch mảng bám']
      },
      TR005: {
        code: 'TR005',
        name: 'Điều trị viêm nướu & Nha chu',
        defaultDuration: 40,
        maxVisits: 2,
        baseCost: 600000,
        visitDurations: [40, 30],
        visitDescriptions: [
          'Nạo túi nha chu làm sạch ổ mủ dưới nướu',
          'Tái khám, bơm rửa sát khuẩn dung dịch chuyên dụng'
        ]
      }
    }
  },
  GR003: {
    code: 'GR003',
    name: 'Nhổ răng & Tiểu phẫu',
    treatments: {
      TR006: {
        code: 'TR006',
        name: 'Nhổ răng khôn (Công nghệ Piezotome)',
        defaultDuration: 45,
        maxVisits: 2,
        baseCost: 1800000,
        visitDurations: [45, 15],
        options: [
          { id: 'opt_piezo_easy', name: 'Độ khó I (Mọc thẳng/nghiêng nhẹ)', costModifier: 0 },
          { id: 'opt_piezo_hard', name: 'Độ khó II (Mọc ngầm/nghiêng 90 độ)', costModifier: 1200000 }
        ],
        visitDescriptions: [
          'Gây tê không đau, nhổ bằng sóng siêu âm Piezotome, khâu chỉ tự tiêu',
          'Tái khám kiểm tra huyệt ổ răng, tháo chỉ nếu cần'
        ]
      },
      TR007: {
        code: 'TR007',
        name: 'Nhổ răng thường / Răng lung lay',
        defaultDuration: 25,
        maxVisits: 1,
        baseCost: 300000,
        visitDescriptions: ['Gây tê tại chỗ, nhổ bỏ chân răng tồn dư nhẹ nhàng']
      }
    }
  },
  GR004: {
    code: 'GR004',
    name: 'Điều trị Tủy (Nội nha)',
    treatments: {
      TR008: {
        code: 'TR008',
        name: 'Điều trị tủy răng 1 chân (Răng cửa/nanh)',
        defaultDuration: 45,
        maxVisits: 2,
        baseCost: 1200000,
        visitDurations: [45, 35],
        visitDescriptions: [
          'Mở tủy, đo chiều dài ống tủy bằng máy Apex, đặt thuốc diệt tủy',
          'Trám bít ống tủy vĩnh viễn bằng Gutta Percha'
        ]
      },
      TR009: {
        code: 'TR009',
        name: 'Điều trị tủy răng cối nhiều chân',
        defaultDuration: 50,
        maxVisits: 3,
        baseCost: 2200000,
        visitDurations: [50, 45, 30],
        visitDescriptions: [
          'Mở tủy, lấy tủy hoại tử, đặt thuốc giảm đau & khử trùng',
          'Tạo hình ống tủy xoay máy Protaper, bơm rửa siêu âm',
          'Trám bít buồng tủy 3D vĩnh viễn, hàn kín xoang tủy'
        ]
      }
    }
  },
  GR005: {
    code: 'GR005',
    name: 'Răng sứ Thẩm mỹ',
    treatments: {
      TR010: {
        code: 'TR010',
        name: 'Bọc răng sứ cao cấp (Cercon / Zirconia)',
        defaultDuration: 60,
        maxVisits: 3,
        baseCost: 3500000,
        visitDurations: [60, 40, 30],
        options: [
          { id: 'opt_zir_std', name: 'Sứ Zirconia Đức', costModifier: 0 },
          { id: 'opt_cer_ht', name: 'Sứ Cercon HT Siêu Trong', costModifier: 1500000 },
          { id: 'opt_lava_plus', name: 'Sứ Lava Plus Mỹ 3M', costModifier: 3000000 }
        ],
        visitDescriptions: [
          'Mài cùi răng tạo hình, lấy dấu mẫu hàm kỹ thuật số 3D, gắn răng tạm',
          'Thử sườn sứ, chỉnh khớp cắn và thẩm mỹ màu sắc',
          'Gắn sứ vĩnh viễn bằng cement sinh học, hướng dẫn bảo hành'
        ]
      },
      TR011: {
        code: 'TR011',
        name: 'Dán sứ Veneer Emax bảo tồn mô',
        defaultDuration: 60,
        maxVisits: 2,
        baseCost: 5500000,
        visitDurations: [60, 45],
        options: [
          { id: 'opt_ven_emax', name: 'Veneer Emax Press', costModifier: 0 },
          { id: 'opt_ven_laminate', name: 'Veneer Siêu mỏng Lisi Thụy Sĩ', costModifier: 2000000 }
        ],
        visitDescriptions: [
          'Sửa soạn mặt ngoài siêu mỏng 0.2mm - 0.5mm, scan 3D iTero, dán mặt tạm',
          'Thử độ khít sát, dán gắn cố định bằng composite chuyên dụng'
        ]
      }
    }
  },
  GR006: {
    code: 'GR006',
    name: 'Cấy ghép Implant',
    treatments: {
      TR012: {
        code: 'TR012',
        name: 'Cấy ghép trụ Implant nha khoa',
        defaultDuration: 60,
        maxVisits: 4,
        baseCost: 15000000,
        visitDurations: [60, 20, 45, 30],
        options: [
          { id: 'opt_imp_korea', name: 'Trụ Dentium / Osstem Hàn Quốc', costModifier: 0 },
          { id: 'opt_imp_swiss', name: 'Trụ Straumann Thụy Sĩ SLA', costModifier: 9000000 },
          { id: 'opt_imp_nobel', name: 'Trụ Nobel Biocare Mỹ', costModifier: 11000000 }
        ],
        visitDescriptions: [
          'Phẫu thuật đặt trụ Implant vào xương hàm theo máng hướng dẫn',
          'Tái khám, cắt chỉ sau phẫu thuật 7-10 ngày',
          'Sau 3-6 tháng: Lấy dấu cùi abutment và mão sứ trên Implant',
          'Gắn mão sứ hoàn thiện lên trụ Implant, bàn giao thẻ bảo hành'
        ]
      },
      TR013: {
        code: 'TR013',
        name: 'Tái khám & Kiểm tra khớp cắn Implant',
        defaultDuration: 25,
        maxVisits: 1,
        baseCost: 200000,
        visitDescriptions: ['Chụp phim kiểm tra mức tích hợp xương quanh trụ Implant']
      }
    }
  },
  GR007: {
    code: 'GR007',
    name: 'Chỉnh nha - Niềng răng',
    treatments: {
      TR014: {
        code: 'TR014',
        name: 'Niềng răng mắc cài kim loại / sứ tự buộc',
        defaultDuration: 45,
        maxVisits: 18,
        baseCost: 32000000,
        visitDurations: [60, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 45],
        options: [
          { id: 'opt_ortho_metal', name: 'Mắc cài kim loại tiêu chuẩn', costModifier: 0 },
          { id: 'opt_ortho_self', name: 'Mắc cài tự buộc Damon Q', costModifier: 8000000 },
          { id: 'opt_ortho_ceramic', name: 'Mắc cài sứ thẩm mỹ Damon Clear', costModifier: 14000000 }
        ],
        visitDescriptions: [
          'Gắn mắc cài hai hàm, luồn dây cung khởi đầu',
          'Siết lực định kỳ, thay chun chuỗi kéo đóng khoảng',
          'Kiểm tra dịch chuyển răng, thay dây cung tăng lực',
          'Theo dõi tương quan khớp cắn và cung cười'
        ]
      },
      TR015: {
        code: 'TR015',
        name: 'Niềng răng khay trong suốt Invisalign',
        defaultDuration: 40,
        maxVisits: 12,
        baseCost: 75000000,
        visitDurations: [60, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 45],
        options: [
          { id: 'opt_inv_moderate', name: 'Gói Moderate (dưới 20 khay)', costModifier: 0 },
          { id: 'opt_inv_comp', name: 'Gói Comprehensive toàn diện', costModifier: 25000000 }
        ],
        visitDescriptions: [
          'Gắn attachment, giao đợt khay 1-5 và hướng dẫn đeo khay',
          'Kiểm tra độ bám khay, giao bộ khay tiếp theo',
          'Đánh giá tiến độ di chuyển răng theo ClinCheck 3D',
          'Tháo attachment, lấy dấu làm hàm duy trì sau chỉnh nha'
        ]
      }
    }
  },
  GR008: {
    code: 'GR008',
    name: 'Tẩy trắng & Thẩm mỹ',
    treatments: {
      TR016: {
        code: 'TR016',
        name: 'Tẩy trắng răng Laser Whitening tại phòng',
        defaultDuration: 45,
        maxVisits: 1,
        baseCost: 2200000,
        visitDescriptions: ['Bôi gel cách ly nướu, chiếu đèn laser kích hoạt tinh chất làm trắng']
      },
      TR017: {
        code: 'TR017',
        name: 'Tẩy trắng răng máng đeo tại nhà (Opalescence)',
        defaultDuration: 30,
        maxVisits: 1,
        baseCost: 1400000,
        visitDescriptions: ['Lấy dấu ép máng mềm ôm sát răng, giao thuốc Opalescence 15%']
      }
    }
  }
};

/**
 * Helpers
 */
export const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 480; // default 08:00
  const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
  return (Number.isNaN(h) ? 8 : h) * 60 + (Number.isNaN(m) ? 0 : m);
};

export const formatMinutesToTime = (minutes: number): string => {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const formatDateToKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatDateDisplay = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

export const findTreatment = (serviceCode: string): TreatmentDetail | undefined => {
  for (const group of Object.values(treatmentGroups)) {
    if (group.treatments[serviceCode]) {
      return group.treatments[serviceCode];
    }
  }
  return undefined;
};

export const getServiceDuration = (serviceCode: string, visitNumber = 1): number => {
  const treatment = findTreatment(serviceCode);
  if (!treatment) return 30;
  if (treatment.visitDurations && treatment.visitDurations[visitNumber - 1]) {
    return treatment.visitDurations[visitNumber - 1];
  }
  return treatment.defaultDuration || 30;
};

export const getVisitMax = (serviceCode: string): number => {
  const treatment = findTreatment(serviceCode);
  return treatment ? treatment.maxVisits : 1;
};

export const getVisitDuration = (serviceCode: string, visitNumber = 1): number => {
  return getServiceDuration(serviceCode, visitNumber);
};

export const getServiceTotalCost = (serviceCode: string, optionId?: string): number => {
  const treatment = findTreatment(serviceCode);
  if (!treatment) return 0;
  let total = treatment.baseCost || 0;
  if (optionId && treatment.options) {
    const opt = treatment.options.find((o) => o.id === optionId);
    if (opt) total += opt.costModifier;
  }
  return total;
};

export const getVisitDescription = (serviceCode: string, visitNumber = 1): string => {
  const treatment = findTreatment(serviceCode);
  if (!treatment || !treatment.visitDescriptions) return 'Tiến hành thủ thuật lâm sàng';
  return treatment.visitDescriptions[visitNumber - 1] || treatment.visitDescriptions[0] || 'Khám & điều trị';
};

/**
 * Realistic initial schedule data
 */
export const initialSheets: Record<string, AppointmentItem[]> = {
  // 2024-05-18 (matches the baseline in App_32f000f3.jsx)
  '2024-05-18': [
    {
      id: '34241',
      time: '08:00',
      endTime: '08:35',
      duration: 35,
      name: 'Nguyễn Văn Hùng',
      phone: '0912 345 678',
      date: '18/05/2024',
      groupCode: 'GR002',
      serviceCode: 'TR003',
      optionId: 'opt_comp_prem',
      tooth: '16, 26',
      visitNumber: 1,
      doctor: 'Bs.Dinh',
      status: 'Đã khám',
      note: 'Răng sâu kẽ, bệnh nhân sợ buốt, đã bôi giảm nhạy cảm',
      payments: [{ installment: 1, amount: '500000', method: 'Chuyển khoản' }],
      gender: 'Nam',
      birthYear: 1988,
      chair: 'Ghế 1 (Tổng quát)'
    },
    {
      id: '34242',
      time: '08:40',
      endTime: '09:40',
      duration: 60,
      name: 'Trần Thị Mai',
      phone: '0983 221 456',
      date: '18/05/2024',
      groupCode: 'GR005',
      serviceCode: 'TR010',
      optionId: 'opt_cer_ht',
      tooth: '11, 12, 21, 22',
      visitNumber: 2,
      doctor: 'Bs.Minh',
      status: 'Đang khám',
      note: 'Thử sườn sứ Cercon HT, kiểm tra viền nướu và thẩm mỹ',
      payments: [
        { installment: 1, amount: '8000000', method: 'Chuyển khoản' },
        { installment: 2, amount: '6000000', method: 'Tiền mặt' }
      ],
      gender: 'Nữ',
      birthYear: 1994,
      chair: 'Ghế 3 (Thẩm mỹ)'
    },
    {
      id: '34243',
      time: '09:45',
      endTime: '10:30',
      duration: 45,
      name: 'Lê Hoàng Nam',
      phone: '0903 889 123',
      date: '18/05/2024',
      groupCode: 'GR007',
      serviceCode: 'TR014',
      optionId: 'opt_ortho_self',
      tooth: 'Toàn hàm',
      visitNumber: 5,
      doctor: 'Bs.Thao',
      status: 'Chờ đến lượt',
      note: 'Tái khám tháng thứ 5, siết dây cung Niti 0.018, đóng khe thưa hàm trên',
      payments: [
        { installment: 1, amount: '10000000' },
        { installment: 5, amount: '2000000' }
      ],
      gender: 'Nam',
      birthYear: 2002,
      chair: 'Ghế 2 (Chỉnh nha)'
    },
    {
      id: '34244',
      time: '10:35',
      endTime: '11:20',
      duration: 45,
      name: 'Phạm Quỳnh Anh',
      phone: '0977 114 990',
      date: '18/05/2024',
      groupCode: 'GR003',
      serviceCode: 'TR006',
      optionId: 'opt_piezo_hard',
      tooth: '38, 48',
      visitNumber: 1,
      doctor: 'Bs.Dinh',
      status: 'Đã đặt',
      note: 'Răng khôn 38 mọc ngang 90 độ tỳ vào chân 37, hẹn Piezotome',
      payments: [{ installment: 1, amount: '3000000' }],
      gender: 'Nữ',
      birthYear: 1996,
      chair: 'Phòng Phẫu thuật'
    },
    {
      id: '34245',
      time: '14:00',
      endTime: '15:00',
      duration: 60,
      name: 'Vũ Đức Thành',
      phone: '0918 556 771',
      date: '18/05/2024',
      groupCode: 'GR006',
      serviceCode: 'TR012',
      optionId: 'opt_imp_swiss',
      tooth: '46',
      visitNumber: 1,
      doctor: 'Bs.Minh',
      status: 'Đã đặt',
      note: 'Phẫu thuật cắm trụ Straumann SLActive vị trí mất răng 46',
      payments: [{ installment: 1, amount: '12000000' }],
      gender: 'Nam',
      birthYear: 1975,
      chair: 'Phòng Phẫu thuật'
    },
    {
      id: '34246',
      time: '15:05',
      endTime: '15:35',
      duration: 30,
      name: 'Đặng Bảo Ngọc',
      phone: '0934 667 890',
      date: '18/05/2024',
      groupCode: 'GR002',
      serviceCode: 'TR004',
      optionId: '',
      tooth: 'Toàn hàm',
      visitNumber: 1,
      doctor: 'Bs.Lan',
      status: 'Đã đặt',
      note: 'Cạo vôi định kỳ 6 tháng + đánh bóng fluor men răng',
      payments: [{ installment: 1, amount: '250000' }],
      gender: 'Nữ',
      birthYear: 1999,
      chair: 'Ghế 1 (Tổng quát)'
    },
    {
      id: '34247',
      time: '15:40',
      endTime: '16:30',
      duration: 50,
      name: 'Ngô Trọng Hiếu',
      phone: '0909 123 456',
      date: '18/05/2024',
      groupCode: 'GR004',
      serviceCode: 'TR009',
      optionId: '',
      tooth: '47',
      visitNumber: 2,
      doctor: 'Bs.Tuan',
      status: 'Đã đặt',
      note: 'Răng 47 đã hết nhức, chuẩn bị sửa soạn tạo hình ống tủy xoay máy',
      payments: [
        { installment: 1, amount: '1000000' },
        { installment: 2, amount: '700000' }
      ],
      gender: 'Nam',
      birthYear: 1982,
      chair: 'Ghế 1 (Tổng quát)'
    }
  ]
};

// Also copy data for today if needed
const todayKey = formatDateToKey(new Date());
if (!initialSheets[todayKey] && todayKey !== '2024-05-18') {
  initialSheets[todayKey] = initialSheets['2024-05-18'].map((item, idx) => ({
    ...item,
    id: String(35100 + idx),
    date: formatDateDisplay(new Date())
  }));
}
