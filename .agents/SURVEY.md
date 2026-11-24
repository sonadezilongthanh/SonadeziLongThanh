# SURVEY – Khảo sát ảnh hưởng nhánh `feat/agent-roles`

- Vai thực hiện: A2 – Khảo sát (`Antigravity/Gemini 4 Neon`)
- Phạm vi khảo sát: `git diff main...HEAD` trên nhánh `feat/agent-roles` (so với `main` @ `144a1b7`, tính đến commit `8df6865`), đối chiếu với `.agents/PLAN.md`.
- Nguyên tắc: chỉ ghi `.agents/SURVEY.md`, không chỉnh sửa bất kỳ tệp nào khác trong kho mã nguồn.

---

## 1. Bản đồ ảnh hưởng

### 1.1. Các tệp và cấu hình liên quan trong kho mã nguồn

| Tệp | Trạng thái trên `feat/agent-roles` | Phạm vi dòng & nội dung liên quan | Ghi chú ảnh hưởng |
|---|---|---|---|
| `AGENTS.md` | Sửa (commit `eb84e88`, +16 dòng) | Tổng 61 dòng (`CRLF`). Dòng 1–20 (Bối cảnh, Quy tắc mã nguồn, Triển khai, Quy trình phối hợp) và dòng 38–61 (Lệnh thường dùng) giữ nguyên. Thêm mới mục `## Vai trò agent và phương án điều phối` tại **dòng 22–37** (bảng A1–A5 tại dòng 24–30; Phương án 3 tại dòng 32; cú pháp mở phiên tại dòng 34; quy ước PR/commit/REVIEW tại dòng 36). | Nguồn quy tắc chung cho cả 3 công cụ (Claude Code qua `@AGENTS.md`, Codex CLI và Antigravity CLI đọc trực tiếp). |
| `.claude/settings.json` | Tạo mới (commit `d85fd4d`, 23 dòng) | Tổng 23 dòng (`LF`), JSON hợp lệ. Chỉ chứa khóa `permissions.deny` (**dòng 2–22**) với 17 quy tắc `Bash(<lệnh>:*)` tại **dòng 4–20** (`git push origin main`, `git push -f`, `git push --force`, `git merge`, `git rebase`, `git reset --hard`, `gh pr merge`, `clasp push`, `clasp deploy`, `clasp create-deployment`, `clasp redeploy`, `clasp update-deployment`, `clasp undeploy`, `clasp version`, `clasp run`, `clasp login`, `rm -rf`). Không có khóa `allow`. | Chỉ áp dụng cho Claude Code khi khởi chạy tại thư mục gốc repo/worktree. |
| `.agents/roles/A1.md` | Tạo mới (commit `c528fd6`, 22 dòng) | 4 phần chuẩn (`LF`): Tiêu đề (dòng 1), `## Nhiệm vụ` (dòng 3–8), `## Đầu ra bàn giao` (dòng 10–12), `## Quy tắc chung bắt buộc` (dòng 14–22). | Vai A1 – Kiến trúc sư (Claude Code). |
| `.agents/roles/A2.md` | Tạo mới (commit `c528fd6`, 21 dòng) | 4 phần chuẩn (`LF`): Tiêu đề (dòng 1), `## Nhiệm vụ` (dòng 3–7), `## Đầu ra bàn giao` (dòng 9–11), `## Quy tắc chung bắt buộc` (dòng 13–21). | Vai A2 – Khảo sát (Antigravity CLI). |
| `.agents/roles/A3.md` | Tạo mới (commit `c528fd6`, 22 dòng) | 4 phần chuẩn (`LF`): Tiêu đề (dòng 1), `## Nhiệm vụ` (dòng 3–8), `## Đầu ra bàn giao` (dòng 10–12), `## Quy tắc chung bắt buộc` (dòng 14–22). | Vai A3 – Lập trình viên chính (Codex CLI). |
| `.agents/roles/A4.md` | Tạo mới (commit `c528fd6`, 21 dòng) | 4 phần chuẩn (`LF`): Tiêu đề (dòng 1), `## Nhiệm vụ` (dòng 3–7), `## Đầu ra bàn giao` (dòng 9–11), `## Quy tắc chung bắt buộc` (dòng 13–21). | Vai A4 – Giao diện (Antigravity CLI). |
| `.agents/roles/A5.md` | Tạo mới (commit `c528fd6`, 29 dòng) | 4 phần chuẩn (`LF`): Tiêu đề (dòng 1), `## Nhiệm vụ` (dòng 3–8, gồm quy tắc chọn công cụ và tự kiểm tra không phải tác giả ở dòng 5–6), `## Đầu ra bàn giao` (dòng 10–19, gồm mẫu 2 dòng `REVIEW.md` ở dòng 14–17), `## Quy tắc chung bắt buộc` (dòng 21–29). | Vai A5 – Rà soát chéo (Codex CLI hoặc Claude Code). Khối quy tắc chung khớp từng ký tự giữa cả 5 tệp `A1.md`–`A5.md`. |
| `.agents/PLAN.md` | Sửa (commit `13b50e1`, 89 dòng) | Kế hoạch do A1 lập: mục tiêu (dòng 8–9), danh sách tệp đóng (dòng 11–19), 5 bước cho A3 (dòng 21–74), 6 tiêu chí nghiệm thu (dòng 76–82), rủi ro (dòng 84–86). | Tệp điều phối kế hoạch; không thuộc phạm vi sửa của A3 (trừ mục 6 nếu có câu hỏi). |
| `.agents/REVIEW.md` | Sửa (commit `8df6865`, 42 dòng) | Báo cáo rà soát chéo của A5 (`Claude Code/claude-opus-5-5`) cho các commit `c528fd6..eb84e88` của A3 (`Codex/GPT-6`), `PHÁN QUYẾT: ĐẠT` (dòng 1–2). | Tệp điều phối rà soát. |
| `CLAUDE.md` | **Không đổi** | Tổng 46 dòng (`CRLF`). Dòng 1 chứa `@AGENTS.md` (tự động nạp `AGENTS.md` vào ngữ cảnh Claude Code); dòng 40–43 dẫn chiếu quy trình `clasp` theo `AGENTS.md`. | Tự động kế thừa mục mới của `AGENTS.md` mà không cần chỉnh sửa. |
| `.claspignore` | **Không đổi** | Tổng 13 dòng (`CRLF`). Dòng 2 chặn toàn bộ (`**/**`); dòng 3–5 chỉ mở danh sách cho phép (`!appsscript.json`, `!*.gs`, `!*.html`); dòng 8–13 chặn tường minh `docs/**`, `.agents/**`, `.claude/**`, `cong-cu/**`, `**/*.md`, `**/*.js`. | Đã chặn đầy đủ mọi tệp mới và tệp sửa trên nhánh. |
| `.gitignore` | **Không đổi** | Tổng 1 dòng (`CRLF`): `.clasp.json ` (lưu ý có 1 ký tự khoảng trắng ở cuối dòng 1). | Không chặn `.agents/` hay `.claude/settings.json` (đúng ý định commit dùng chung), nhưng chưa có mục loại trừ `.claude/settings.local.json`. |

### 1.2. Xác nhận không ảnh hưởng tệp `.gs`/`.html` và lệnh `clasp push`

- Kết quả đối chiếu `git diff main...HEAD --stat` cho thấy nhánh chỉ thay đổi **9 tệp** (`.agents/PLAN.md`, `.agents/REVIEW.md`, `.agents/roles/A1.md`–`A5.md`, `.claude/settings.json`, `AGENTS.md`).
- **0 tệp `.gs`** (`Backup.gs`, `Mã.gs`, `RaSoatLai.gs`, `TaiKhoan.gs`, `TaiLieu.gs`, `ThongTinKCN.gs`), **0 tệp `.html`** (`Congcuvevung.html`, `HopThoai_TaiLieu.html`, `Index.html`, `Script.html`, `Style.html`, `Tab_BanDo.html`, `Tab_CongViec.html`, `Tab_GioiThieu.html`, `Tab_TraCuu.html`) và `appsscript.json` bị sửa đổi. Không phát sinh thay đổi hành vi ứng dụng Google Apps Script.
- Đối chiếu với `.claspignore` (dòng 2–5 và 9–12): tất cả tệp thay đổi trên nhánh đều bị chặn bởi luật gốc `**/**` (dòng 2), không thuộc danh sách mở `!appsscript.json` / `!*.gs` / `!*.html` (dòng 3–5), và tiếp tục bị chặn tường minh bởi `.agents/**` (dòng 9), `.claude/**` (dòng 10) và `**/*.md` (dòng 12). Do đó thay đổi trên nhánh **không ảnh hưởng** tập tệp được đẩy lên khi người dùng thực hiện `clasp push`.
- *Lưu ý kỹ thuật*: worktree hiện tại không chứa `.clasp.json` (tệp cục bộ không đưa vào Git), nên không chạy được `clasp status` tại worktree này; xác nhận dựa trên kiểm tra trực tiếp `git diff` và `.claspignore`.

---

## 2. Tra cứu tài liệu chính thức

### 2.1. (a) Claude Code – Đọc `.claude/settings.json` và so khớp `permissions.deny` dạng `Bash(...:*)`

**Nguồn chính thức:**
- Settings files and precedence: https://code.claude.com/docs/en/settings (bản Markdown: https://code.claude.com/docs/en/settings.md)
- Configure permissions: https://code.claude.com/docs/en/permissions (bản Markdown: https://code.claude.com/docs/en/permissions.md)

**Kết quả xác minh:**
1. **Cách đọc `.claude/settings.json` và thứ tự ưu tiên:**
   - Claude Code đọc tệp dùng chung `.claude/settings.json` tại **thư mục làm việc chính của phiên (`primary working directory`)** và **không tự đi ngược lên thư mục cha** để tìm tệp này. Vì vậy phiên Claude Code phải được mở tại thư mục gốc repo/worktree thì `.claude/settings.json` mới được nạp.
   - Thứ tự ưu tiên cấu hình từ cao xuống thấp: Managed settings → cờ dòng lệnh `--settings` → `.claude/settings.local.json` → `.claude/settings.json` → `~/.claude/settings.json`.
   - Riêng các danh sách quyền (`allow`, `ask`, `deny`) được **gộp (merge)** trên mọi phạm vi và đánh giá theo thứ tự **`deny` → `ask` → `allow`**. Một quy tắc `deny` ở `.claude/settings.json` **không thể bị ghi đè** bởi quy tắc `allow` ở `.claude/settings.local.json` hay `~/.claude/settings.json`.
   - Khác với `permissions.allow` (chỉ chạy sau khi người dùng xác nhận tin cậy thư mục – *workspace trust*), các quy tắc `deny` và `ask` trong `.claude/settings.json` **có hiệu lực ngay lập tức**.
2. **Cách so khớp `Bash(<tiền tố>:*)`:**
   - Tài liệu chính thức nêu rõ: hậu tố `:*` là **cách viết tương đương** với wildcard cuối có dấu cách ` *` (ví dụ `Bash(ls:*)` khớp giống hệt `Bash(ls *)`). Dạng `:*` chỉ được nhận diện ở **cuối mẫu** (nếu đặt giữa mẫu như `Bash(git:* push)` thì dấu `:` bị coi là ký tự thường). Hộp thoại cấp quyền hiện đại ghi theo dạng có dấu cách `Bash(cmd *)`, nhưng dạng `Bash(cmd:*)` ở cuối mẫu vẫn hợp lệ và tương đương.
   - Quy tắc có ` *` (và tương đương `:*`) ở cuối vừa khớp **lệnh trần không tham số** (ví dụ `Bash(clasp push:*)` khớp cả `clasp push` lẫn `clasp push -f`), vừa yêu cầu **ranh giới khoảng trắng** sau tiền tố (ví dụ `Bash(ls:*)` khớp `ls` và `ls -la`, **không** khớp `lsof`). Theo đó, lo ngại ở `.agents/REVIEW.md:37` rằng `Bash(git merge:*)` có thể chặn nhầm `git merge-base` **không xảy ra**.
   - **Lệnh ghép và trình bao (compound commands & wrappers):** Claude Code tách lệnh ghép theo `&&`, `||`, `;`, `|`, `|&`, `&`, xuống dòng, subshell, command substitution `$(...)`, vòng lặp; quy tắc `deny` kích hoạt nếu bất kỳ lệnh con nào khớp. Claude Code cũng tự bóc các trình bao cố định (`timeout`, `time`, `nice`, `nohup`, `stdbuf`, `command`, `builtin`, `noglob`, `xargs` không cờ, và gán biến môi trường đầu lệnh như `FOO=bar rm -rf ...`).
   - **Giới hạn so khớp:** Tài liệu nhấn mạnh `Bash(...)` chỉ so khớp chuỗi lệnh Claude sinh ra, không chặn gọi theo đường dẫn tuyệt đối (`/bin/rm`, `/usr/bin/git`), gọi qua trình bọc không thuộc danh sách cố định (`sh -c '...'`, `bash -c '...'`, `npx ...`), chèn cờ trước lệnh con (`git -C . push origin main`, `git -c ... push origin main`), và tách biệt với công cụ **`PowerShell`** (dùng quy tắc `PowerShell(...)` riêng).

### 2.2. (b) Codex CLI – Tự đọc `AGENTS.md` và cơ chế chặn lệnh

**Nguồn chính thức:**
- Custom instructions with `AGENTS.md`: https://developers.openai.com/codex/guides/agents-md (chuyển hướng chính thức tới https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- Rules (`prefix_rule` / `execpolicy`): https://developers.openai.com/codex/rules (chuyển hướng chính thức tới https://learn.chatgpt.com/docs/agent-configuration/rules)
- Config basics (sandbox & approval): https://developers.openai.com/codex/config-basic (chuyển hướng chính thức tới https://learn.chatgpt.com/docs/config-file/config-basic)

**Kết quả xác minh:**
1. **Có tự đọc `AGENTS.md` không?** **CÓ.** Khi khởi chạy, Codex CLI tự động xây dựng chuỗi chỉ dẫn theo thứ tự:
   - Cấp toàn cục: `~/.codex/AGENTS.override.md` (nếu có), ngược lại `~/.codex/AGENTS.md`.
   - Cấp dự án: đi từ gốc dự án (gốc Git) xuống thư mục làm việc hiện tại; tại mỗi thư mục lấy tối đa 1 tệp theo thứ tự `AGENTS.override.md` → `AGENTS.md` → `project_doc_fallback_filenames` (nếu khai báo trong `config.toml`).
   - Giới hạn tổng dung lượng mặc định `project_doc_max_bytes = 32 KiB`; tệp `AGENTS.md` của repo hiện nhỏ hơn nhiều nên được nạp đầy đủ.
2. **Có cơ chế chặn lệnh tương tự `.claude/settings.json` không?** **CÓ**, gồm các cơ chế sau:
   - **Tệp quy tắc Starlark `.rules` (đang ở trạng thái thử nghiệm – *experimental*):** đặt tại `~/.codex/rules/*.rules` (toàn cục) hoặc `<repo>/.codex/rules/*.rules` (cấp dự án — **chỉ nạp khi thư mục `.codex/` của dự án được tin cậy / trusted**). Dùng hàm `prefix_rule(pattern=[...], decision="forbidden" | "prompt" | "allow", justification="...")`, trong đó quyết định chặt nhất thắng (`forbidden` > `prompt` > `allow`). Quy tắc này kiểm soát các lệnh Codex yêu cầu chạy **ngoài sandbox**; có thể kiểm thử trước bằng `codex execpolicy check`. Khi lệnh được bọc trong `bash -lc`/`bash -c`/`sh`/`zsh`, Codex dùng tree-sitter tách lệnh ghép nếu chỉ có từ thuần và `&&`, `||`, `;`, `|`, nhưng **không tách** nếu có redirection, `$VAR`/`$(...)`, wildcard hay câu lệnh điều khiển (`if`, `for`).
   - **Sandbox & Approval policy (`~/.codex/config.toml` hoặc `.codex/config.toml`):** điều khiển bằng `sandbox_mode` (ví dụ `workspace-write`, mặc định bảo vệ các đường dẫn `.git`, `.agents`, `.codex`, `.aws`) và `approval_policy` (`on-request`, `never`, v.v.); môi trường doanh nghiệp có thêm `requirements.toml`.
   - **Lifecycle hooks (`hooks.json` hoặc `[hooks]`):** bật mặc định qua cờ ổn định `[features] hooks = true`.
   - *Hiện trạng repo:* chưa cấu hình `.codex/rules/*.rules` hay `.codex/config.toml`; Codex CLI hiện chỉ nhận ràng buộc mềm qua `AGENTS.md` và tệp vai trò, cùng cơ chế sandbox/approval cục bộ trên máy người dùng.

### 2.3. (c) Antigravity CLI (`agy`) – Tệp bối cảnh tự đọc và cơ chế chặn lệnh

**Nguồn chính thức:**
- Rules: https://antigravity.google/docs/rules (bản Markdown: https://antigravity.google/docs/rules.md)
- Agent permissions: https://antigravity.google/docs/permissions (bản Markdown: https://antigravity.google/docs/permissions.md)
- Hooks: https://antigravity.google/docs/hooks (bản Markdown: https://antigravity.google/docs/hooks.md)
- Settings & CLI reference: https://antigravity.google/docs/settings (`.md`) và https://antigravity.google/docs/cli/reference (`.md`)

**Kết quả xác minh:**
1. **Tự đọc tệp bối cảnh tên gì?** Antigravity CLI (`agy`) tự động phát hiện và nạp **cả `AGENTS.md` và `GEMINI.md`** (cùng các tệp quy tắc mô-đun có YAML frontmatter trong `.agents/rules/*.md`, và biến thể `<dir>/.agents/AGENTS.md`, `<dir>/.agents/GEMINI.md`, kế thừa ngược từ thư mục khởi chạy lên tới gốc kho Git, cộng dồn với tệp toàn cục `~/.gemini/AGENTS.md`, `~/.gemini/GEMINI.md`, `~/.gemini/config/AGENTS.md`, `~/.gemini/config/GEMINI.md`, `~/.gemini/config/rules/*.md`).
   - `AGENTS.md` và `GEMINI.md` không dùng frontmatter và luôn bật thường trực (`always_on`), giới hạn 24 KB/tệp và ngân sách tổng 20.000 token cho toàn bộ quy tắc luôn bật.
   - *Kiểm chứng thực tế:* trong chính phiên A2 này, `AGENTS.md` tại gốc worktree đã được `agy` tự động nạp vào bối cảnh.
   - `agy` **không** tự đọc `CLAUDE.md` hay `.claude/settings.json`.
2. **Có cơ chế chặn lệnh không?** **CÓ**, gồm 2 cơ chế cứng:
   - **Động cơ quyền chi tiết (`permissions` trong `~/.gemini/antigravity-cli/settings.json`):** hỗ trợ 3 danh sách `deny`, `ask`, `allow` theo cú pháp `action(target)` — với lệnh terminal là `command(prefix)`, `command(regex:pattern)`, `command(*)` (và `unsandboxed(...)`). Thứ tự ưu tiên tuyệt đối **`Deny > Ask > Allow`**; quy tắc `deny` có hiệu lực ở **mọi chế độ**, kể cả `always-proceed` (`--dangerously-skip-permissions`). Khi lệnh chứa cấu trúc shell có nguy cơ che giấu lệnh con (`$(...)`, backticks, `git -c core.pager=...`, v.v.), Antigravity tắt so khớp tiền tố và yêu cầu khớp toàn dòng hoặc rơi về `Ask`.
     - *Lưu ý phạm vi repo:* tài liệu chính thức của Antigravity CLI chỉ nêu tệp cấu hình quyền tại `~/.gemini/antigravity-cli/settings.json` (cấp máy người dùng, quản lý qua `/permissions`), **chưa xác minh** cơ chế commit tệp `permissions.deny` cấp dự án trực tiếp trong repo cho `agy`.
   - **Lifecycle Hooks cấp workspace (`<repo>/.agents/hooks.json`):** được Antigravity CLI hỗ trợ chính thức ở cấp repo (ngoài tệp toàn cục `~/.gemini/config/hooks.json`). Có thể gắn sự kiện `PreToolUse` với `"matcher": "run_command"` để chạy script kiểm tra `toolCall.args.CommandLine` và trả về `{"decision": "deny", "reason": "..."}` nhằm chặn cứng lệnh trước khi thực thi.
   - *Hiện trạng repo:* chưa có `.agents/hooks.json`; Antigravity CLI hiện dựa vào `AGENTS.md`, tệp vai trò và cấu hình quyền/sandbox cục bộ trên máy người dùng.

---

## 3. Chỗ dễ gây lỗi và lỗ hổng còn lại trong hàng rào quyền

1. **Chưa có hàng rào kỹ thuật trong repo cho Codex CLI (A3) và Antigravity CLI (A2, A4):**
   - `.claude/settings.json` chỉ có tác dụng với Claude Code. Trong Phương án 3, **A3 (Codex CLI)** là đơn vị viết mã và chạy lệnh nhiều nhất nhưng hiện chưa có `.codex/rules/*.rules` trong repo; tương tự, Antigravity CLI chưa có `.agents/hooks.json` trong repo. Cả hai vẫn phụ thuộc chủ yếu vào tuân thủ ngữ cảnh (`AGENTS.md` + tệp vai trò) và cấu hình máy cục bộ.
2. **Khoảng trống công cụ `PowerShell` của Claude Code trên Windows:**
   - Dự án phát triển trên Windows (các lệnh kiểm tra cú pháp PowerShell trong `AGENTS.md:45`, đường dẫn `C:\SZL-Apps\SonadeziLongThanh`). Claude Code có công cụ `PowerShell` riêng với quy tắc `PowerShell(...)` độc lập với `Bash(...)`. Danh sách hiện tại ở `.claude/settings.json:4-20` chỉ có `Bash(...)`, chưa có quy tắc `PowerShell(...)` tương ứng nếu phiên làm việc trên Windows gọi công cụ `PowerShell`.
3. **Các đường lách so khớp chuỗi trong 17 quy tắc `Bash(...:*)` của `.claude/settings.json`:**
   - **Push lên `main` hoặc push nhánh trái phép:** `Bash(git push origin main:*)` (dòng 4) không chặn được `git push origin HEAD:main`, `git push origin feat/x:main`, `git push` (khi nhánh theo dõi `main`), `git push --all`, `git push --mirror`, `git push <remote-khác> main`, hay `git push` lên nhánh bất kỳ dù quy tắc chung yêu cầu không tự push khi anh Hiếu chưa yêu cầu.
   - **Force push biến thể:** `Bash(git push -f:*)` và `Bash(git push --force:*)` (dòng 5–6) không chặn được dạng đảo vị trí cờ (`git push origin main -f`, `git push origin feat/x --force`), `--force-with-lease`, `--force-if-includes`, hay refspec có dấu `+` (`git push origin +HEAD:main`).
   - **Chèn cờ toàn cục trước lệnh con của Git:** theo chính tài liệu Claude Code, các dạng `git -C <dir> push ...`, `git -C <dir> merge ...`, `git -c <key=val> push ...`, `git --git-dir=... reset --hard` đều lách được quy tắc tiền tố `Bash(git <subcommand>:*)`.
   - **Tạo PR tự động:** quy tắc chung cấm tự tạo PR khi chưa yêu cầu, nhưng `.claude/settings.json` mới chặn `gh pr merge` (dòng 10), chưa chặn `gh pr create`.
   - **Gọi `clasp` qua trình chạy hoặc tên tệp Windows:** `npx clasp push`, `npx @google/clasp push`, `clasp.cmd push` (trên Windows), hoặc gọi qua đường dẫn đầy đủ đều không khớp `Bash(clasp push:*)` (tài liệu xác nhận `npx` không nằm trong danh sách wrapper tự bóc).
   - **Bọc shell và biến thể xóa tệp:** `sh -c '...'`, `bash -c '...'`, `cmd /c ...` không bị kiểm tra chuỗi lệnh bên trong bởi `Bash(...)`; `Bash(rm -rf:*)` (dòng 20) không chặn `rm -fr`, `rm -r -f`, `rm --recursive --force`, hay `Remove-Item -Recurse -Force` trên PowerShell.
   - **Nguy cơ sửa nhầm thư mục chính `C:\SZL-Apps\SonadeziLongThanh`:** `.claude/settings.json` chưa khóa phạm vi ghi tệp ngoài thư mục làm việc (ví dụ chưa dùng `permissions.blockWritesOutsideWorkingDirectories` của Claude Code).
4. **Phụ thuộc thư mục khởi chạy của `.claude/settings.json`:**
   - Vì Claude Code chỉ đọc `.claude/settings.json` tại CWD lúc mở phiên (không dò lên thư mục cha), nếu mở phiên từ thư mục con (ví dụ `.agents/` hay `docs/`), toàn bộ 17 quy tắc `deny` sẽ không được áp dụng.
5. **Điểm nhỏ về vệ sinh cấu hình repo:**
   - `.gitignore:1` có một khoảng trắng dư sau `.clasp.json` (`.clasp.json `) và chưa khai báo `.claude/settings.local.json` (nếu người dùng tự tạo tay tệp này trước khi Claude Code ghi vào global git excludes, có thể bị `git add` nhầm).
   - Quy tắc `AGENTS.md:50` chưa nêu tên `clasp login` trong ví dụ lệnh cấm (trong khi `.agents/roles/A*.md` và `.claude/settings.json:19` đã cấm). Theo nguyên tắc "làm theo quy tắc chặt hơn" thì không mâu thuẫn, nhưng có thể đồng bộ câu chữ về sau.
   - Kết thúc dòng khác nhau giữa tệp cũ (`AGENTS.md`, `CLAUDE.md`, `.claspignore` dùng `CRLF`) và 6 tệp mới (`.agents/roles/A1.md`–`A5.md`, `.claude/settings.json` dùng `LF`).
6. **Ghi nhận đính chính đối với `.agents/REVIEW.md:37`:**
   - Mục mức Thấp #3 trong `.agents/REVIEW.md` nêu lo ngại `Bash(git merge:*)` có thể chặn nhầm `git merge-base`. Qua tra cứu tài liệu chính thức Claude Code, mẫu `:*` ở cuối tương đương ` *` và yêu cầu dấu cách sau `merge`, nên **không** chặn nhầm `git merge-base`.

---

## 4. Kết luận

**Cần quay lại A3 sửa gì không? KHÔNG.**

**Lý do:**
- So với kế hoạch đã duyệt tại `.agents/PLAN.md` (mục 2, 3, 4 và phần rủi ro mục 5), các commit của A3 (`c528fd6`, `d85fd4d`, `eb84e88`) đã đáp ứng đầy đủ 6/6 tiêu chí nghiệm thu, đúng danh sách đóng, không ảnh hưởng tệp `.gs`/`.html`/`appsscript.json`/`.claspignore` và không ảnh hưởng quy trình `clasp push`.
- Cú pháp `Bash(<lệnh>:*)` trong `.claude/settings.json` đã được xác minh qua tài liệu chính thức của Claude Code là vẫn hoạt động tương đương `Bash(<lệnh> *)` và không gây lỗi chặn nhầm `git merge-base`.
- Các lỗ hổng còn lại ở mục 3 đều nằm ngoài phạm vi `.agents/PLAN.md` (hoặc đã được mục 5 `PLAN.md` ghi nhận và chấp nhận ở giai đoạn hiện tại).

**Đề xuất cho giai đoạn tiếp theo (tách thành việc riêng sau khi anh Hiếu rà và gộp nhánh này, KHÔNG yêu cầu A3 sửa lại ở nhánh `feat/agent-roles`):**
1. **Ưu tiên cao nhất (ngoài repo):** Anh Hiếu bật **Branch Protection** trên GitHub cho nhánh `main` (chặn push trực tiếp, chặn force push, bắt buộc Pull Request). Đây là lớp bảo vệ cứng duy nhất áp dụng cho mọi công cụ (Claude Code, Codex CLI, Antigravity CLI) và mọi biến thể câu lệnh.
2. **Tùy chọn nâng cấp hàng rào trong repo ở nhánh riêng về sau:**
   - Bổ sung vào `.claude/settings.json`: chuyển dần sang cú pháp mới `Bash(<lệnh> *)`, cân nhắc chặn rộng `Bash(git push *)`, `Bash(gh pr create *)`, `Bash(npx clasp *)`, `Bash(clasp.cmd *)`, thêm nhóm `PowerShell(...)` tương ứng cho Windows và bật `permissions.blockWritesOutsideWorkingDirectories: true`.
   - Cân nhắc thêm hàng rào cứng cho 2 công cụ còn lại: `.codex/rules/default.rules` (`prefix_rule` với `decision = "forbidden"`) cho Codex CLI và `.agents/hooks.json` (`PreToolUse` cho `run_command`) cho Antigravity CLI (hoặc thiết lập `permissions.deny` trong `~/.gemini/antigravity-cli/settings.json` trên máy làm việc).
   - Đồng bộ `clasp login` vào `AGENTS.md:50`, bỏ khoảng trắng cuối dòng 1 của `.gitignore` và thêm `.claude/settings.local.json` vào `.gitignore`.
