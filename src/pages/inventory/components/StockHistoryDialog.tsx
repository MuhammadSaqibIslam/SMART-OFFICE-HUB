import { useEffect, useState } from 'react'
import { Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getStockHistory } from '@/services/inventory'
import type { InventoryItem, InventoryTransaction } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  item: InventoryItem | null
}

export function StockHistoryDialog({ open, onClose, item }: Props) {
  const [history, setHistory] = useState<InventoryTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && item) {
      setIsLoading(true)
      getStockHistory(item.id)
        .then(setHistory)
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [open, item])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Stock History — {item?.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">No stock history yet</p>
        ) : (
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {tx.type === 'stock_in' ? (
                        <Badge className="bg-success/10 text-success border-0 gap-1">
                          <ArrowUpRight className="h-3 w-3" /> In
                        </Badge>
                      ) : (
                        <Badge className="bg-warning/10 text-warning border-0 gap-1">
                          <ArrowDownRight className="h-3 w-3" /> Out
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{tx.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums text-text-muted">{tx.previous_stock}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{tx.updated_stock}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-text-secondary">{tx.notes || '—'}</TableCell>
                    <TableCell className="text-text-muted whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
