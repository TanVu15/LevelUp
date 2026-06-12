import { ExpenseCategory } from '../types';

// Nhãn hiển thị tiếng Việt cho category — MỘT nguồn duy nhất (feat-ui-language-a11y).
// Giá trị LƯU (Transaction.category) giữ nguyên tiếng Anh: đổi sẽ vỡ data cũ
// và các logic so sánh ('Unnecessary Leaks' trong achievement/isLeak styling).

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Gym & Nutrition',
  'Work & Gear',
  'Books & Growth',
  'Rent & Utilities',
  'Unnecessary Leaks',
];

export const CATEGORY_LABELS: Record<ExpenseCategory | 'Income Source', string> = {
  'Gym & Nutrition':   'Gym & Dinh dưỡng',
  'Work & Gear':       'Công việc & Thiết bị',
  'Books & Growth':    'Sách & Phát triển',
  'Rent & Utilities':  'Nhà ở & Sinh hoạt',
  'Unnecessary Leaks': 'Chi tiêu tùy ý (rò rỉ)',
  'Income Source':     'Nguồn thu nhập',
};

export function getCategoryLabel(cat: ExpenseCategory | 'Income Source'): string {
  return CATEGORY_LABELS[cat] ?? cat;
}
