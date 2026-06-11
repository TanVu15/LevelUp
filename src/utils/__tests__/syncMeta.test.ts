import { describe, it, expect } from 'vitest';
import { decideCloudAction } from '../syncMeta';

describe('decideCloudAction', () => {
  it('apply khi local chưa từng thay đổi (máy mới login)', () => {
    expect(decideCloudAction(1750000000000, 0)).toBe('apply');
    expect(decideCloudAction(undefined, 0)).toBe('apply');
  });

  it('apply khi cloud mới hơn hoặc bằng local (returning user, sync bình thường)', () => {
    expect(decideCloudAction(2000, 1000)).toBe('apply');
    expect(decideCloudAction(1000, 1000)).toBe('apply');
  });

  it('conflict khi local mới hơn cloud (phiên trước chưa kịp sync)', () => {
    expect(decideCloudAction(1000, 2000)).toBe('conflict');
  });

  it('conflict khi cloud legacy thiếu updatedAt nhưng local đã có thay đổi', () => {
    expect(decideCloudAction(undefined, 1)).toBe('conflict');
  });
});
