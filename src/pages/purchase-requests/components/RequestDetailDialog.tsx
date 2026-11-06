import { useState } from 'react'
import { Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  NEXT_STATUSES,
  PR_STATUSES,
  PR_STATUS_BADGE,
  type PRStatus,
  type PurchaseRequestWithItems,
} from '@/services/purchaseRequests'
import { getErrorMessage } from '@/lib/errors'

interface Props {
  open: boolean
  onClose: () => void
  request: PurchaseRequestWithItems | null
  onChangeStatus: (status: PRStatus) => Promise<void>
}

export function RequestDetailDialog({ open, onClose, request, onChangeStatus }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!request) return null
  const status = request.status as PRStatus
  const nexts = NEXT_STATUSES[status] || []
  const items = request.purchase_request_items || []
  const label = (s: string) => PR_STATUSES.find((x) => x.value === s)?.label || s

  const handle = async (s: PRStatus) => {
    setBusy(s)
    setError(null)
    try {
      await onChangeStatus(s)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update status'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {request.request_number || 'Purchase Request'}
            <Badge className={`border-0 ${PR_STATUS_BADGE[status]}`}>{label(status)}</Badge>
          </DialogTitle>
          <DialogDescription>
            Created {new Date(request.created_at).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
        )}

        {/* Items */}
        <div className="rounded-lg border border-border-default">
          <div className="grid grid-cols-[1fr_70px] gap-2 border-b border-border-default px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
            <span>Item</span>
            <span className="text-right">Qty</span>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-text-muted">No items</p>
            ) : (
              items.map((it) => (
                <div key={it.id} className="grid grid-cols-[1fr_70px] gap-2 px-3 py-2 text-sm">
                  <span className="text-text-primary">{it.item_name}</span>
                  <span className="text-right tabular-nums text-text-secondary">{it.quantity}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {request.notes && (
          <div className="text-sm">
            <span className="text-text-muted">Notes: </span>
            <span className="text-text-secondary">{request.notes}</span>
          </div>
        )}

        {/* Status actions */}
        <div className="border-t border-border-default pt-3">
          {nexts.length === 0 ? (
            <p className="text-sm text-text-muted">No further status changes available.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-text-muted">Move to:</span>
              {nexts.map((s) => (
                <Button
                  key={s}
                  onClick={() => handle(s)}
                  disabled={!!busy}
                  variant="outline"
                  className="gap-1"
                >
                  {busy === s ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {label(s)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
