import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { InventoryItem } from '@/types/database'
import { getErrorMessage } from '@/lib/errors'

interface Props {
  open: boolean
  onClose: () => void
  type: 'stock_in' | 'stock_out'
  item: InventoryItem | null
  onSubmit: (quantity: number, notes?: string) => Promise<void>
}

export function StockDialog({ open, onClose, type, item, onSubmit }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setQuantity(1)
      setNotes('')
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (quantity <= 0) {
      setError('Quantity must be greater than 0')
      return
    }

    if (type === 'stock_out' && item && quantity > item.quantity) {
      setError(`Cannot issue ${quantity}. Only ${item.quantity} ${item.unit} available.`)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(quantity, notes || undefined)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'An error occurred'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {type === 'stock_in' ? 'Stock In' : 'Stock Out'} — {item?.name}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-[13px] font-medium">Current Stock</Label>
            <p className="text-lg font-semibold tabular-nums text-text-primary">
              {item?.quantity} {item?.unit}
            </p>
          </div>

          <div>
            <Label className="mb-1.5 block text-[13px] font-medium">Quantity *</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-[13px] font-medium">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="Transaction notes"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={type === 'stock_in'
                ? 'bg-success text-white hover:bg-success/90'
                : 'bg-warning text-white hover:bg-warning/90'}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : type === 'stock_in' ? (
                'Receive Stock'
              ) : (
                'Issue Stock'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
