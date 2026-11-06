const DUPLICATE_MESSAGES: [string, string][] = [
  ['serial_number', 'An asset with this serial number already exists.'],
  ['employee_id', 'An employee with this ID already exists.'],
  ['request_number', 'A purchase request with this number already exists.'],
  ['inventory_categories', 'A category with this name already exists.'],
  ['sku', 'An item with this SKU already exists.'],
]

/**
 * Turns a thrown value into text for the user. Supabase query errors are plain
 * objects rather than Error instances, so known database codes are mapped here.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  const { code, message = '' } = (err ?? {}) as { code?: string; message?: string }

  if (code === '23505') {
    const match = DUPLICATE_MESSAGES.find(([key]) => message.includes(key))
    return match ? match[1] : 'This record already exists.'
  }
  if (code === '23503') {
    return message.includes('inventory_categories')
      ? 'This category is used by inventory items, so it cannot be deleted.'
      : 'This record is in use, so it cannot be changed or deleted.'
  }
  return err instanceof Error ? err.message : fallback
}
