# SURVEY – Khảo sát lệnh Orca Orchestration cho chuỗi điều phối A1–A5

- Vai thực hiện: A2 – Khảo sát (`Antigravity/Gemini 4 Neon`)
- Nhánh làm việc: `feat/dieu-phoi` (worktree Orca `feat-dieu-phoi`, căn cứ `.agents/PLAN.md` commit `df8e39b`)
- Môi trường khảo sát:
  - Ứng dụng Orca cục bộ: **`appVersion: 1.4.272`** (`state: ready`, `reachable: true`, `connectionState: connected`, `graph.state: ready`; nguồn: `orca status --json`).
  - Skill đi kèm: **`orchestration`** (bản đồng bộ theo phiên bản Orca CLI `1.4.272`, gồm tài liệu chính và 7 phụ lục `references/*.md`; nguồn: `orca skills get orchestration --full`).
  - Các capability Orchestration đã bật trên runtime `1.4.272` (`orca status --json`): `orchestration.contract.v1`, `orchestration.worker-start-implicit-run.v1`, `orchestration.worker-auto-release.v1`, `orchestration.worker-keep-open.v1`, `orchestration.worker-stop-verdict.v1`, `orchestration.worker-stop-helpers.v1`, `orchestration.worker-launch-preferences.v1`, `orchestration.worker-turn-stop-reports.v1`, `orchestration.ask-returns-at-once.v1`, `orchestration.paired-worker-approvals.v1`, `orchestration.retained-run-bindings.v1`, `orchestration.client-agent-asks.v1`, `orchestration.federation.v1`, `orchestration.remote-owned-workers.v1`, `orchestration.chat-lineage.v1`.
- Phạm vi thực hiện: chỉ chạy lệnh chỉ đọc theo `.agents/PLAN.md` (`orca status --json`, `orca skills get orchestration --full`, `orca orchestration --help` và `--help` của các lệnh con); không tạo Run, Task hay Worker.

---

## 1. Cú pháp chính xác các lệnh Orca Orchestration và tập giá trị hợp lệ

> **Quy tắc chung cho môi trường Windows PowerShell** (nguồn: `orca skills get orchestration --full`, `check --help`, `send --help`):
> - Luôn thêm `--environment local` cho các lệnh cục bộ (`run-create`, `task-create`, `task-list`, `worker-start`, `worker-list`) để ghim vào Orca trên máy hiện tại, tránh bị `ORCA_ENVIRONMENT` hoặc mã pairing trong shell chuyển hướng.
> - Với nội dung nhiều dòng hoặc có ký tự nháy/backtick, ghi ra tệp rồi truyền `--spec-file <path>` hoặc `--body-file <path>`; **không** dùng heredoc (`<<`) hoặc here-string (`<<<`).
> - Trên PowerShell, bọc dấu nháy kép cho danh sách có dấu phẩy (ví dụ `--types "worker_done,question,escalation"`) và địa chỉ nhóm có `@` (ví dụ `--to "@all"`); tránh truyền JSON thô qua `--payload` mà ưu tiên cờ tường minh (`--task-id`, `--dispatch-id`, `--outcome`, ...).

### 1.1. `orca orchestration run-create`
- **Nguồn:** `orca orchestration run-create --help`, `orca skills get orchestration --full` (`references/coordinator-loop.md`).
- **Cú pháp:**
  ```text
  orca orchestration run-create --objective <text> [--environment local] [--from <handle>] [--retry-request <id>] [--json] [--full]
  ```
- **Ghi chú kỹ thuật:** Run là namespace và hộp thư gốc (`home inbox`) cho phiên điều phối; Run **không** tự lập lịch hay tự khởi động worker. Dù `worker-start --spec` có thể tự tạo Run nếu chưa gắn, vẫn nên chạy `run-create` trước để cố định `run_id` cho chuỗi nhiệm vụ.
- **Ví dụ:**
  ```powershell
  orca orchestration run-create --environment local --objective "Điều phối A1-A5: <tóm tắt yêu cầu>" --json
  ```

### 1.2. `orca orchestration task-create`
- **Nguồn:** `orca orchestration task-create --help`, `references/coordinator-loop.md`.
- **Cú pháp:**
  ```text
  orca orchestration task-create (--spec <text> | --spec-file <path|->) [--task-title <text>] [--display-name <text>] [--deps <json_array>] [--parent <task_id>] [--run <run_id>] [--environment local] [--from <handle>] [--retry-request <id>] [--json] [--full]
  ```
- **Ghi chú kỹ thuật:** Phải truyền đúng một trong hai cờ `--spec` hoặc `--spec-file`. Nên ghi tệp spec tạm vào `$env:TEMP` (ngoài cây repo) để không làm bẩn `git status`.
- **Ví dụ:**
  ```powershell
  orca orchestration task-create --environment local --run <run_id> --task-title "A1 - Lập kế hoạch" --spec-file "$env:TEMP\spec-a1.md" --json
  orca orchestration task-create --environment local --run <run_id> --task-title "A2 - Khảo sát" --spec-file "$env:TEMP\spec-a2.md" --deps '["<task_id_A1>"]' --json
  ```

### 1.3. `orca orchestration worker-start`
- **Nguồn:** `orca orchestration worker-start --help`, `orca skills get orchestration --full`.
- **Cú pháp:**
  ```text
  orca orchestration worker-start (--task <task_id> | --spec <text> | --spec-file <path|->) [--keep-open] [--on <saved-environment>] [--worktree <current|selector|new-child|new-top-level>] (--agent <agent> | --terminal <handle>) [--task-title <text>] [--deps <json_array>] [--parent <task_id>] [--model <id>] [--effort <level>] [--name <name>] [--repo <selector>] [--base-branch <ref>] [--display-name <text>] [--comment <text>] [--setup <run|skip|inherit>] [--retry-of <dispatch_id>] [--timeout-ms <n>] [--run <run_id>] [--environment local] [--from <handle>] [--retry-request <id>] [--item <n>] [--for <message_id>] [--json] [--full]
  ```
- **Ghi chú kỹ thuật quan trọng từ `--help`:**
  - Nếu đã tạo Task bằng `task-create`, dùng `--task <task_id>` (không truyền thêm `--spec`).
  - Các cờ tạo worktree (`--name`, `--repo`, `--base-branch`, `--display-name`, `--comment`, `--setup`) **bị từ chối** khi dùng `--worktree current` hoặc worktree đã tồn tại.
  - `worker-start` không kiểm tra trước CLI của agent đã cài đặt hay chưa; nếu thiếu CLI sẽ lỗi quá thời gian chờ `agent_readiness`.
  - Khi mã thoát khác 0 (`failed` / `outcome_unknown`): **không** chạy lại ngay; đọc `failedStage`, kiểm tra `worker-list`/`worker-show` hoặc `request-show --request <request_id>`.
  - Khi chạy lại lần thử thất bại trên cùng Task: dùng `--task <task_id> --retry-of <dispatch_id>` và khai báo lại `--worktree`, `--agent` (không tự kế thừa vị trí đặt). Sau 3 lần thất bại liên tiếp trong cùng chuỗi `--retry-of`, hệ thống kích hoạt cầu dao (`circuit_broken`) và chuyển Task sang `failed`.
- **Ví dụ:**
  ```powershell
  # Chạy Task đã tạo trên worktree hiện tại:
  orca orchestration worker-start --environment local --run <run_id> --task <task_id> --worktree current --agent claude --json

  # Chạy Task ở worktree con rẽ từ nhánh yêu cầu hiện tại (khi buộc phải tách worktree):
  orca orchestration worker-start --environment local --run <run_id> --task <task_id> --worktree new-child --base-branch feat/ten-nhanh --name a2-khao-sat --agent antigravity --json
  ```

### 1.4. `orca orchestration check --wait` và cơ chế `--ack`
- **Nguồn:** `orca orchestration check --help`, `orca skills get orchestration --full`.
- **Cú pháp:**
  ```text
  orca orchestration check [--terminal <handle>] [--run <run_id>] [--ack <delivery_id>] [--unread | --peek | --all] [--types <type,...>] [--format] [--wait] [--timeout-ms <n>] [--retry-request <id>] [--json]
  ```
- **Cơ chế đánh thức và tiêu thụ thư trên Orca `1.4.272`:**
  - **Cơ chế mặc định ở chế độ Chat:** Sau `worker-start`, điều phối viên **kết thúc lượt (`end your turn`)**; Orca tự động đánh thức điều phối viên và chuyển trọn vẹn tin nhắn vào hội thoại. Skill `orchestration` **cấm** chạy vòng lặp poll/watch bằng `check` thường vì sẽ nuốt thư của điều phối viên.
  - **Khi dùng `check` / `check --wait`:** Chỉ gọi `check` khi thông báo đánh thức nêu rõ lệnh `check` (phiên terminal hoặc tin nhắn quá lớn cho khung chat), hoặc khi phiên CLI cần chặn chờ chủ động. Khi `--wait` chạy, Orca in dòng JSON keepalive (`_keepalive`, alias cũ `_heartbeat`) ra `stderr` mỗi 15 giây.
  - **Ý nghĩa `--types`:** Chỉ là điều kiện đánh thức cho `--wait` (và bộ lọc hiển thị cho `--peek`/`--all`). Gói `Delivery` trả về từ lệnh `check` tiêu thụ luôn là **toàn bộ lô FIFO chưa đọc**, không bị cắt lọc theo `--types`.
  - **Cơ chế `--ack`:** Trên Orca `1.4.272`, lệnh `check` mặc định (không có `--peek`/`--all`) **tự động đánh dấu lô FIFO trả về là đã xử lý (handled)** nên **KHÔNG CẦN gọi `--ack` riêng**. Cờ `--ack <delivery_id>` là tùy chọn chỉ dùng tương thích với bản Orca cũ; gọi `--ack` cho lô đã xử lý là no-op. Kịch bản chỉ xem trước phải dùng `--peek` (hoặc `--peek --wait`) và không được `--ack`.
  - **Khôi phục khi mất phản hồi/ngữ cảnh:** Chạy lại với `--retry-request <id>` để nhận đúng lô cũ, hoặc đọc lại lịch sử bằng `orca orchestration inbox --terminal run:<run_id> --limit 50 --full --json`.
- **Ví dụ:**
  ```powershell
  # Đọc lô chưa đọc mới nhất (tự đánh dấu đã xử lý, không cần --ack):
  orca orchestration check --run <run_id> --json

  # Chặn chờ tin nhắn từ worker (khi phiên chạy ở terminal CLI):
  orca orchestration check --run <run_id> --wait --types "worker_done,question,escalation" --timeout-ms 600000 --json

  # Xác nhận thủ công (chỉ cần với Orca cũ; trên 1.4.272 là no-op):
  orca orchestration check --run <run_id> --ack <delivery_id> --json
  ```

### 1.5. Giá trị hợp lệ của `--agent`, `--worktree`, `--model`, `--effort`
- **Nguồn:** `orca orchestration worker-start --help`, `orca --help`, `orca skills get orchestration --full`.

| Cờ | Giá trị hợp lệ đã xác minh | Ghi chú & điểm chưa xác minh |
|---|---|---|
| `--agent` | ID agent đã bật trên máy chạy worker. `worker-start --help` liệt kê ví dụ: `claude`, `codex`, `cursor`, `antigravity`, `muse`, `zcode`, `opencode`, `opencode2` (phần `--model` nhắc thêm `grok`, `omp`, `pi`). | Dự án dùng 3 giá trị: **`claude`**, **`codex`**, **`antigravity`**. Danh sách cài đặt thực tế trên máy chưa chạy lệnh liệt kê riêng do giới hạn lệnh chỉ đọc trong `PLAN.md`. |
| `--worktree` | `current` (hoặc `active` theo phần Options), `new-child`, `new-top-level`, hoặc bộ chọn worktree sẵn có: `identity:<identity>`, `id:<repo-id>::<path>`, `folder:<id>`, `name:<displayName>`, `branch:<branch>`, `issue:<number>`, `path:<path>`. | Skill chuẩn hóa dùng `current` cho workspace hiện tại. `current` **không hợp lệ** với `--on <server>`. |
| `--model` | ID mô hình gốc của nhà cung cấp (opaque provider model id) cho `claude`, `codex`, `cursor`, `antigravity`, `grok`, `muse`; `omp` nhận vai/selector (`@worker`, `provider/model:level`); `pi` nhận `provider/id`; `opencode` cần worktree có sẵn + CLI đã xác minh + model khả dụng; agent khác (`zcode`, ...) dùng cấu hình riêng. | Không kết hợp với `--terminal`. Skill khuyến nghị **chỉ truyền `--model` khi người dùng chỉ đích danh**. Danh sách model ID cụ thể từng tài khoản: **chưa xác minh** (không chạy lệnh truy vấn ngoài danh sách `PLAN.md`). |
| `--effort` | Mức suy luận cho model đã chọn. `worker-start --help` nêu rõ tập mức của `pi`: `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`; skill nêu ví dụ `claude-opus-5-5`: `low`, `medium`, `high`, `xhigh`; `orca --help` có ví dụ `codex` dùng `--effort high`; `opencode` không hỗ trợ `--effort`. | **Bắt buộc đi kèm `--model`** (`--effort requires --model`) và không kết hợp với `--terminal`. Tập giá trị chính xác từng model của `claude`/`codex`/`antigravity` chấp nhận: **chưa xác minh** bằng chạy thử. |

---

## 2. Chạy worker trên `--worktree current` và phương án thu hồi kết quả nếu A2/A4 chạy ở worktree con

### 2.1. Khả năng dùng `--worktree current` theo từng agent
- **Theo `worker-start --help` và `orca skills get orchestration --full` (bản `1.4.272`):**
  - `--worktree current` được định nghĩa là vị trí mặc định để chạy worker ngay trong workspace hiện tại của điều phối viên khi chỉ chạy **tuần tự một worker tại một thời điểm** (không có xung đột ghi tệp đồng thời).
  - Trong toàn bộ tài liệu skill `orchestration` (633 dòng) và `--help` của Orca `1.4.272`, **không** xuất hiện dòng ràng buộc `"Antigravity workers need a local child worktree"` hay điều khoản cấm `--worktree current` riêng cho `antigravity`. Ghi chú trong `PLAN.md` nhiều khả năng xuất phát từ bản Orca trước, tài liệu ngoài hoặc hành vi thực tế của bản dựng trước đó.
- **Đánh giá từng công cụ (trạng thái hiện tại do chưa chạy thử `worker-start`):**
  - **`claude` (A1, A5):** Tài liệu `--help`/skill hỗ trợ `--worktree current` khi chạy tuần tự. *Chưa xác minh bằng chạy thử thực tế.*
  - **`codex` (A3, A5):** Tài liệu `--help`/skill hỗ trợ `--worktree current` khi chạy tuần tự. *Chưa xác minh bằng chạy thử thực tế.*
  - **`antigravity` (A2, A4):** Tài liệu bản `1.4.272` không ghi cấm `--worktree current`, nhưng **chưa xác minh thực tế** liệu runtime trên máy có chấp nhận `current` hay yêu cầu `new-child`, đồng thời các bản ghi lỗi công khai của `stablyai/orca` (ví dụ issue `#13488`, `#13854`) từng ghi nhận hiện tượng đua thời điểm tiêm prompt khi khởi chạy `antigravity` nếu quá trình khởi tạo/đăng nhập chưa hoàn tất.

### 2.2. Phương án đưa kết quả về nhánh của yêu cầu nếu A2/A4 buộc phải chạy ở worktree con (`--worktree new-child`)
Nếu khi thử nghiệm thực tế Orca từ chối `--worktree current` cho `antigravity` (hoặc cần cô lập A2/A4 sang worktree con), quy trình chuẩn bảo toàn đúng nhánh yêu cầu (`feat/...` hoặc `fix/...`) và đúng dấu vết tác giả như sau:

1. **Tạo worktree con đúng gốc nhánh yêu cầu (điểm dễ sai nhất):**
   - Bắt buộc truyền `--base-branch <nhánh-yêu-cầu-hiện-tại>` (ví dụ `--base-branch feat/ten-yeu-cau`) khi chạy `worker-start --worktree new-child --name <a2-khao-sat|a4-giao-dien> --agent antigravity`.
   - Lý do: nếu bỏ `--base-branch`, worktree con có thể tách từ nhánh gốc mặc định (`main`) nên sẽ **thiếu `.agents/PLAN.md` (A1) và các commit mã nguồn (A3)**.
2. **Yêu cầu worker A2/A4 commit trong worktree con và báo `<sha>`:**
   - Trong spec giao cho A2/A4, yêu cầu worker chỉ sửa tệp thuộc danh sách đóng (`.agents/SURVEY.md` đối với A2; các tệp HTML/CSS/SVG được giao đối với A4), commit ngay trên nhánh con với dòng cuối `Agent: Antigravity/<mô hình>` (không `Co-Authored-By`), và báo rõ **mã commit `<sha>`** + **tên nhánh/đường dẫn worktree con** trong tin nhắn `worker_done`.
3. **Đưa commit về nhánh yêu cầu bằng `git cherry-pick <sha>` (phương án ưu tiên):**
   - Tại worktree chính của yêu cầu (đang đứng ở nhánh `feat/...` hoặc `fix/...`, `git status` sạch), điều phối viên:
     1. Kiểm tra `git show --stat <sha>` để xác nhận commit chỉ đụng tệp trong danh sách đóng và có đúng dòng `Agent: Antigravity/...`.
     2. Chạy `git cherry-pick <sha>` (hoặc `git cherry-pick <sha_đầu>^..<sha_cuối>` nếu có nhiều commit).
   - **Ưu điểm:** Không dùng `git merge`/`git rebase`, không chạm nhánh `main`, giữ nguyên nội dung, thông điệp commit và dòng `Agent: Antigravity/<mô hình>` để bước A5 đối chiếu đúng công cụ tác giả.
   - **Xử lý xung đột:** Nếu `git cherry-pick` báo xung đột, chạy ngay `git cherry-pick --abort` và **dừng, báo anh Hiếu** (điều phối viên tuyệt đối không tự sửa mã hay tự soạn lại `SURVEY.md`).
   - **Dọn dẹp sau khi thu hồi:** Worktree mới (`new-child`) có thể ở trạng thái `keepOpenByDefault` (`worker-start --help`); sau khi `cherry-pick` thành công, có thể gọi `orca orchestration worker-release --dispatch <dispatch_id>` để đóng tab/terminal worker và ghi chú đường dẫn worktree con trong báo cáo cuối để anh Hiếu quyết định lưu hay xóa.
4. **Phương án dự phòng thủ công (khi cả `current` và `new-child` đều lỗi hoặc gặp 429):**
   - Đúng theo rủi ro mục 5 của `PLAN.md`: điều phối viên dừng tại bước A2 hoặc A4, in sẵn câu mở phiên chuẩn (`Đọc .agents/roles/A2.md và AGENTS.md rồi làm việc sau: …` hoặc `A4.md`) để anh Hiếu tự mở phiên Antigravity trực tiếp trong worktree hiện tại, hoàn tất commit rồi báo lại để điều phối viên tiếp tục chuỗi.

---

## 3. Phụ thuộc Task, tin nhắn báo xong của worker và cách đọc kết quả

### 3.1. Khai báo phụ thuộc và thứ tự Task
- **Có hỗ trợ khai báo phụ thuộc (DAG)** (nguồn: `task-create --help`, `task-list --help`, `task-update --help`, `references/coordinator-loop.md`):
  - Dùng `--deps '["<task_id_1>","<task_id_2>"]'` khi chạy `task-create` (hoặc `worker-start`) và tùy chọn `--parent <task_id>`.
  - Kiểm tra Task đủ điều kiện chạy bằng: `orca orchestration task-list --environment local --run <run_id> --ready --brief --json`.
  - Các trạng thái hợp lệ của `--status` trong `task-update`: `pending`, `ready`, `dispatched`, `completed`, `failed`, `blocked`.
- **Lưu ý vận hành:** Orca **không** tự chạy Task khi phụ thuộc xong; điều phối viên vẫn phải chủ động gọi `worker-start --task <task_id>` cho từng bước. Với chuỗi A1→A5 có nhánh rẽ điều kiện (bỏ qua A1/A2 cho việc nhỏ, có/không có A4, chọn công cụ A5 theo dòng `Agent:` của A3/A4, vòng lặp sửa tối đa 2 lần), tạo từng Task tuần tự (kèm `--deps` trỏ về Task bước trước nếu muốn lưu dấu vết đồ thị) gọn hơn tạo cứng toàn bộ 5 Task ngay từ đầu.

### 3.2. Tin nhắn báo xong và hỏi đáp của worker
- **Báo xong (`worker_done`)** (nguồn: `orca orchestration send --help`, `references/worker-teardown.md`):
  - Worker được tiêm preamble chứa `Task ID`, `Dispatch ID` và giá trị `--from` chuẩn; khi hoàn thành, worker gửi:
    ```text
    orca orchestration send --type worker_done --outcome <succeeded|failed> --task-id <task_id> --dispatch-id <dispatch_id> --subject "<tóm tắt>" --body "<bằng chứng>" [--files-modified <csv>] [--report-path <path>]
    ```
  - `worker_done` bắt buộc có `--outcome succeeded` hoặc `--outcome failed`, không gửi cho nhóm (`@all`), bỏ `--to` mặc định về hộp thư Run của điều phối viên.
  - `worker_done` chốt trạng thái cả Dispatch lẫn Task (`succeeded` → `completed`; `failed` → `failed`). Điều phối viên **không bao giờ** đánh dấu `completed` cho báo cáo `failed`.
- **Hỏi điều phối viên (`question`)** (nguồn: `orca orchestration ask --help`):
  - Worker gọi `orca orchestration ask --question "<nội dung>" [--options <csv>]`. Trên Orca `1.4.272` (`orchestration.ask-returns-at-once.v1`), lệnh trả về ngay để worker kết thúc lượt và chờ Orca đánh thức khi có câu trả lời.

### 3.3. Cách điều phối viên đọc và xử lý kết quả (`worker_done`, `question`, `escalation`)
- **Các lệnh đọc/tra cứu hỗ trợ** (nguồn: `worker-show --help`, `worker-read --help`, `inbox --help`, `worker-list --help`):
  - `orca orchestration worker-show --dispatch <dispatch_id> --json`: xem trạng thái, `liveness` (`live`/`exited`/`unverifiable`), `observation.agentWait`, `autoReleaseAt`.
  - `orca orchestration worker-read --dispatch <dispatch_id> --source auto --json`: đọc output/transcript bị giới hạn kích thước; dùng được cho cả chat worker không có terminal và cả sau khi terminal đã tự đóng (`auto-release` sau ~2 phút khi `worker_done`).
  - `orca orchestration worker-list --environment local --run <run_id> --json`: kiểm kê toàn bộ worker và trạng thái tài nguyên (`active`, `reclaimable`, `retained`, `release_pending`, `release_unknown`, `released`).
  - `orca orchestration inbox --terminal run:<run_id> --limit 50 --full --json`: tra cứu lại thư đã đọc của điều phối viên khi mất ngữ cảnh.
- **Ma trận xử lý 3 loại tin nhắn chính** (nguồn: `orca skills get orchestration --full`, `reply --help`, `references/worker-teardown.md`):

| Loại tin nhắn | Dấu hiệu / Nội dung | Hành động của điều phối viên |
|---|---|---|
| `worker_done` | `outcome: succeeded` hoặc `failed`, kèm tóm tắt/commit/bằng chứng | Nếu `succeeded`: kiểm chứng trực tiếp bằng `git status`, `git log`, đọc tệp đầu ra (`PLAN.md`/`SURVEY.md`/`REVIEW.md`), rà cổng dừng rồi mới khởi động bước tiếp. Nếu `failed`: đọc `worker-read`, dừng và báo anh Hiếu. |
| `question` | Worker gọi `ask`, có `message_id` | Nếu câu trả lời có sẵn trong `AGENTS.md`, `PLAN.md` hoặc yêu cầu gốc của anh Hiếu: gọi `orca orchestration reply --id <message_id> --body "<câu trả lời>"` (hoặc `--body-file`). Nếu cần quyết định nghiệp vụ/kiến trúc/phân quyền: **dừng, hỏi anh Hiếu** trước rồi mới `reply`. |
| `escalation` | (1) Worker dừng không gửi `worker_done` (`stopReason: exited` hoặc `lost`); hoặc (2) Worker chờ duyệt quyền (`approval_id`, `permission prompt`) | - `stopReason: exited`: tiến trình đã thoát; đọc `worker-read` xác định nguyên nhân rồi dừng báo anh Hiếu (không tự retry mù quáng).<br>- `stopReason: lost`: **không chứng minh đã thoát**; bắt buộc chạy `worker-show` kiểm tra `liveness`. Nếu `unverifiable`: **dừng và báo anh Hiếu**, tuyệt đối không gửi mail hay mở worker thứ 2.<br>- Hộp thoại quyền (`permission prompt`): xử lý theo Mục 4. |

---

## 4. Xử lý khi worker hỏi quyền (`permission prompt`) lúc Settings tự duyệt đang TẮT

- **Nguồn:** `orca orchestration approve --help`, `orca orchestration deny --help`, `orca orchestration worker-show --help`.
- **Trạng thái khi Settings `"Let coordinators approve worker permission prompts"` đang TẮT:**
  1. Khi worker đụng hộp thoại xin quyền chạy lệnh/công cụ, worker chuyển sang trạng thái chờ nhập liệu (`needs-input`). Lệnh `worker-show --dispatch <dispatch_id>` trả về trường `observation.agentWait` (với bằng chứng `hook`, `prompt-text` hoặc `title`). Tài liệu `--help` khẳng định: **worker đang chờ quyền là khỏe mạnh (`healthy`), không phải thất bại (`failed`)**.
  2. Orca gửi tin nhắn `escalation` về điều phối viên kèm `dispatch_id` và `approval_id`.
  3. Lệnh `orca orchestration approve --dispatch <dispatch_id> --prompt <approval_id> --reason <text>` **bị hệ thống từ chối** khi cài đặt này đang TẮT (và `escalation` cũng không gợi ý lệnh `approve`). Trong khi đó, anh Hiếu vẫn nhìn thấy trực tiếp nút **Allow / Deny** trên giao diện Orca.
  4. Riêng lệnh **`orca orchestration deny`** vẫn dùng được để từ chối một lần (`refuse-once`, không tạo luật dài hạn và không giết worker):
     ```powershell
     orca orchestration deny --dispatch <dispatch_id> --prompt <approval_id> --reason "<lý do từ chối>"
     ```
     Nếu hộp thoại quyền của agent không hỗ trợ kèm tin nhắn lý do, Orca sẽ chuyển lý do đó tới worker như thư tiếp theo để worker tự điều chỉnh cách làm.
- **Quy trình bắt buộc cho điều phối viên:**
  - **Tuyệt đối không** bật hoặc yêu cầu bật `"Let coordinators approve worker permission prompts"`, **không** gọi `orca orchestration approve`.
  - Khi nhận `escalation` về hộp thoại quyền:
    - **Trường hợp lệnh xin quyền VI PHẠM quy tắc dự án** (ví dụ `git push`, `clasp push`, sửa thư mục chính `C:\SZL-Apps\SonadeziLongThanh`, sửa tệp ngoài danh sách đóng): điều phối viên gọi `orca orchestration deny --dispatch <dispatch_id> --prompt <approval_id> --reason "<nêu rõ quy tắc bị cấm>"` (hoặc dừng báo anh Hiếu).
    - **Trường hợp lệnh xin quyền HỢP LỆ nhưng cần người duyệt:** **không** chạy `worker-stop`, **không** đánh dấu lỗi, **không** mở worker thay thế. Điều phối viên dừng chờ và thông báo ngắn gọn cho anh Hiếu (nêu vai A<n>, `dispatch_id`, lệnh worker đang xin quyền) để anh Hiếu tự bấm **Allow/Deny** trên Orca. Khi anh Hiếu thao tác xong, worker chạy tiếp và gửi `worker_done` đánh thức lại điều phối viên.
    - Nếu dùng `check --wait` và gặp hết giờ (`timeout-ms`) trong lúc chờ, phải kiểm tra `worker-show` xem `observation.agentWait` có tồn tại không trước khi kết luận worker bị treo.

---

## 5. Rủi ro và giới hạn hạn mức (Claude Pro, Antigravity 429)

1. **Giới hạn hạn mức gói tài khoản:**
   - **Claude Pro (hạn mức thấp nhất):** Mỗi quy trình đầy đủ tiêu tốn ít nhất 2 phiên Claude (`A1` lập kế hoạch và `A5` rà soát mã của Codex; thêm phiên A5 cho mỗi vòng `CẦN SỬA`). Việc giữ Codex làm điều phối viên + A3, bỏ qua A1/A2 cho việc nhỏ, và khóa tối đa **2 vòng sửa** là bắt buộc để không cạn hạn mức Claude Pro giữa chừng.
   - **Antigravity (lỗi HTTP `429` / giới hạn theo khung thời gian):** Dễ phát sinh khi gọi liên tiếp `A2` và `A4` hoặc khi retry nhiều lần. Khi gặp `429`, worker có thể dừng đột ngột (`escalation`) hoặc báo `worker_done --outcome failed`. **Không tự retry liên tục** vì không khắc phục được nguyên nhân mà còn chạm cầu dao 3 lần (`circuit_broken`); phải dừng ngay tại cổng dừng (c) và báo anh Hiếu.
   - **Codex CLI (điều phối viên + A3 + A5 dự phòng):** Phải giữ spec gọn gàng, đọc tệp có chọn lọc, tránh gọi `worker-read --full` lặp lại nhiều lần gây phình ngữ cảnh.
2. **Rủi ro tính năng thử nghiệm và khác biệt giữa các agent:**
   - **Thay đổi cú pháp theo bản cập nhật Orca:** Cú pháp khảo sát trong báo cáo này gắn với **Orca `1.4.272`**; cần ghi rõ phiên bản trong `DIEU-PHOI.md` để đối chiếu lại khi nâng cấp.
   - **Đua thời điểm khởi tạo và ràng buộc worktree của `antigravity`:** Chưa xác minh thực tế `--worktree current` cho `antigravity`; có tiền lệ lỗi prompt injection trên bản Orca cũ và nguy cơ rẽ sai từ `main` nếu dùng `--worktree new-child` mà quên `--base-branch <nhánh-yêu-cầu>`.
   - **Trạng thái `lost` / `unverifiable`:** Nếu điều phối viên tự chạy lại worker thứ 2 trên cùng `--worktree current` khi tiến trình cũ chưa chắc đã thoát, hai agent sẽ ghi đè tệp và làm hỏng chỉ mục Git.
   - **Cài đặt `Nested worker depth`:** Các bản Orca gần đây có thể đặt mặc định `Nested worker depth` lớn hơn 1 (ví dụ 4). Nếu không cấm trong spec, worker con có thể tự gọi `worker-start` đẻ thêm tầng làm rối nhánh và cạn hạn mức nhanh chóng.
   - **Chênh lệch hàng rào kỹ thuật giữa 3 công cụ:** Chỉ Claude Code đọc `.claude/settings.json`; Codex và Antigravity không đọc tệp này nên phải phụ thuộc vào lời giao việc bắt buộc đọc `AGENTS.md` + `.agents/roles/A<n>.md` và bước kiểm tra `git diff` sau mỗi vai của điều phối viên.
   - **Bẫy cú pháp Windows PowerShell:** Dễ lỗi nếu dùng heredoc (`<<`/`<<<`), không bọc nháy kép cho `--types "a,b"` hoặc `--to "@all"`, truyền JSON thô qua `--payload`, hoặc tạo tệp tạm `--spec-file` ngay trong thư mục repo làm bẩn `git status`.

---

## 6. Ghi chú cho A3 (các điểm bắt buộc phản ánh vào `.agents/roles/DIEU-PHOI.md`)

1. **Ghi rõ phiên bản đã khảo sát:** Mở đầu `DIEU-PHOI.md` ghi rõ cú pháp được xác minh trên **Orca `1.4.272`** và skill `orchestration` đi kèm; nếu nâng cấp Orca cần rà lại bằng `orca orchestration --help`.
2. **Dùng đúng cú pháp và cờ đã xác minh ở Mục 1 (không tự đoán cờ):**
   - Mọi lệnh cục bộ kèm `--environment local` (`run-create`, `task-create`, `task-list`, `worker-start`, `worker-list`).
   - Ghi nội dung spec dài vào tệp tạm nằm trong `$env:TEMP` (không đặt trong cây repo để giữ `git status` sạch) rồi truyền `--spec-file`; cấm dùng `<<` hoặc `<<<`.
   - Khi chạy `--worktree current`, **không** truyền các cờ tạo worktree (`--name`, `--repo`, `--base-branch`, `--display-name`, `--comment`, `--setup`).
   - Không truyền `--model` hay `--effort` trừ khi anh Hiếu yêu cầu đích danh (và nhớ `--effort` bắt buộc đi kèm `--model`).
   - Nếu `worker-start` lỗi (mã thoát khác 0): đọc `failedStage`, kiểm tra `worker-show`/`worker-list`/`request-show`, **không** tự chạy lại mù quáng.
3. **Cơ chế chờ và đọc tin nhắn chuẩn bản `1.4.272`:**
   - Sau mỗi lệnh `worker-start`, **kết thúc lượt** để Orca tự đánh thức khi có kết quả; **cấm** viết vòng lặp polling/watch bằng `check` thường.
   - Chỉ gọi `orca orchestration check --run <run_id> --json` khi thông báo đánh thức yêu cầu, hoặc dùng `check --wait --types "worker_done,question,escalation" --timeout-ms 600000 --json` (nhớ dấu nháy kép quanh `--types` trên PowerShell) nếu phiên Codex chạy trong terminal không tự đánh thức.
   - **Không** cần bước `--ack` riêng (lệnh `check` tiêu thụ trên `1.4.272` đã tự đánh dấu lô FIFO là đã xử lý).
   - Dùng `worker-read --dispatch <dispatch_id> --source auto` và `worker-show --dispatch <dispatch_id>` thay cho `orca terminal ...` (vì chat worker có thể không có terminal).
4. **Quy định rõ cách chạy và thu hồi kết quả cho A2/A4 (`--agent antigravity`):**
   - `claude` (A1, A5) và `codex` (A3, A5): dùng `--worktree current`, chạy tuần tự từng vai.
   - `antigravity` (A2, A4): ưu tiên thử `--worktree current` khi thử nghiệm thực tế; nếu Orca từ chối `current` cho `antigravity`, chuyển sang `--worktree new-child --base-branch <nhánh-hiện-tại> --name <tên-ngắn>` (bắt buộc có `--base-branch <nhánh-hiện-tại>`), sau khi nhận `worker_done` thì kiểm tra `git show --stat <sha>` đúng danh sách đóng rồi đưa về nhánh yêu cầu bằng `git cherry-pick <sha>` (nếu xung đột → `git cherry-pick --abort`, dừng báo anh Hiếu). Ghi rõ điều phối viên không tự viết mã/sửa tệp; chỉ được `git cherry-pick` nguyên commit không xung đột từ worktree con A2/A4.
   - Nếu `antigravity` tiếp tục lỗi khởi chạy hoặc gặp `429`, dừng tại bước A2/A4 và in sẵn câu mở phiên để anh Hiếu mở phiên Antigravity thủ công trong worktree hiện tại (phương án dự phòng theo `PLAN.md` mục 5).
5. **Quy định xử lý `permission prompt`, `lost`/`unverifiable`, `429` và `Nested worker depth`:**
   - Cấm bật `"Let coordinators approve worker permission prompts"` và cấm gọi `orca orchestration approve`.
   - Khi worker bị chặn ở hộp thoại xin quyền (`escalation` / `observation.agentWait`): nếu lệnh vi phạm quy tắc dự án → dùng `orca orchestration deny --dispatch <dispatch_id> --prompt <approval_id> --reason "<lý do>"` (hoặc dừng báo anh Hiếu); nếu lệnh hợp lệ → giữ nguyên worker (không `worker-stop`) và mời anh Hiếu bấm Allow/Deny trực tiếp trên Orca.
   - Khi nhận `escalation` có `stopReason: lost` hoặc `liveness: unverifiable`: dừng ngay, báo anh Hiếu, tuyệt đối không retry tạo worker thứ 2.
   - Khi gặp `429`, hết hạn mức hoặc `circuit_broken`: dừng ngay tại cổng dừng (c), báo anh Hiếu; không mở Run/Task mới để lách cầu dao.
   - Trong spec giao cho mỗi worker A1–A5: ngoài câu mở đầu bắt buộc (`Đọc .agents/roles/A<n>.md và AGENTS.md rồi làm việc sau: …`), ghi rõ cấm worker tự gọi `orca orchestration worker-start` (ngăn đẻ worker lồng nhau) và cấm tăng `Nested worker depth`.
6. **Đối chiếu đầy đủ các tiêu chí còn lại của `PLAN.md` bước A3-1, A3-2, A3-3:**
   - Đủ tất cả mục yêu cầu ở `PLAN.md` A3-1 (Bước 0–2, quy tắc chọn A5 khác công cụ tác giả qua dòng `Agent:` trong commit A3/A4, cổng dừng a/b/c, vòng sửa tối đa 2 vòng, điểm dừng trước thử nghiệm/gộp, mục Cấm).
   - Chép **nguyên văn từng ký tự** khối `## Quy tắc chung bắt buộc` từ `.agents/roles/A1.md` (dòng 14–22).
   - Ở bước A3-2, chỉ thêm đúng 2 dòng theo nguyên văn `PLAN.md` vào cuối mục `## Vai trò agent và phương án điều phối` của `AGENTS.md`, không sửa các dòng cũ.
   - Tự kiểm tra `git diff --stat main...HEAD` chỉ nằm trong danh sách đóng mục 2 `PLAN.md`; commit riêng cho A3-1 và A3-2 với dòng cuối `Agent: Codex/<mô hình>`, không `Co-Authored-By`.
