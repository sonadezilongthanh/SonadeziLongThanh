# Quy tắc chung cho mọi agent – Bản đồ KCN (Sonadezi Long Thành)

## Bối cảnh
- Ứng dụng Google Apps Script + Google Sheets + Drive. File .gs là bản chuẩn; file .js là bản sao cũ, KHÔNG sửa.
- Báo cáo, tóm tắt cuối cùng viết bằng tiếng Việt, văn phong hành chính.

## Quy tắc mã nguồn
- Đọc/ghi cột theo TÊN TIÊU ĐỀ, không theo vị trí. Chỉ cột A (MaDonVi) là cố định.
- Xác thực người dùng qua layNguoiDungTuPhien_(), giaiTokenTK_(), layPhienTuToken_(). Không tự viết cơ chế khác.
- Vai trò QuanLy chỉ được xem, không được sửa dữ liệu.
- Sửa có mục tiêu, không viết lại toàn bộ file. Không đưa khóa/bí mật vào mã nguồn.
- Kiểm tra cú pháp bằng: node --check <tệp>.

## Triển khai
- Agent KHÔNG tự triển khai. Người dùng kiểm tra tại /dev rồi mới triển khai.
- Khi triển khai: cập nhật phiên bản của deployment hiện có, tuyệt đối không tạo deployment mới; sau đó chạy xoaCache().

## Quy trình phối hợp
- Nhánh làm việc: feat/<ten> hoặc fix/<ten>.
- Tệp điều phối trong .agents/: PLAN.md (kế hoạch), SURVEY.md (khảo sát mã), REVIEW.md (rà soát chéo). Người rà soát phải dùng mô hình khác với người viết mã.
