# SPEC: feat-profile-modal + feat-rank-preview
Version: 1.0.0 | Status: APPROVED | Date: 2026-06-04

## Summary
Click vào avatar mở ProfileModal — full stats, achievement log, và rank progression
preview để tạo aspiration. Feature rank preview nằm trong cùng modal này.

## Requirements

### REQ-PM1: Avatar click → ProfileModal
WHEN user clicks the avatar div in StatusHeader,
THE system SHALL open ProfileModal instead of triggering the file picker.

### REQ-PM2: ProfileModal content
ProfileModal SHALL display:
- Avatar image với rank frame matching current rank
- Player name, level badge, rank badge
- XP progress bar (current / needed, % hiển thị)
- Streak (ngày), Shields (n/2), Total quests completed
- Rank Progression section (tất cả 6 ranks)
- Achievement list (unlocked + locked, với date nếu unlocked)

### REQ-PM3: Change avatar từ bên trong ProfileModal
WHEN user clicks "Đổi avatar" button inside ProfileModal,
THE system SHALL close ProfileModal và trigger the file picker → crop modal flow.

### REQ-PM4: Rank Progression Preview
THE system SHALL show all 6 ranks (E / D / C / B / A / S) với:
- Frame preview (border color + glow matching StatusHeader RANK_FRAME style)
- Level range text (vd: "Lv 1–5", "Lv 51+")
- Title name (vd: Awakened, Hunter, Raider, Elite, Champion, Apex)
- Current rank highlighted (ring + bg)
- Future ranks hiển thị bình thường để gợi aspiration — không gray-out

### REQ-PM5: Close behavior
THE system SHALL close ProfileModal when:
- User clicks the X button
- User clicks the backdrop (div outside modal box)

### REQ-PM6: No external resources
ProfileModal SHALL NOT fetch external URLs. Avatar dùng data-URL từ IndexedDB.
Rank frames dùng CSS class (Tailwind) không phải images.

## Unwanted Patterns
- KHÔNG trigger file picker khi user click vào avatar nữa (click → ProfileModal)
- KHÔNG dùng alert() hay confirm()
- KHÔNG duplicate achievements state — nhận qua props từ App.tsx → StatusHeader → ProfileModal
- KHÔNG tạo thêm IndexedDB reads trong ProfileModal — avatar đã load từ App.tsx

## Data Flow
App.tsx (avatarUrl, achievements) → StatusHeader (thêm achievements prop) → ProfileModal

## Definition of Done
- [ ] Click avatar → ProfileModal mở (không mở file picker)
- [ ] "Đổi avatar" trong modal → close modal → trigger upload → crop flow
- [ ] Rank progression hiển thị 6 ranks, current highlighted
- [ ] Achievements hiển thị (unlocked + locked)
- [ ] Modal đóng khi click X hoặc backdrop
- [ ] ProfileModal.tsx < 400 lines (ENG-02)
- [ ] `npx tsc --noEmit` passes clean
