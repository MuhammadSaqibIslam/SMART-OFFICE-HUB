// Shared department list used by both the Employees list filter and the
// Add/Edit Employee form. There is no departments table, so these common
// defaults are merged with any departments already present in the data.
export const DEFAULT_DEPARTMENTS = [
  'Administration',
  'Engineering',
  'Finance',
  'Human Resources',
  'IT',
  'Marketing',
  'Operations',
  'Sales',
  'Support',
]

/** Merge defaults with existing values, dedupe, and sort alphabetically. */
export function mergeDepartments(existing: (string | null | undefined)[]): string[] {
  const set = new Set<string>(DEFAULT_DEPARTMENTS)
  for (const d of existing) {
    if (d) set.add(d)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}
