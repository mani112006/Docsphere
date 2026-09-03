export const CATEGORIES = [
  { id: 'aadhaar', label: 'Aadhaar Card' },
  { id: 'pan', label: 'PAN Card' },
  { id: 'ration', label: 'Ration Card' },
  { id: 'driving_licence', label: 'Driving Licence' },
  { id: 'voter_id', label: 'Voter ID' },
  { id: 'passport', label: 'Passport' },
  { id: 'education', label: 'Education Certificates' },
  { id: 'atm_card', label: 'ATM / Credit Card' },
  { id: 'bank', label: 'Bank Documents' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'medical', label: 'Medical Documents' },
  { id: 'other', label: 'Other Documents' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id)

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id
}

export function isCategoryId(value: string): value is CategoryId {
  return CATEGORY_IDS.includes(value as CategoryId)
}
