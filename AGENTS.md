# Quy tắc chung cho mọi agent – Bản đồ KCN (Sonadezi Long Thành)

## Bối cảnh
- Ứng dụng Google Apps Script + Google Sheets + Drive. File .gs là bản chuẩn; file .js là bản sao cũ, KHÔNG sửa.
- Báo cáo, tóm tắt cuối cùng viết bằng tiếng Việt, văn phong hành chính.

## Quy tắc mã nguồn
- Đọc/ghi cột theo TÊN TIÊU ĐỀ, không theo vị trí. Chỉ cột A (MaDonVi) là cố định.
- Xác thực người dùng qua layNguoiDungTuPhien_(), giaiTokenTK_(), layPhienTuToken_(). Không tự viết cơ chế khác.
- Vai trò QuanLy chỉ được xem, không được sửa dữ liệu.
- Sửa có mục tiêu, không viết lại toàn bộ file. Không đưa khóa/bí mật vào mã nguồn.
- Kiểm tra cú pháp bằng: node --check < <tệp>.

## Triển khai
- Agent KHÔNG tự triển khai. Người dùng kiểm tra tại /dev rồi mới triển khai.
- Khi triển khai: cập nhật phiên bản của deployment hiện có, tuyệt đối không tạo deployment mới; sau đó chạy xoaCache().

## Quy trình phối hợp
- Nhánh làm việc: feat/<ten> hoặc fix/<ten>.
- Tệp điều phối trong .agents/: PLAN.md (kế hoạch), SURVEY.md (khảo sát mã), REVIEW.md (rà soát chéo). Người rà soát phải dùng mô hình khác với người viết mã.

## Lệnh thường dùng

### Kiểm tra cú pháp
- Một tệp: `node --check < TenTep.gs`
  (Node 24 báo lỗi `ERR_UNKNOWN_FILE_EXTENSION` khi truyền trực tiếp tên tệp .gs, vì vậy phải chuyển nội dung tệp qua stdin bằng dấu `<`.)
- Toàn bộ tệp .gs (Git Bash): `for f in *.gs; do node --check < "$f" && echo "OK $f"; done`
- Xem danh sách tệp sẽ được đẩy lên: `clasp status`

### Quy trình triển khai (người dùng thực hiện, agent chỉ chuẩn bị)
Các lệnh `clasp push`, `clasp redeploy` và `xoaCache()` CHỈ do người dùng chạy. Agent KHÔNG tự chạy các lệnh này.

1. Kiểm tra cú pháp toàn bộ tệp .gs như trên.
2. Đẩy mã lên dự án Apps Script: `clasp push` (cần tệp `.clasp.json` trên máy; tệp này không đưa vào git).
3. Kiểm tra trên đường dẫn /dev của Web App.
4. Lấy ID deployment hiện có: `clasp deployments`
5. Cập nhật phiên bản cho deployment đó: `clasp redeploy <deploymentId> -d "V5.x: mô tả"`.
   KHÔNG dùng `clasp deploy`, vì lệnh này tạo deployment mới.
6. Chạy `xoaCache()` (trong Mã.gs) từ GAS Editor.
