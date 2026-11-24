# PLAN – Lời nhắc điều phối tự động chuỗi A1→A5 qua Orca Orchestration

- Người lập: A1 – Claude/claude-opus-5-5
- Nhánh: `feat/dieu-phoi` (worktree Orca `feat-dieu-phoi`, tạo từ `main` @ ac209a2)
- Phương án điều phối: Phương án 3 – Claude lập kế hoạch (A1), Codex điều phối thực thi, Claude Code rà soát cuối (A5).
- Thứ tự thực hiện kế hoạch này: A2 (Antigravity) khảo sát TRƯỚC → A3 (Codex) viết → A4 không áp dụng (không có giao diện) → A5 (Claude Code) rà soát.

## 1. Mục tiêu
Tạo tệp `.agents/roles/DIEU-PHOI.md` để anh Hiếu chỉ cần mở MỘT phiên Codex trong worktree của yêu cầu và gõ:
"Đọc .agents/roles/DIEU-PHOI.md và AGENTS.md rồi điều phối việc sau: …"
Phiên Codex (gọi là Điều phối viên) dùng Orca Orchestration (skill đã cài, Settings → Orchestration: "Up to date", 3 agent) để lần lượt gọi đúng công cụ cho từng vai A1→A5, chờ kết quả, xử lý vòng "Cần sửa", và DỪNG trước bước thử nghiệm/gộp của anh Hiếu.

## 2. Tệp bị ảnh hưởng (danh sách ĐÓNG)
| Tệp | Ai sửa | Thao tác |
|---|---|---|
| `.agents/SURVEY.md` | A2 | Ghi đè |
| `.agents/roles/DIEU-PHOI.md` | A3 | Tạo mới |
| `AGENTS.md` | A3 | Chỉ thêm 2 dòng vào cuối mục `## Vai trò agent và phương án điều phối` (xem bước A3-2) |
| `.agents/PLAN.md` | A3 | Chỉ ghi mục 6 nếu có câu hỏi |
| `.agents/REVIEW.md` | A5 | Ghi đè |

KHÔNG ĐỔI: mọi tệp `.gs`, `.html`, `appsscript.json`, `.claspignore`, `CLAUDE.md`, `.claude/settings.json`, `.agents/roles/A1.md`–`A5.md`, `docs/`.

## 3. Các bước

### Bước A2 (Antigravity) – Khảo sát lệnh Orca Orchestration
Chỉ đọc và chạy lệnh CHỈ ĐỌC. Được chạy: `orca status --json`, `orca skills get orchestration --full`, `orca orchestration --help` và `--help` của các lệnh con. KHÔNG chạy lệnh tạo run/task/worker. Ghi `.agents/SURVEY.md` gồm:
1. Cú pháp chính xác (kèm ví dụ) của: `run-create`, `task-create`, `worker-start`, `check --wait`, cách `--ack`; các giá trị hợp lệ của `--agent`, `--worktree`, `--model`, `--effort`.
2. Worker có chạy được trên CÙNG worktree hiện tại (`--worktree current`) không, với từng agent claude / codex / antigravity. Tài liệu Orca ghi "Antigravity workers need a local child worktree" – làm rõ: nếu A2/A4 buộc phải chạy ở worktree con thì kết quả (SURVEY.md, commit giao diện) đưa về nhánh của yêu cầu bằng cách nào.
3. Task có khai báo phụ thuộc/thứ tự được không; worker báo xong bằng tin nhắn gì; cách điều phối viên đọc kết quả (worker_done, question, escalation).
4. Cách xử lý khi worker hỏi quyền (permission prompt) trong khi Settings "Let coordinators approve worker permission prompts" đang TẮT.
5. Rủi ro và giới hạn hạn mức (Claude Pro, Antigravity 429).
6. Mục "Ghi chú cho A3": các điểm A3 phải phản ánh vào DIEU-PHOI.md.
Commit riêng SURVEY.md, dòng cuối `Agent: Antigravity/<mô hình>`.

### Bước A3 (Codex) – Viết tệp
A3-1. Tạo `.agents/roles/DIEU-PHOI.md`, dùng đúng cú pháp lệnh đã xác minh trong SURVEY.md (không tự đoán cờ lệnh), gồm các phần:
- `# Điều phối viên – Codex CLI (Orca Orchestration)`
- **Vai trò**: điều phối, KHÔNG tự viết mã, không tự sửa PLAN/SURVEY/REVIEW; chỉ tạo run/task, khởi động worker, đọc kết quả, quyết định bước kế tiếp.
- **Bước 0 – Kiểm tra**: đang ở worktree Orca, nhánh `feat/…` hoặc `fix/…` (không phải `main`); `git status` sạch; `orca status --json` thành công. Sai → dừng, báo anh Hiếu.
- **Bước 1 – Phân loại**: việc nhỏ (sửa chữ, đổi màu, lỗi rõ nguyên nhân) → bỏ qua A1, A2; việc khác → đủ chuỗi. Có sửa HTML/CSS/SVG → có A4.
- **Bước 2 – Chuỗi tuần tự** (mỗi worker chỉ khởi động sau khi worker trước báo xong): A1 `--agent claude` → A2 `--agent antigravity` → A3 `--agent codex` → A4 `--agent antigravity` (nếu có) → A5. Lời giao việc cho mỗi worker bắt đầu bằng "Đọc .agents/roles/A<n>.md và AGENTS.md rồi làm việc sau: …" kèm nguyên văn yêu cầu của anh Hiếu.
- **Quy tắc chọn A5**: đọc dòng `Agent:` trong các commit của A3/A4; mã do Codex viết → A5 `--agent claude`; mã do Claude/Antigravity viết → A5 `--agent codex`. Không bao giờ để cùng công cụ với tác giả.
- **Cổng dừng**: (a) PLAN.md mục 6 có câu hỏi → dừng, chuyển câu hỏi cho anh Hiếu; (b) PLAN.md đánh dấu thay đổi phân quyền/xác thực/triển khai → dừng xin ý kiến trước A3; (c) worker báo lỗi, hết hạn mức (429) hoặc treo quá thời gian chờ → dừng, báo.
- **Vòng sửa**: REVIEW.md "PHÁN QUYẾT: CẦN SỬA" → giao lại A3 kèm REVIEW.md, rồi A5 rà lại; tối đa 2 vòng, quá 2 vòng → dừng, báo anh Hiếu.
- **Kết thúc**: REVIEW.md "PHÁN QUYẾT: ĐẠT" → DỪNG. Báo cáo tiếng Việt: bảng vai/công cụ/commit, phán quyết, việc anh Hiếu cần thử nghiệm. KHÔNG push, KHÔNG tạo/gộp PR, KHÔNG triển khai.
- **Cấm**: bật hoặc dùng quyền tự duyệt permission prompt của worker; tăng `Nested worker depth`; chạy worker song song trên cùng worktree.
- Khối **Quy tắc chung bắt buộc**: chép NGUYÊN khối từ `.agents/roles/A1.md` (giống hệt 5 tệp vai trò).
A3-2. Thêm vào cuối mục `## Vai trò agent và phương án điều phối` của `AGENTS.md` đúng 2 dòng:
- "Điều phối tự động: mở một phiên Codex trong worktree của yêu cầu và gõ: Đọc `.agents/roles/DIEU-PHOI.md` và AGENTS.md rồi điều phối việc sau: …"
- "Điều phối viên không viết mã và dừng trước bước thử nghiệm, gộp của anh Hiếu."
A3-3. Tự kiểm tra: `git diff --stat main...HEAD` chỉ gồm tệp ở mục 2; khối Quy tắc chung trong DIEU-PHOI.md giống từng ký tự với A1.md. Commit riêng cho A3-1 và A3-2, dòng cuối `Agent: Codex/<mô hình>`.

### Bước A4 – Không áp dụng (không có giao diện).

### Bước A5 (Claude Code) – Rà soát
Đối chiếu mục 4; xác minh mọi lệnh `orca …` trong DIEU-PHOI.md khớp SURVEY.md; ghi REVIEW.md theo mẫu trong A5.md.

## 4. Tiêu chí nghiệm thu
1. SURVEY.md có đủ 6 mục của bước A2, mọi cú pháp lệnh có nguồn (`--help`/skill) hoặc ghi "chưa xác minh".
2. DIEU-PHOI.md có đủ các phần ở A3-1; mọi lệnh `orca orchestration …` khớp SURVEY.md; không có cờ lệnh tự đoán.
3. Có quy tắc chọn A5 khác công cụ tác giả, cổng dừng (a)(b)(c), vòng sửa tối đa 2 lần, điểm dừng trước thử nghiệm/gộp.
4. Khối Quy tắc chung trong DIEU-PHOI.md giống hệt A1.md.
5. AGENTS.md chỉ thêm đúng 2 dòng; các dòng cũ không đổi.
6. Diff chỉ gồm tệp ở mục 2; mọi commit có dòng `Agent:`, không Co-Authored-By; nhánh chưa push.

## 5. Rủi ro
- Orchestration là tính năng thử nghiệm của Orca; cú pháp có thể đổi theo phiên bản → DIEU-PHOI.md phải ghi phiên bản Orca/skill đã khảo sát.
- Mỗi lần điều phối tốn hạn mức của cả 3 gói; Claude Pro thấp nhất → điều phối viên là Codex, Claude chỉ dùng cho A1 và A5.
- Nếu Antigravity bắt buộc chạy ở worktree con, việc đưa kết quả A2/A4 về nhánh chính của yêu cầu cần thêm bước; nếu SURVEY không giải quyết được, A3 ghi phương án tạm: A2/A4 do anh Hiếu mở phiên thủ công.
- Chưa chạy thử thực tế; sau khi gộp cần thử với một việc nhỏ.

## 6. Câu hỏi còn bỏ ngỏ
(A2/A3 ghi vào đây nếu có; nếu trống thì thực hiện.)
