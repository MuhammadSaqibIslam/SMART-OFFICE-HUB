import { useEffect, useState } from 'react'
import { Loader2, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { getAssetHistory } from '@/services/assets'
import type { HardwareAsset, AssetHistory } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  asset: HardwareAsset | null
}

const actionStyle: Record<string, string> = {
  created: 'bg-info/10 text-info',
  updated: 'bg-text-muted/10 text-text-muted',
  assigned: 'bg-warning/10 text-warning',
  returned: 'bg-success/10 text-success',
}

export function AssetHistoryDialog({ open, onClose, asset }: Props) {
  const [history, setHistory] = useState<AssetHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && asset) {
      setIsLoading(true)
      getAssetHistory(asset.id)
        .then(setHistory)
        .catch(() => setHistory([]))
        .finally(() => setIsLoading(false))
    }
  }, [open, asset])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Asset History</DialogTitle>
          <DialogDescription>{asset?.name}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="py-10 text-center text-sm text-text-muted">No history yet</div>
        ) : (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {history.map((h) => (
              <div key={h.id} className="flex gap-3 rounded-lg border border-border-default bg-surface p-3">
                <div className="mt-0.5">
                  <Clock className="h-4 w-4 text-text-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={`border-0 capitalize ${actionStyle[h.action] || 'bg-text-muted/10 text-text-muted'}`}>
                      {h.action}
                    </Badge>
                    <span className="text-xs text-text-muted">
                      {new Date(h.created_at).toLocaleString()}
                    </span>
                  </div>
                  {h.details && <p className="mt-1 text-sm text-text-secondary">{h.details}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
