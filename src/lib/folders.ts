export const FAMILY_FOLDERS = [
  { id: 'my_vault', label: 'My Vault' },
  { id: 'father', label: "Father's Documents" },
  { id: 'spouse', label: 'Spouse' },
  { id: 'kids', label: 'Kids' },
] as const

export type FamilyFolderId = (typeof FAMILY_FOLDERS)[number]['id']

export function folderLabel(id: string): string {
  return FAMILY_FOLDERS.find((item) => item.id === id)?.label ?? id
}

export function isFamilyFolderId(value: string): value is FamilyFolderId {
  return FAMILY_FOLDERS.some((item) => item.id === value)
}
