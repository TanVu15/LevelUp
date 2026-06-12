// Sync metadata — quyết định conflict khi login (feat-sync-hardening).
// decideCloudAction là PURE (unit-test được); 2 helper còn lại chỉ đọc/ghi localStorage.

export const LOCAL_UPDATED_AT_KEY = 'ironwill_updated_at';

/** Epoch ms của lần thay đổi dữ liệu local gần nhất; 0 nếu chưa từng có thay đổi. */
export function readLocalUpdatedAt(): number {
  const raw = localStorage.getItem(LOCAL_UPDATED_AT_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function touchLocalUpdatedAt(now: number = Date.now()): void {
  localStorage.setItem(LOCAL_UPDATED_AT_KEY, String(now));
}

/**
 * Khi login và cloud doc tồn tại:
 * - 'conflict' ⇔ local có thay đổi MỚI HƠN cloud (localUpdatedAt > cloudUpdatedAt).
 *   Cloud legacy chưa có stamp coi như 0 → local từng thay đổi thì hỏi (an toàn hơn ghi đè im lặng).
 * - 'apply'    ⇔ ngược lại (cloud mới hơn/bằng, hoặc local chưa từng thay đổi).
 */
export function decideCloudAction(
  cloudUpdatedAt: number | undefined,
  localUpdatedAt: number,
): 'apply' | 'conflict' {
  return localUpdatedAt > (cloudUpdatedAt ?? 0) ? 'conflict' : 'apply';
}
