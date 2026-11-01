# Hệ Thống Soạn Lịch Nha Khoa SmileCare - Nâng Cấp Toàn Diện & Tự Động Sao Lưu Excel

Kế hoạch chuyển đổi ứng dụng sang nền tảng quản lý nha khoa tương tác thời gian thực với backend Firebase Firestore & Google Auth, hiển thị số tiền thanh toán chi tiết theo từng đợt, tự động cập nhật và sao lưu sổ khám Excel đa trang (multi-sheet) chuyên nghiệp mỗi 10 phút, cùng giao diện phối màu Xanh Ngọc Y Tế & Xanh Cobalt đậm sắc nét.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Dưới đây là các quyết định cốt lõi đã được thống nhất sau bước khảo sát nhu cầu người dùng:

- **Cơ chế sao lưu Excel mỗi 10 phút**: Tự động tạo và cập nhật định kỳ file Excel `.xlsx` đa bảng tính (`Lịch hẹn tổng hợp`, `Lộ trình điều trị & Răng`, `Sổ thu chi & Đợt thanh toán`). Hệ thống có đồng hồ đếm ngược 10 phút trên thanh công cụ, thông báo khi sao lưu thành công, lưu vết các điểm khôi phục và cho phép tải file bất kỳ lúc nào.
- **Phong cách thẩm mỹ giao diện**: Chuyển đổi từ giao diện nhạt màu sang tông **Xanh ngọc y tế (Medical Teal: `#0D9488` / `#14B8A6`)** kết hợp **Xanh cobalt đậm (Deep Cobalt: `#1D4ED8` / `#1E40AF`)** với độ tương phản cao, thẻ chỉ dẫn nổi bật và bảng số liệu sắc nét.
- **Hiển thị cột thanh toán**: Cột "Thanh toán" hiển thị trực quan số tiền của từng đợt khám (ví dụ: `Đợt 1: 5.000.000 đ · Đợt 2: 3.000.000 đ`), thanh tỷ lệ đã thu / còn lại, và bấm vào để cập nhật nhanh tiền trả theo đợt.
- **Backend lưu trữ dữ liệu**: Tích hợp Firebase Firestore & Firebase Authentication (Google Sign-in) cho việc đồng bộ dữ liệu khám bệnh trên đám mây, kèm bộ đệm cục bộ đảm bảo ứng dụng luôn chạy mượt mà ngay cả khi ngoại tuyến.

---

## 1. Tổng Quan & Trải Nghiệm Cốt Lõi

- **Mục tiêu**: Cung cấp cho nha sĩ, trợ thủ nha khoa và lễ tân phòng khám một công cụ điều phối lịch hẹn mạnh mẽ: không chỉ xem lịch mà còn quản lý dòng tiền theo từng lần hẹn, ghi nhận tiến độ điều trị theo răng FDI, tự động lưu trữ định kỳ và phòng chống mất dữ liệu tuyệt đối.
- **Đối tượng sử dụng**: Bác sĩ nha khoa, điều dưỡng phụ tá, lễ tân và quản lý phòng khám nha khoa.
- **Giá trị cốt lõi**:
  - Tự động hóa tiến trình tái khám và đợt thanh toán.
  - Sổ theo dõi Excel chuyên nghiệp được tự động sinh và cập nhật mỗi 10 phút không cần thao tác thủ công.
  - An toàn dữ liệu với cơ chế đồng bộ Firebase Cloud Firestore.

---

## 2. Trải Nghiệm Người Dùng & Thiết Kế Giao Diện

### A. Luồng Thao Tác Trọng Tâm
1. **Theo dõi thanh toán theo đợt**:
   - Ngay trên từng hàng của bảng lịch hẹn, cột "Thanh toán" hiển thị danh sách các đợt đã đóng (badge số tiền theo đợt), tổng chi phí và số dư còn thiếu với màu sắc phân biệt rõ ràng (đã thanh toán đủ: xanh lá; còn nợ: cam/đỏ).
   - Nhấp trực tiếp vào đợt thanh toán để mở popup chỉnh sửa nhanh số tiền của buổi hẹn hiện tại hoặc thêm đợt trả góp mới.
2. **Cơ chế tự động sao lưu Excel 10 phút**:
   - Thanh công cụ hiển thị badge trạng thái sao lưu với đồng hồ đếm ngược (ví dụ: `Đã sao lưu lúc 09:10 · Tự sao lưu sau 8:45`).
   - Cung cấp nút "Sao lưu ngay" để kích hoạt tạo/cập nhật file Excel ngay lập tức.
   - Hộp thoại quản lý sao lưu (Backup Center): liệt kê các phiên bản backup, tải file về máy, hoặc xem tóm tắt doanh thu và ca khám trong file Excel.
3. **Cấu trúc File Excel chuyên nghiệp (`NhaKhoa_SmileCare_Backup.xlsx`)**:
   - **Sheet 1 - `Lich_Kham_Ngay`**: Danh sách bệnh nhân, giờ hẹn, bác sĩ, ghế điều trị, trạng thái, ghi chú.
   - **Sheet 2 - `Lo_Trinh_Dieu_Tri`**: Chi tiết dịch vụ, vị trí răng FDI (hàm trên/dưới), lần khám hiện tại / tổng số buổi, nội dung thủ thuật lâm sàng.
   - **Sheet 3 - `So_Thu_Tien_Tung_Dot`**: Bảng kê chi tiết từng đợt thu (Đợt 1, Đợt 2, Đợt 3...), hình thức thanh toán, tổng viện phí, số tiền đã thu, công nợ còn lại.

### B. Phong Cách Thẩm Mỹ (Màu Sắc & Kiểu Chữ)
- **Màu sắc chủ đạo**:
  - **Deep Cobalt Blue** (`#1E40AF`, `#1D4ED8`): Dành cho thanh điều hướng chính, nút hành động chính, tiêu đề quan trọng.
  - **Medical Teal** (`#0D9488`, `#14B8A6`): Điểm nhấn y tế cho vị trí răng đã chọn, badge số đợt khám, thanh tiến độ và thông tin bác sĩ.
  - **Vibrant Accents**: Thẻ trạng thái có nền sáng viền đậm (`#DCFCE7` / `#15803D` cho Hoàn thành; `#FEF3C7` / `#B45309` cho Đang khám; `#DBEAFE` / `#1D4ED8` cho Đã đặt).
- **Kiểu chữ**:
  - Phông hiển thị: `Plus Jakarta Sans` với trọng số 700/800 đậm nét, nổi khối.
  - Phông số liệu & tiền tệ: `JetBrains Mono` với định dạng `tabular-nums` căn lề chuẩn mực.

---

## 3. Quyết Định Kỹ Thuật & Cấu Trúc Hệ Thống

### Quyết định 1: Định Dạng Cột Thanh Toán Trực Quan
- *Cách thực hiện*: Thay vì chỉ hiển thị một con số tổng, cột thanh toán sẽ hiển thị từng badge theo định dạng: `[Đợt 1: 5.000.000đ]` `[Đợt 2: 3.000.000đ]`, kèm tổng số tiền đã đóng và số nợ còn lại.
- *Lý do*: Điều trị nha khoa (chỉnh nha, implant, răng sứ) luôn thanh toán làm nhiều đợt theo từng giai đoạn điều trị; hiển thị chi tiết giúp lễ tân và nha sĩ nắm bắt tức thì tình trạng công nợ của bệnh nhân.

### Quyết định 2: Thư Viện Sinh File Excel Chuyên Nghiệp (`xlsx`)
- *Cách thực hiện*: Tích hợp thư viện `xlsx` (SheetJS) để xuất file Excel dạng `.xlsx` với nhiều bảng tính (workbook có nhiều worksheet), tiêu đề cột rõ ràng, định dạng số tiền VND, độ rộng cột tối ưu tự động.
- *Cơ chế 10 phút*: Sử dụng `setInterval` nội tại trong trình duyệt + `localStorage` backup cache. Mỗi 10 phút, hệ thống tự động kết xuất dữ liệu hiện tại vào file Excel ảo trong bộ nhớ, cập nhật lịch sử backup và cung cấp tùy chọn tải file hoặc tự động tải về khi có thay đổi.

### Quyết định 3: Tích Hợp Firebase Backend
- *Cách thực hiện*: Thiết lập Firebase Firestore lưu trữ collection `appointments` và `daily_schedules` theo ngày, hỗ trợ đăng nhập Google để bảo vệ thông tin bệnh nhân.

---

## 4. Kiến Trúc Kỹ Thuật & Luồng Dữ Liệu

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GIAO DIỆN NHA KHOA SMILECARE                         │
├──────────────────────────────────────┬──────────────────────────────────────┤
│              AppHeader               │              AppToolbar              │
│  - Logo & Thương hiệu Cobalt/Teal    │  - Đồng hồ đếm ngược tự sao lưu 10p │
│  - Bộ chọn ngày & Tìm kiếm tức thì   │  - Nút Xuất/Nhập Excel đa trang      │
│  - Chuyển đổi Bảng / Ghế nha khoa    │  - Lọc trạng thái / Bác sĩ / Cột     │
├──────────────────────────────────────┴──────────────────────────────────────┤
│                             MAIN WORKSPACE                                  │
│  ┌──────────────────────────────────────────────┬────────────────────────┐  │
│  │     AppointmentTable / ChairTimeline         │      DetailPanel       │  │
│  │  - STT | Giờ | Bệnh nhân | SĐT               │  - Hồ sơ bệnh nhân     │  │
│  │  - Nhóm điều trị | Dịch vụ                   │  - Sơ đồ răng mini     │  │
│  │  - Vị trí răng FDI (Mở ToothModal)           │  - Tiến độ buổi khám   │  │
│  │  - Lần khám [- X/Y +]                        │  - Sổ thu tiền các đợt │  │
│  │  - Cột Thanh Toán: [Đợt 1: X] [Đợt 2: Y]...   │  - Ghi chú lâm sàng    │  │
│  │  - Bác sĩ | Trạng thái | Ghi chú             │  - In phiếu hẹn        │  │
│  └──────────────────────────────────────────────┴────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│                     SERVICES & PERSISTENCE LAYER                            │
│  ┌───────────────────────┬──────────────────────┬────────────────────────┐  │
│  │   Excel Backup Engine │  Firebase Firestore  │  Local Cache Backup    │  │
│  │   - Auto-backup 10m   │  - Google Auth       │  - Offline Fallback    │  │
│  │   - Multi-sheet .xlsx │  - Realtime Sync     │  - Instant Restore     │  │
│  └───────────────────────┴──────────────────────┴────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Các Giai Đoạn Triển Khai:
1. **Giai đoạn 1**: Cấu hình Firebase (`show_aistudio_ui` / `set_up_firebase`) và tích hợp thư viện `xlsx` để xử lý file Excel.
2. **Giai đoạn 2**: Nâng cấp giao diện với bảng màu Xanh ngọc y tế (`teal-600/teal-500`) và Xanh cobalt đậm (`blue-800/indigo-900`), bổ sung độ tương phản và chiều sâu cho từng thành phần.
3. **Giai đoạn 3**: Tái cấu trúc cột Thanh toán trong `AppointmentTable` và `DetailPanel` để hiển thị rõ ràng số tiền theo từng đợt khám.
4. **Giai đoạn 4**: Xây dựng mô-đun Tự động sao lưu Excel mỗi 10 phút (`useAutoBackup` & `ExcelManager`), tự động tạo file và quản lý phiên bản sao lưu.
5. **Giai đoạn 5**: Kết nối đồng bộ Firestore, kiểm thử biên dịch và xác minh toàn bộ luồng hoạt động.
