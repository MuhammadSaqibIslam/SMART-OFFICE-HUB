// Shared asset-type list for the Hardware Assets filter and form.
// There is no asset_types table, so these common defaults are merged
// with any types already present in the data.
export const DEFAULT_ASSET_TYPES = [
  'Laptop',
  'Desktop',
  'Monitor',
  'Keyboard',
  'Mouse',
  'Printer',
  'Scanner',
  'Phone',
  'Tablet',
  'Server',
  'Router',
  'Projector',
  'UPS',
  'Headset',
]

/** Merge defaults with existing values, dedupe, and sort alphabetically. */
export function mergeAssetTypes(existing: (string | null | undefined)[]): string[] {
  const set = new Set<string>(DEFAULT_ASSET_TYPES)
  for (const t of existing) {
    if (t) set.add(t)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

export const ASSET_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'under_maintenance', label: 'Under Maintenance' },
  { value: 'missing', label: 'Missing' },
  { value: 'retired', label: 'Retired' },
] as const

export const RETURN_CONDITIONS = [
  { value: 'good', label: 'Good' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'needs_repair', label: 'Needs Repair' },
  { value: 'incomplete', label: 'Incomplete' },
] as const
