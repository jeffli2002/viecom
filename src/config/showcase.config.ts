export type ShowcaseCategory = {
  id: string;
  label: string;
};

export const SHOWCASE_CATEGORIES: ShowcaseCategory[] = [
  { id: 'fashion', label: 'Fashion & Apparel' },
  { id: 'beauty', label: 'Beauty & Cosmetics' },
  { id: 'home', label: 'Home & Living' },
  { id: 'tech', label: 'Electronics & Gadgets' },
  { id: 'food', label: 'Food & Beverage' },
  { id: 'accessories', label: 'Accessories & Jewelry' },
  { id: 'sports', label: 'Sports & Outdoors' },
  { id: 'other', label: 'Other Highlights' },
];

export const LANDING_SHOWCASE_LIMIT = 12;

export function getShowcaseCategoryLabel(categoryId?: string | null): string {
  if (!categoryId) {
    return 'Showcase';
  }
  const match = SHOWCASE_CATEGORIES.find((category) => category.id === categoryId);
  return match?.label ?? 'Showcase';
}
