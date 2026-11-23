# Quy tắc chung cho mọi agent – Bản đồ KCN (Sonadezi Long Thành)

## Bối cảnh
- Ứng dụng Google Apps Script + Google Sheets + Drive. File .gs là bản chuẩn; file .js là bản sao cũ, KHÔNG sửa.
- Báo cáo, tóm tắt cuối cùng viết bằng tiếng Việt, văn phong hành chính.

## Quy tắc mã nguồn
- Đọc/ghi cột theo TÊN TIÊU ĐỀ, không theo vị trí. Chỉ cột A (MaDonVi) là cố định.
- Xác thực người dùng qua layNguoiDungTuPhien_(), giaiTokenTK_(), layPhienTuToken_(). Không tự viết cơ chế khác.
- Vai trò QuanLy chỉ được xem, không được sửa dữ liệu.
- Sửa có mục tiêu, không viết lại toàn bộ file. Không đưa khóa/bí mật vào mã nguồn.
- Kiểm tra cú pháp bằng: node --check < <tệp> (Git Bash/CMD) hoặc lệnh PowerShell ở mục "Kiểm tra cú pháp".

## Triển khai
- Agent KHÔNG tự triển khai. Người dùng kiểm tra tại /dev rồi mới triển khai.
- Khi triển khai: cập nhật phiên bản của deployment hiện có, tuyệt đối không tạo deployment mới; sau đó chạy xoaCache().

## Quy trình phối hợp
- Nhánh làm việc: feat/<ten> hoặc fix/<ten>.
- Tệp điều phối trong .agents/: PLAN.md (kế hoạch), SURVEY.md (khảo sát mã), REVIEW.md (rà soát chéo). Người rà soát phải dùng mô hình khác với người viết mã.

## Lệnh thường dùng

### Kiểm tra cú pháp
- Cú pháp `< <tệp>` chỉ dùng cho Git Bash/CMD. PowerShell không hỗ trợ dấu `<` và báo lỗi `RedirectionNotSupported`.
- Git Bash/CMD, một tệp: `node --check < TenTep.gs`
  (Node 24 báo lỗi `ERR_UNKNOWN_FILE_EXTENSION` khi truyền trực tiếp tên tệp .gs, vì vậy phải chuyển nội dung tệp qua stdin bằng dấu `<`.)
- Git Bash, toàn bộ tệp .gs: `for f in *.gs; do node --check < "$f" && echo "OK $f"; done`
- PowerShell, một tệp: `Get-Content -Raw -Encoding UTF8 <tệp>.gs | node --check`

### Quy trình triển khai (người dùng thực hiện, agent chỉ chuẩn bị)
Quy trình triển khai chính thức dùng clasp, không dán tay mã vào GAS Editor. Danh sách tệp được đẩy lên do `.claspignore` quy định (danh sách cho phép: chỉ `appsscript.json`, `*.gs`, `*.html` ở thư mục gốc).

Agent KHÔNG chạy bất kỳ lệnh clasp nào làm thay đổi môi trường từ xa (ví dụ `clasp push`, `clasp redeploy`/`clasp update-deployment`, `clasp deploy`/`clasp create-deployment`, `clasp undeploy`, `clasp version`, `clasp run`) và KHÔNG chạy `xoaCache()`. Agent chỉ được chạy lệnh clasp chỉ đọc: `clasp status`, `clasp deployments`.

1. Kiểm tra cú pháp toàn bộ tệp .gs như trên.
2. Xem danh sách tệp sẽ được đẩy lên: `clasp status` (cần tệp `.clasp.json` trên máy; tệp này không đưa vào git).
3. Người dùng tự đẩy mã lên dự án Apps Script: `clasp push`
4. Kiểm tra trên đường dẫn /dev của Web App.
5. Lấy ID deployment hiện có: `clasp deployments`
6. Người dùng tự cập nhật phiên bản cho deployment đó: `clasp redeploy <deploymentId> -d "V5.x: mô tả"`.
   `<deploymentId>` phải là ID của bản sản xuất (có số phiên bản `@<số>`), KHÔNG dùng ID của `@HEAD`.
   KHÔNG dùng `clasp deploy`, vì lệnh này tạo deployment mới.
7. Xoá cache: mở Google Sheets, chọn menu `⚙ Hệ thống KCN` → `🔄 Làm mới dữ liệu App` (gọi `xoaCache()`).
   Không chạy `xoaCache()` từ GAS Editor: cuối hàm gọi `SpreadsheetApp.getUi().alert(...)`, nên Editor báo lỗi `Cannot call SpreadsheetApp.getUi() from this context.`
