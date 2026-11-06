/**
 * Builds a Supabase `.or()` filter that searches several columns. The term is
 * quoted so commas, brackets and quotes in user input stay part of the value.
 */
export function ilikeAny(columns: string[], term: string): string {
  const escaped = term.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return columns.map((column) => `${column}.ilike."%${escaped}%"`).join(',')
}
