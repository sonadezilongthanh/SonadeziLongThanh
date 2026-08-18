# CLAUDE.md — APP_KCN_LONGTHANH (Sonadezi Long Thành, Bộ phận KD-TH)

File này được Claude Code tự động đọc ở đầu mỗi phiên làm việc trong thư mục dự án.
Đặt file này tại thư mục gốc sau khi clone repo.

## Quy tắc bắt buộc khi sửa code

- **CHỈ thao tác trên file `.gs`.** File `.js` trong repo là bản mirror cũ, tên hàm và
  kiến trúc có thể sai lệch — KHÔNG bao giờ sửa hoặc tham chiếu theo `.js`.
- **Đọc/ghi dữ liệu Sheet theo TÊN CỘT (header)**, không theo vị trí cố định. Hàm
  `capNhatNhaXuong()` đã resolve cột theo tên — thêm trường mới chỉ cần thêm đúng cột
  trong Sheet + nối dây phía client, không cần sửa logic đọc.
- Trước khi `setValue()` vào cột ngày tháng, luôn gọi `setNumberFormat('@')` trước, để
  tránh Google Sheets tự đổi định dạng dd/MM theo locale máy chủ.
- `Session.getActiveUser().getEmail()` trả về rỗng với Web App chạy ẩn danh — không
  dùng hàm này để xác thực người dùng; hệ thống dùng token xác thực riêng (SHA-256+salt).
- GAS chạy trong iframe sandbox: không có Service Worker/PWA thật, thẻ
  `apple-touch-icon` không tới được iOS — không đề xuất giải pháp dựa trên các cơ chế này.
- Safari/iOS ITP phân vùng `localStorage` trong iframe cross-site — ưu tiên giải pháp
  phía server (vd. dropdown chọn tên cán bộ) thay vì lưu trạng thái ở client.
- Ảnh lưu trên Drive dùng URL dạng: `https://drive.google.com/thumbnail?id=FILE_ID&sz=w[SIZE]`
- `File.getSize()` trả về 0 với file Google Sheets gốc — dùng Drive REST v3 API,
  trường `quotaBytesUsed`, nếu cần lấy dung lượng thật.

## Cấu trúc dữ liệu

- Sheet chính: `DATA_KCN_LONGTHANH`
  (ID: `1hL3_avZm09wgM3MXrJ4CEjRRHhi-6Q9w_iBHsGVxGwE`)
- Các tab: `DS_NhaXuong`, `DS_Cum`, `DS_TaiLieu`, `DM_PhanQuyen`, `DM_CauHinh`, `NhatKy`
- 5 vai trò: `QuanTri`, `QuanLy`, `NhapLieu`, `ChiXem`, `Khach`
- Cache: key `DU_LIEU_TONG_HOP`, TTL 300s
- SVG ViewBox: MASTER `0 0 2400 2505` | GD1_2 `0 0 2400 1711` | GD3 `0 0 1983 1937` |
  GD4 `0 0 2400 1903` | GD5 `0 0 2400 2793` | GD6/GD7 `0 0 2400 1697`

## Quy ước khi trả lời / chỉnh sửa

- Trả lời và giải thích bằng tiếng Việt.
- Khi sửa code: đưa **targeted edit** (không viết lại toàn bộ file trừ khi được yêu cầu),
  nhưng **luôn xuất đầy đủ nội dung file liên quan** để tiện copy-paste vào GAS Editor.
- Giải thích ngắn gọn phần đã sửa, không diễn giải dài dòng.
- Trước khi sửa, luôn đọc trực tiếp file nguồn thật trong repo vừa clone — không giả định
  tên hàm/vị trí file từ trí nhớ.
