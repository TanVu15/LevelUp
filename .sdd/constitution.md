# PROJECT CONSTITUTION
# Version: 1.0.0 | Owner: @tanvu15 | Status: LOCKED
# Áp dụng cho: Mọi AI agent, mọi developer, mọi PR

## LAYER 1 — Hard Rules (không được vi phạm)

### SEC-01: No External Data
THE system SHALL NOT fetch data từ external URLs (ảnh, API, CDN).
Tất cả assets phải được render nội bộ (CSS gradient, SVG inline, lucide-react icons).

### SEC-02: No PII Storage
THE system SHALL NOT lưu Personally Identifiable Information.
localStorage chỉ chứa game state (level, quests, transactions) — không có tên thật, email, location.

### SEC-03: No IP Violations
THE system SHALL NOT sử dụng tên, nhân vật, địa điểm, hoặc concepts thuộc bản quyền Solo Leveling.
Mapping cứng: xem AGENTS.md § BUSINESS LOGIC.

### DATA-01: localStorage Schema
THE system SHALL maintain backwards-compatible localStorage keys.
Key prefix: `ironwill_` — không đổi key tên khi upgrade.

## LAYER 1.5 — Process Rules (không được bỏ qua, không có exception)

### PROC-01: Spec Before Code
WHEN implementing bất kỳ feature mới hoặc bug fix nào ảnh hưởng > 1 file,
THE agent SHALL tạo mới hoặc cập nhật file `.sdd/specs/feat-{name}/SPEC.md` TRƯỚC KHI viết bất kỳ implementation code nào.
Exception duy nhất: single-file typo / one-line fix không thay đổi behavior.

PROC-01 vi phạm nếu:
- Agent mở Edit/Write vào src/ mà chưa mở hoặc tạo SPEC.md tương ứng
- SPEC không cover unwanted patterns của thay đổi
- Bug fix không update SPEC để phản ánh edge case mới phát hiện

---

## LAYER 2 — Architectural Constraints (cần approved exception)

### ARCH-01: No Backend Calls
Components SHALL NOT gọi fetch() hoặc XMLHttpRequest đến external endpoints.
Exception: nếu có backend được thêm sau, phải có RFC + human approval.

### ARCH-02: State Source of Truth
App.tsx SHALL là single source of truth cho PlayerState.
Components SHALL nhận state qua props, không tự đọc localStorage.

### ARCH-03: Tailwind v4 Only
THE system SHALL dùng Tailwind v4 syntax (không dùng v3 class variants như `dark:`, JIT-only utilities).
Kiểm tra Tailwind v4 docs trước khi dùng class mới.

## LAYER 3 — Engineering Standards

### ENG-01: TypeScript Strict
Không dùng `any` type. Mọi function phải có return type rõ ràng.
Exception: React event handlers (inferred).

### ENG-02: Component Size
Mỗi component file < 400 lines. Nếu vượt → tách sub-component.

### ENG-03: Sound Effects Optional
Web Audio API calls phải wrapped trong try/catch.
App không được crash nếu browser block audio.

## AI AGENT SELF-CHECK PROTOCOL

Trước khi submit bất kỳ code nào, Claude chạy checklist:

CHECKLIST PROC (chạy ĐẦU TIÊN — trước khi mở bất kỳ src/ file nào để edit):
  [ ] Đã tạo hoặc cập nhật .sdd/specs/feat-{name}/SPEC.md
  [ ] SPEC có đủ: Requirements (SHALL), Unwanted Patterns, DoD
  [ ] Nếu là bug fix: SPEC đã ghi nhận edge case mới + unwanted pattern tương ứng

CHECKLIST SEC:
  [ ] Không có external URL trong code (fetch, img src, etc.)
  [ ] Không có hardcoded PII hoặc secrets
  [ ] Không có Solo Leveling IP references

CHECKLIST ARCH:
  [ ] State changes đi qua App.tsx callbacks
  [ ] Không trực tiếp đọc localStorage trong child components
  [ ] Tailwind classes là v4-compatible

CHECKLIST ENG:
  [ ] Không có `any` type
  [ ] Audio calls có try/catch
  [ ] Component < 400 lines

CONSTITUTION SELF-CHECK REPORT FORMAT:
=== SELF-CHECK ===
Process (PROC-01):    ✅ PASS / ❌ VIOLATION: [spec file missing or not updated]
Layer 1 (Hard Rules): ✅ PASS / ❌ VIOLATION: [details]
Layer 2 (Arch):       ✅ PASS / ⚠ EXCEPTION NEEDED: [details]
Layer 3 (Standards):  ✅ PASS / ⚠ DEVIATION: [reason]
=================
