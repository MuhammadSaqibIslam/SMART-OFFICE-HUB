import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { InventoryItem } from '@/types/database'
import type { PRInput, PurchaseRequestWithItems } from '@/services/purchaseRequests'

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

const CUSTOM = '__custom__'

export function PurchaseRequestFormDialog({ open, onClose, onSubmit, request, inventoryItems }: Props) {
  const [requestNumber, setRequestNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<Row[]>([emptyRow()])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setError(null)
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

  const handlePickInventory = (idx: number, value: string) => {
    if (value === CUSTOM) {
      updateRow(idx, { item_id: null })
      return
    }
    const inv = inventoryItems.find((i) => i.id === value)
    if (inv) updateRow(idx, { item_id: inv.id, item_name: inv.name })
  }

  const addRow = () => setRows((prev) => [...prev, emptyRow()])
  const removeRow = (idx: number) => setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)))

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
      setError(err instanceof Error ? err.message : 'Failed to save purchase request')
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
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Request Number</label>
              <Input
                value={requestNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRequestNumber(e.target.value)}
                placeholder="Auto-generated if left blank (e.g. PR-0001)"
              />
            </div>

            {/* Line items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[13px] font-medium text-text-primary">Items *</label>
                <Button type="button" variant="outline" onClick={addRow} className="h-8 gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {/* header */}
                <div className="hidden grid-cols-[1fr_1.4fr_80px_36px] gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-text-muted sm:grid">
                  <span>From Inventory</span>
                  <span>Item Name</span>
                  <span>Qty</span>
                  <span></span>
                </div>
                {rows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1.4fr_80px_36px] items-center gap-2">
                    <Select
                      value={row.item_id || CUSTOM}
                      onValueChange={(v) => { if (v) handlePickInventory(idx, v) }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {row.item_id ? inventoryItems.find((i) => i.id === row.item_id)?.name || 'Inventory' : 'Custom'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CUSTOM}>Custom item</SelectItem>
                        {inventoryItems.map((i) => (
                          <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={row.item_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(idx, { item_name: e.target.value, item_id: null })}
                      placeholder="Item name"
                    />
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
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Notes</label>
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
