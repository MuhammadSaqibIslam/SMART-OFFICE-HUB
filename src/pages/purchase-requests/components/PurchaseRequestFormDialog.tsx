import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { InventoryItem } from '@/types/database'
import type { PRInput, PurchaseRequestWithItems } from '@/services/purchaseRequests'
import { getErrorMessage } from '@/lib/errors'

interface Row {
  item_id: string | null
  item_name: string
  quantity: number
}

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: PRInput) => Promise<void>
  request?: PurchaseRequestWithItems | null
  inventoryItems: InventoryItem[]
}

const emptyRow = (): Row => ({ item_id: null, item_name: '', quantity: 1 })

export function PurchaseRequestFormDialog({ open, onClose, onSubmit, request, inventoryItems }: Props) {
  const [requestNumber, setRequestNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<Row[]>([emptyRow()])
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setError(null)
      setOpenIdx(null)
      if (request) {
        setRequestNumber(request.request_number || '')
        setNotes(request.notes || '')
        const items = request.purchase_request_items || []
        setRows(items.length ? items.map((i) => ({ item_id: i.item_id, item_name: i.item_name, quantity: i.quantity })) : [emptyRow()])
      } else {
        setRequestNumber('')
        setNotes('')
        setRows([emptyRow()])
      }
    }
  }, [open, request])

  const updateRow = (idx: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const addRow = () => setRows((prev) => [...prev, emptyRow()])
  const removeRow = (idx: number) => setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)))

  // Inventory suggestions matching what's typed (empty query shows all)
  const suggestionsFor = (query: string) => {
    const q = query.trim().toLowerCase()
    const list = q ? inventoryItems.filter((i) => i.name.toLowerCase().includes(q)) : inventoryItems
    return list.slice(0, 8)
  }

  const pickInventory = (idx: number, inv: InventoryItem) => {
    updateRow(idx, { item_id: inv.id, item_name: inv.name })
    setOpenIdx(null)
  }

  const handleSubmit = async () => {
    const valid = rows.filter((r) => r.item_name.trim() && r.quantity > 0)
    if (valid.length === 0) {
      setError('Add at least one item with a name and quantity')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        request_number: requestNumber.trim() || null,
        notes: notes.trim() || null,
        items: valid.map((r) => ({ item_id: r.item_id, item_name: r.item_name.trim(), quantity: r.quantity })),
      })
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save purchase request'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{request ? 'Edit Purchase Request' : 'New Purchase Request'}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
        )}

        <div className="flex max-h-[70vh] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-1 py-1">
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Request Number</label>
              <Input
                value={requestNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRequestNumber(e.target.value)}
                placeholder="Auto-generated if left blank (e.g. PR-0001)"
              />
            </div>

            {/* Line items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[13px] sm:text-sm font-medium text-text-primary">Items *</label>
                <Button type="button" variant="outline" onClick={addRow} className="h-8 gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </Button>
              </div>
              <p className="mb-2 text-xs text-text-muted">Type an item name, or pick one from inventory as you type.</p>

              <div className="space-y-2">
                <div className="hidden grid-cols-[1fr_80px_36px] gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-text-muted sm:grid">
                  <span>Item</span>
                  <span>Qty</span>
                  <span></span>
                </div>
                {rows.map((row, idx) => {
                  const suggestions = suggestionsFor(row.item_name)
                  return (
                    <div key={idx} className="grid grid-cols-[1fr_70px_32px] sm:grid-cols-[1fr_80px_36px] items-start gap-2">
                      {/* Combobox */}
                      <div className="relative">
                        <Input
                          value={row.item_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { updateRow(idx, { item_name: e.target.value, item_id: null }); setOpenIdx(idx) }}
                          onFocus={() => setOpenIdx(idx)}
                          onBlur={() => setTimeout(() => setOpenIdx((cur) => (cur === idx ? null : cur)), 150)}
                          placeholder="Type or pick an item"
                        />
                        {row.item_id && (
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                            <Package className="h-3.5 w-3.5 text-success" />
                          </span>
                        )}
                        {openIdx === idx && suggestions.length > 0 && (
                          <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border-default bg-surface py-1 shadow-lg">
                            {suggestions.map((inv) => (
                              <button
                                key={inv.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => pickInventory(idx, inv)}
                                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-surface-secondary"
                              >
                                <span className="truncate text-text-primary">{inv.name}</span>
                                <span className="shrink-0 text-xs text-text-muted">{inv.quantity} {inv.unit}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(idx, { quantity: Number(e.target.value) })}
                      />
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        disabled={rows.length === 1}
                        className="flex h-9 w-9 items-center justify-center rounded-md text-danger hover:bg-danger/10 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Notes</label>
              <Textarea value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} rows={2} placeholder="Reason / remarks for this request" />
            </div>
          </div>

          <div className="mt-3 flex shrink-0 justify-end gap-2 border-t border-border-default pt-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-primary text-text-inverse hover:bg-primary-hover">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : request ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
