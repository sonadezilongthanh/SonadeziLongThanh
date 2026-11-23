# REVIEW — Rà soát mục "Lệnh thường dùng" trong `AGENTS.md`

- **Đối tượng rà soát:** Thay đổi tại `AGENTS.md` (dòng 12 và mục `## Lệnh thường dùng`, dòng 22–39; commit `75a6317` trên nhánh `chore/agents-setup`, đối chiếu với `main`).
- **Môi trường kiểm chứng thực tế:** `@google/clasp` `3.4.1`, Node.js `v24.14.1`, Windows PowerShell và mã nguồn thực tế trong kho (`Mã.gs`, `CLAUDE.md`, `.gitignore`, thư mục `docs/`).
- **Kết luận tổng quan:** Các lệnh về cơ bản đúng với `clasp 3.4.1` và không mâu thuẫn trực tiếp với mục `## Triển khai` trong `AGENTS.md`. Tuy nhiên, phát hiện **3 vấn đề mức Cao** có thể gây lỗi hoặc rủi ro vận hành thực tế (nguy cơ đẩy nhầm thư mục `docs/` khi chưa có `.claspignore`; chạy `xoaCache()` từ GAS Editor sẽ văng lỗi `SpreadsheetApp.getUi()`; lệnh `node --check <` bị lỗi cú pháp trên PowerShell) cùng một số điểm diễn đạt cần làm chặt hơn.

---

## 1. Kiểm tra tính chính xác của các lệnh với `clasp 3.x` (đối chiếu `clasp 3.4.1`)

| Lệnh trong `AGENTS.md` | Trạng thái trên `clasp 3.4.1` | Nhận xét kỹ thuật |
|---|---|---|
| `clasp status` | Hợp lệ (alias của `clasp show-file-status`) | Yêu cầu bắt buộc phải có tệp `.clasp.json` (`assertScriptConfigured`); sẽ báo lỗi nếu chạy ở thư mục/worktree chưa có `.clasp.json`. |
| `clasp push` | Hợp lệ | Ghi đè toàn bộ nội dung dự án Apps Script từ xa. Nếu `appsscript.json` thay đổi, lệnh sẽ hỏi xác nhận tương tác (trừ khi dùng `-f`). Xem cảnh báo về `.claspignore` và thư mục `docs/` bên dưới. |
| `clasp deployments` | Hợp lệ (alias của `clasp list-deployments`) | Liệt kê tất cả deployment, bao gồm cả `@HEAD` (bản `/dev`) và bản sản xuất (`@<số phiên bản>`). |
| `clasp redeploy <deploymentId> -d "V5.x: mô tả"` | Hợp lệ (alias của `clasp update-deployment [options] <deploymentId>`) | Khi không truyền `-V`, `clasp` tự tạo version mới từ mã hiện tại rồi gọi `deployments.update` để cập nhật đúng `<deploymentId>`, giữ nguyên URL Web App. |
| Cảnh báo *"KHÔNG dùng `clasp deploy`, vì lệnh này tạo deployment mới"* | Đúng về mục tiêu phòng ngừa rủi ro, chưa chính xác tuyệt đối về kỹ thuật | Trong `clasp 3.4.1`, `clasp deploy` (alias của `create-deployment`) vẫn hỗ trợ cờ `-i / --deploymentId <id>` để cập nhật deployment cũ; chỉ khi **không có `-i`** mới tạo deployment mới. Khuyến nghị dùng `clasp redeploy <deploymentId>` (hoặc `clasp update-deployment <deploymentId>`) là **rất nên giữ**, vì `<deploymentId>` là đối số bắt buộc nên loại trừ nguy cơ quên cờ `-i`. Tuy nhiên, nên sửa câu giải thích cho chính xác hơn (ví dụ: *"KHÔNG dùng `clasp deploy` (thiếu `-i` sẽ tạo deployment mới); luôn dùng `clasp redeploy <deploymentId>` — alias của `clasp update-deployment`."*). |

### Cảnh báo mức Cao liên quan đến `clasp push` trên kho lưu trữ hiện tại
- Kho lưu trữ hiện **không có tệp `.claspignore`**, nhưng lại chứa thư mục `docs/` (gồm `docs/index.html`, `docs/sw.js`, `docs/manifest.json`, biểu tượng PWA cho GitHub Pages).
- Theo mã nguồn `clasp 3.4.1` (`core/clasp.js`):
  - `skipSubdirectories` mặc định là `false` (quét đệ quy mọi thư mục con).
  - Quy tắc bỏ qua mặc định (`DEFAULT_CLASP_IGNORE`) chấp nhận tất cả `**/*.gs`, `**/*.js`, `**/*.ts`, `**/*.html` và `**/appsscript.json`.
- **Hệ quả:** Nếu `.clasp.json` cục bộ không đặt `"skipSubdirectories": true` và kho chưa có `.claspignore` loại trừ `docs/**`, lệnh `clasp push` sẽ **đẩy nhầm `docs/index.html` và `docs/sw.js`** lên dự án Apps Script (hoặc gây lỗi `FILE_CONFLICT` nếu có tệp `.js` trùng tên gốc với tệp `.gs`).

---

## 2. Kiểm tra mâu thuẫn với các quy tắc khác trong `AGENTS.md`

### 2.1. Đối chiếu nội bộ `AGENTS.md`
- **Không có mâu thuẫn trực tiếp** giữa mục `## Triển khai` (dòng 14–16) và mục `### Quy trình triển khai` (dòng 30–39). Mục mới cụ thể hóa quy tắc "Agent KHÔNG tự triển khai" bằng việc chỉ rõ ngay cả `clasp push` cũng do người dùng thực hiện.
- Tuy nhiên, có **2 điểm chưa kín kẽ** cần làm rõ để tránh agent hiểu sai giới hạn quyền:
  1. **Danh sách lệnh cấm ở dòng 31 mới chỉ liệt kê theo tên hẹp:** Dòng 31 chỉ nêu `clasp push`, `clasp redeploy` và `xoaCache()`, chưa bao quát các lệnh/tên chính thức khác làm thay đổi môi trường từ xa hoặc ghi đè mã như `clasp update-deployment`, `clasp deploy`, `clasp create-deployment`, `clasp undeploy` / `clasp delete-deployment`, `clasp version` / `clasp create-version`, `clasp run` / `clasp run-function`, `clasp pull`. Nên viết khái quát: *Agent KHÔNG chạy bất kỳ lệnh `clasp` nào làm thay đổi mã/phiên bản/deployment trên Apps Script hoặc ghi đè tệp từ xa, và KHÔNG chạy `xoaCache()`.*
  2. **Chưa phân định rõ quyền chạy các bước/lệnh chỉ đọc:**
     - `clasp status` (dòng 28) đặt dưới mục `### Kiểm tra cú pháp`, còn `clasp deployments` (dòng 36) nằm trong mục `### Quy trình triển khai` nhưng không thuộc danh sách cấm ở dòng 31. Nên nói rõ các lệnh chỉ đọc có cần `.clasp.json` / xác thực tài khoản Google và do ai thực hiện.
     - Bước 1 (*"Kiểm tra cú pháp toàn bộ tệp .gs như trên"*) nằm trong phần *"người dùng thực hiện"*, nhưng thực tế agent cần tự chạy bước này trước khi bàn giao. Nên tách rõ: bước kiểm tra cú pháp do agent chạy trước (người dùng có thể chạy lại để xác nhận), các bước từ `clasp push` trở đi chỉ do người dùng thực hiện.

### 2.2. Ghi chú liên hệ với `CLAUDE.md` (cùng thay đổi trong diff so với `main`)
- Trong cùng nhánh hiện tại, `CLAUDE.md` đã thêm `@AGENTS.md` ở dòng 1, nhưng tại dòng 40–41 vẫn giữ quy ước: *"luôn xuất đầy đủ nội dung file liên quan để tiện copy-paste vào GAS Editor"*.
- Quy ước copy-paste thủ công này **lệch pha** với quy trình đẩy mã qua `clasp push` mới bổ sung trong `AGENTS.md` (không phải mâu thuẫn nội bộ `AGENTS.md`, nhưng cần lưu ý rà soát đồng bộ `CLAUDE.md` sau này).

### 2.3. Ghi chú phụ (ngoài phạm vi mục "Lệnh thường dùng")
- Dòng 19 quy định nhánh làm việc là `feat/<ten>` hoặc `fix/<ten>`, trong khi nhánh hiện tại đặt tên `chore/agents-setup`. Nếu dự án có sử dụng thêm `chore/` hoặc `docs/` cho công việc cấu hình/tài liệu, có thể cân nhắc bổ sung sau để thống nhất.

---

## 3. Các điểm khác dễ gây hiểu sai hoặc phát sinh lỗi thực tế

1. **[Cao] Bước 6 hướng dẫn chạy `xoaCache()` từ GAS Editor sẽ văng lỗi `SpreadsheetApp.getUi()`**
   - Kiểm tra trực tiếp `Mã.gs` (dòng 766–771):
     ```javascript
     function xoaCache() {
       CacheService.getScriptCache().remove('DU_LIEU_TONG_HOP');
       try { CacheService.getScriptCache().remove(CACHE_TT_KCN); } catch (e) {}
       try { CacheService.getScriptCache().remove(KHOA_CACHE_ANH_BAN_DO); } catch (e) {}
       SpreadsheetApp.getUi().alert('✓ Đã làm mới. Tải lại trang App để thấy dữ liệu mới nhất.');
     }
     ```
   - Khi chạy trực tiếp từ **GAS Editor**, 3 lệnh xóa cache ở dòng 767–769 có chạy, nhưng đến dòng 770 sẽ ném ngoại lệ đỏ: `Exception: Cannot call SpreadsheetApp.getUi() from this context.` Điều này rất dễ khiến người dùng tưởng thao tác xóa cache đã thất bại.
   - Thực tế tại `Mã.gs` (dòng 921–922), `xoaCache` đã được gắn vào menu trên Google Sheets: **`⚙ Hệ thống KCN` → `🔄 Làm mới dữ liệu App`**. Nên hướng dẫn người dùng chạy từ menu này trên Google Sheets (hoặc ghi chú rõ ngoại lệ ở dòng `alert` nếu chạy từ GAS Editor; về lâu dài có thể bọc `try/catch` cho dòng `alert` trong `Mã.gs`).

2. **[Cao] Lệnh `node --check < TenTep.gs` bị lỗi cú pháp trên PowerShell (Windows)**
   - Dòng 12 và dòng 25 ghi `node --check < TenTep.gs` mà không nêu điều kiện shell (chỉ dòng 27 mới chú thích `(Git Bash)`).
   - Khi kiểm chứng thực tế trên Windows PowerShell (shell mặc định của nhiều terminal/agent), toán tử `<` báo lỗi ngay lập tức:
     `ParserError: The '<' operator is reserved for future use. (RedirectionNotSupported)`.
   - Ngoài ra, vòng lặp Git Bash ở dòng 27 (`for f in *.gs; do node --check < "$f" && echo "OK $f"; done`) không dừng khi gặp lỗi và mã thoát cuối cùng (`$?`) vẫn là `0` nếu tệp cuối cùng hợp lệ — dễ làm bỏ sót tệp lỗi ở giữa danh sách.
   - Đề xuất: ghi chú rõ cú pháp `<` chỉ áp dụng cho **Git Bash / CMD**, đồng thời bổ sung lệnh tương đương cho **PowerShell** (đã kiểm chứng chạy thành công với toàn bộ tệp `.gs`, kể cả `Mã.gs`):
     - Một tệp: `Get-Content -Raw -Encoding UTF8 "TenTep.gs" | node --check`
     - Toàn bộ tệp `.gs`:
       ```powershell
       Get-ChildItem *.gs | ForEach-Object { Get-Content -Raw -Encoding UTF8 $_.FullName | node --check; if ($LASTEXITCODE -eq 0) { "OK $($_.Name)" } else { "FAIL $($_.Name)" } }
       ```
     - (Với Git Bash, nên thêm cờ báo lỗi hoặc dừng ngay bằng `|| exit 1` để tránh mã thoát `0` giả.)

3. **[Cao] Phân loại chưa hợp lý đối với `clasp status` và thiếu bước kiểm tra danh sách tệp trước `clasp push`**
   - `clasp status` đang đặt trong `### Kiểm tra cú pháp` (dòng 28), trong khi chức năng của nó là liệt kê tệp sẽ đẩy lên Apps Script, không phải kiểm tra cú pháp; đồng thời dòng 28 không nhắc điều kiện cần `.clasp.json` (mãi tới dòng 34 mới nhắc).
   - Trong `### Quy trình triển khai`, nên đưa `clasp status` vào ngay **trước bước `clasp push`** để người dùng xác nhận danh sách tệp sẽ đẩy không chứa `docs/index.html`, `docs/sw.js` hay tệp ngoài ý muốn.

4. **[Trung bình] Dễ sao chép nhầm ID của `@HEAD` ở bước 4–5**
   - Lệnh `clasp deployments` liệt kê cả bản `@HEAD` (bản kiểm thử `/dev`) lẫn bản triển khai sản xuất (`@<số phiên bản>`). Nếu đưa nhầm ID của `@HEAD` vào `clasp redeploy` sẽ gặp lỗi. Cần ghi chú rõ chỉ lấy `<deploymentId>` của bản sản xuất (có số phiên bản `@...`), không chọn `@HEAD`.

5. **[Trung bình] Dễ hiểu nhầm phạm vi của `node --check`**
   - `node --check` chỉ kiểm tra cú pháp tệp `.gs` (mã phía máy chủ), **không kiểm tra được mã JavaScript bên trong thẻ `<script>` của các tệp `.html`** (`Script.html`, `Tab_*.html`, ...). Nên ghi chú ngắn để người thực hiện vẫn chú ý rà soát/kiểm thử kỹ phần giao diện trên `/dev`.

6. **[Thấp] Một số lưu ý vận hành nhỏ**
   - Quy trình triển khai chưa nhắc kiểm tra đúng nhánh git (`git status` / nhánh hiện tại) trước khi chạy `clasp push`, và chưa nhắc rõ `clasp push` sẽ **ghi đè ngay toàn bộ dự án trên bản `/dev`** dùng chung.
   - Tên tệp `Mã.gs` chứa ký tự tiếng Việt Unicode; trên Windows nên đặt tên tệp trong dấu ngoặc kép và dùng UTF-8 khi chạy lệnh kiểm tra riêng tệp này.

---

## 4. Tóm tắt các đề xuất chỉnh sửa theo mức ưu tiên

1. **[Ưu tiên 1 — Cao]** Chỉnh lại bước 6: hướng dẫn chạy `xoaCache()` qua menu Google Sheets (**`⚙ Hệ thống KCN` → `🔄 Làm mới dữ liệu App`**), hoặc ghi chú rõ việc gọi từ GAS Editor sẽ báo lỗi ở dòng `SpreadsheetApp.getUi().alert(...)` dù cache đã được xóa.
2. **[Ưu tiên 1 — Cao]** Bổ sung bước chạy `clasp status` ngay trước `clasp push` và thêm lưu ý kiểm tra `.claspignore` / `skipSubdirectories` để tránh đẩy nhầm `docs/index.html`, `docs/sw.js` lên Apps Script (đồng thời chuyển `clasp status` ra khỏi mục `### Kiểm tra cú pháp`).
3. **[Ưu tiên 1 — Cao]** Ghi rõ `node --check < TenTep.gs` chỉ dùng cho Git Bash / CMD, bổ sung lệnh tương đương cho PowerShell (`Get-Content -Raw -Encoding UTF8 ... | node --check`), và sửa vòng lặp kiểm tra nhiều tệp để không bỏ sót lỗi.
4. **[Ưu tiên 2 — Trung bình]** Diễn đạt chặt chẽ hơn danh sách lệnh cấm agent chạy ở dòng 31 (cấm khái quát mọi lệnh `clasp` thay đổi mã/phiên bản/deployment từ xa, làm rõ vai trò của agent ở bước 1 và với lệnh chỉ đọc).
5. **[Ưu tiên 2 — Trung bình]** Ghi rõ chọn `<deploymentId>` của bản sản xuất (không chọn `@HEAD`) tại bước 4–5; điều chỉnh lời giải thích về `clasp deploy` cho chính xác với `clasp 3.4.1` và nêu thêm tên chính thức `clasp update-deployment`.
6. **[Ưu tiên 3 — Thấp]** Ghi chú phạm vi `node --check` không phủ mã JS trong tệp `.html`, nhắc kiểm tra đúng nhánh git trước khi `clasp push`, và lưu ý đồng bộ lại dòng 40–41 của `CLAUDE.md` ở một tác vụ riêng.
