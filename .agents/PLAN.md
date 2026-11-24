# PLAN – Thiết lập tệp vai trò A1–A5 và hàng rào quyền cho agent

- Người lập: A1 – Claude/claude-opus-5-5
- Nhánh: `feat/agent-roles` (worktree Orca `feat-agent-roles`, tạo từ `main` @ 144a1b7)
- Phương án điều phối: **Phương án 3** – A1 (Claude) lập kế hoạch; A3 (Codex) nhận kế hoạch và thực thi, tự gọi worker nếu cần; A5 (Claude Code) rà soát cuối.
- Phân loại: việc nhỏ, chỉ tài liệu/cấu hình → bỏ qua A2; không có giao diện → bỏ qua A4.

## 1. Mục tiêu
Để mỗi phiên agent chỉ cần gõ: "Đọc .agents/roles/A3.md và AGENTS.md rồi làm việc sau: …", và để ngăn agent tự gộp PR, push lên `main` hoặc triển khai – các lỗi đã xảy ra ở lần chạy thử (PR #4 được gộp trước khi rà soát; mã do Claude viết ngoài worktree).

## 2. Tệp bị ảnh hưởng (danh sách ĐÓNG – A3 chỉ được tạo/sửa các tệp này)
| Tệp | Thao tác |
|---|---|
| `.agents/roles/A1.md` … `.agents/roles/A5.md` (5 tệp) | Tạo mới |
| `.claude/settings.json` | Tạo mới |
| `AGENTS.md` | Sửa có mục tiêu: chỉ thêm mục mới, không sửa mục cũ |
| `.agents/PLAN.md` | Chỉ ghi thêm câu hỏi vào cuối nếu có (bước 5) |

KHÔNG ĐỔI: mọi tệp `.gs`, `.html`, `appsscript.json`, `.claspignore`, `CLAUDE.md`, `docs/`.

## 3. Các bước (tất cả giao A3 – Codex)

### Bước 1. Tạo 5 tệp vai trò trong `.agents/roles/`
Nguồn nội dung: mục 7.2 tài liệu "Đội Agent AI trên Orca" (đã chép nguyên ý ở dưới). Mỗi tệp gồm 4 phần theo đúng thứ tự:
1. Tiêu đề `# A<n> – <Tên vai> (<Công cụ>)`.
2. **Nhiệm vụ** – theo nội dung vai tương ứng bên dưới.
3. **Đầu ra bàn giao** – tệp/commit cần tạo.
4. **Quy tắc chung bắt buộc** – chép NGUYÊN khối "Quy tắc chung" ở cuối bước này vào cả 5 tệp.

Nội dung từng vai:
- **A1 – Kiến trúc sư (Claude Code).** Đọc AGENTS.md và yêu cầu. KHÔNG viết mã. Tạo `.agents/PLAN.md` gồm: mục tiêu; tệp/hàm bị ảnh hưởng (danh sách đóng); các bước đánh số, ghi rõ bước giao A3 (Codex) hay A4 (Antigravity); tiêu chí nghiệm thu kiểm tra được; rủi ro. Nếu có hơn một giải pháp, lập bảng ưu nhược điểm. Việc nhỏ (sửa chữ, đổi màu, lỗi rõ nguyên nhân) ghi rõ "bỏ qua A1/A2, giao thẳng A3".
- **A2 – Khảo sát (Antigravity CLI).** Đọc AGENTS.md và toàn bộ mã nguồn. KHÔNG sửa tệp nào ngoài `.agents/SURVEY.md`. Ghi: hàm/tệp liên quan kèm số dòng, luồng dữ liệu, chỗ dễ gây lỗi, tài liệu chính thức cần tham khảo kèm đường dẫn.
- **A3 – Lập trình viên chính (Codex CLI).** Đọc AGENTS.md, `.agents/PLAN.md`, `.agents/SURVEY.md` (nếu có). Chỉ làm các bước giao A3, chỉ sửa tệp trong danh sách đóng. Sửa có trọng tâm, chạy kiểm tra cú pháp theo mục "Kiểm tra cú pháp" của AGENTS.md, commit từng bước với thông điệp tiếng Việt. Chỗ nào kế hoạch chưa rõ: ghi câu hỏi vào cuối PLAN.md và DỪNG. Theo Phương án 3, A3 được phép tự chia nhỏ và gọi worker, nhưng mọi worker phải tuân thủ cùng danh sách đóng và quy tắc chung.
- **A4 – Giao diện (Antigravity CLI).** Đọc AGENTS.md, PLAN.md. Chỉ sửa HTML/CSS/SVG được giao. Giữ nguyên nhận diện SZL (logo, màu, loader logo xoay). Kiểm tra hiển thị 1920×1080 và màn hình điện thoại. Bàn giao: commit giao diện + mô tả ảnh chụp trước/sau.
- **A5 – Rà soát chéo.** Công cụ: Codex CLI khi rà mã của Claude/Antigravity; Claude Code khi rà mã của Codex. Bắt đầu bằng việc xác nhận mình KHÔNG phải tác giả (đối chiếu dòng `Agent:` trong các commit); nếu trùng công cụ với tác giả thì DỪNG và báo. Đối chiếu diff (`git diff main...HEAD`) với tiêu chí nghiệm thu trong PLAN.md. Kiểm tra: lỗi logic, phân quyền, lộ khóa/bí mật, phá vỡ tính năng cũ, tệp ngoài danh sách đóng. Ghi đè `.agents/REVIEW.md`, mở đầu đúng 2 dòng:
  ```
  PHÁN QUYẾT: ĐẠT   (hoặc: PHÁN QUYẾT: CẦN SỬA)
  Người viết: <công cụ>/<mô hình> | Người rà soát: <công cụ>/<mô hình> | Commit: <mã commit đầu>..<mã commit cuối>
  ```
  sau đó liệt kê lỗi theo mức Cao / Trung bình / Thấp, kèm tệp và dòng. A5 chỉ sửa REVIEW.md, không sửa mã.

Khối "Quy tắc chung" (chép nguyên vào cả 5 tệp):
```
## Quy tắc chung bắt buộc
- Đọc AGENTS.md trước khi làm. Khi AGENTS.md và tệp này khác nhau, làm theo quy tắc chặt hơn.
- Chỉ làm việc trong worktree Orca của yêu cầu hiện tại; không sửa thư mục chính C:\SZL-Apps\SonadeziLongThanh.
- KHÔNG gộp Pull Request, KHÔNG push lên main, KHÔNG git merge/rebase vào main, KHÔNG push --force.
- KHÔNG chạy clasp push, clasp deploy/create-deployment, clasp redeploy/update-deployment, clasp undeploy, clasp version, clasp run, clasp login; KHÔNG chạy xoaCache(). Chỉ được chạy clasp status, clasp deployments.
- Không push nhánh, không tạo Pull Request nếu anh Hiếu chưa yêu cầu. Gộp nhánh và triển khai do anh Hiếu thực hiện sau khi tự thử nghiệm.
- Mỗi commit có dòng cuối: "Agent: <công cụ>/<mô hình>" (ví dụ "Agent: Codex/GPT-6.2-Sol"). Không thêm dòng Co-Authored-By.
- Không ghi khóa API, mật khẩu, token, mã salt, Script ID vào bất kỳ tệp nào.
- Báo cáo cuối phiên bằng tiếng Việt, văn phong hành chính: đã làm gì, tệp nào, còn gì chưa làm.
```

### Bước 2. Tạo `.claude/settings.json`
JSON hợp lệ, chỉ có khóa `permissions.deny`, chặn các lệnh Bash sau (định dạng `"Bash(<lệnh>:*)"`, giống cách viết trong repo Sonadezi):
`git push origin main`, `git push -f`, `git push --force`, `git merge`, `git rebase`, `git reset --hard`, `gh pr merge`, `clasp push`, `clasp deploy`, `clasp create-deployment`, `clasp redeploy`, `clasp update-deployment`, `clasp undeploy`, `clasp version`, `clasp run`, `clasp login`, `rm -rf`.
Không thêm khóa `allow`.

### Bước 3. Bổ sung `AGENTS.md`
Thêm một mục mới `## Vai trò agent và phương án điều phối` đặt ngay SAU mục `## Quy trình phối hợp`, nội dung:
- Bảng 5 dòng: Mã vai | Công cụ | Tệp vai trò (`.agents/roles/A1.md` … `A5.md`).
- Câu: "Phương án điều phối đang áp dụng: Phương án 3 – Claude (A1) lập kế hoạch, Codex (A3) thực thi, Claude Code (A5) rà soát cuối khi mã do Codex viết."
- Câu: "Mở phiên agent bằng: Đọc .agents/roles/A<n>.md và AGENTS.md rồi làm việc sau: …"
- Câu: "Agent không gộp Pull Request; mỗi commit ghi dòng `Agent: <công cụ>/<mô hình>`; REVIEW.md mở đầu bằng dòng PHÁN QUYẾT và dòng Người viết | Người rà soát | Commit."
Không sửa câu chữ của các mục hiện có.

### Bước 4. Tự kiểm tra trước khi bàn giao
- `git status --short` chỉ còn sạch; `git diff --stat main...HEAD` chỉ gồm các tệp ở mục 2.
- `node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8'))"` chạy không lỗi.
- Xác nhận `.claspignore` hiện có đã chặn `.agents/**` và `.claude/**` (chỉ đọc, không sửa).

### Bước 5. Bàn giao
Commit theo từng bước (3 commit cho bước 1–3), mỗi commit có dòng `Agent: Codex/<mô hình>`. Không push. Báo cáo cuối phiên theo quy tắc chung.

## 4. Tiêu chí nghiệm thu (A5 đối chiếu)
1. Có đủ 5 tệp `.agents/roles/A1.md` … `A5.md`, mỗi tệp có 4 phần và khối "Quy tắc chung" giống hệt nhau.
2. A5.md có quy tắc chọn công cụ rà soát và mẫu 2 dòng đầu REVIEW.md.
3. `.claude/settings.json` là JSON hợp lệ, có đủ 17 mục deny ở bước 2, không có `allow`.
4. `AGENTS.md` chỉ có thêm mục mới, các mục cũ không đổi một ký tự.
5. Diff chỉ gồm các tệp ở mục 2; không tệp `.gs/.html/appsscript.json/.claspignore` nào thay đổi.
6. Mọi commit của A3 có dòng `Agent:`, không có Co-Authored-By; nhánh chưa được push.

## 5. Rủi ro
- `.claude/settings.json` chỉ ràng buộc Claude Code; Codex và Antigravity vẫn dựa vào AGENTS.md và tệp vai trò. Hàng rào cứng cho mọi công cụ là Branch protection trên GitHub (anh Hiếu tự bật, ngoài phạm vi kế hoạch này).
- Lệnh deny theo tiền tố: `git push origin main` không chặn được dạng `git push origin HEAD:main`. Chấp nhận ở mức hiện tại; A5 ghi nhận nếu thấy cần bổ sung.

## 6. Câu hỏi còn bỏ ngỏ
(A3 ghi vào đây nếu có; nếu trống thì thực hiện.)
