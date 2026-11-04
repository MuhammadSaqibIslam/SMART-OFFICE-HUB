import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { InventoryFormDialog } from './components/InventoryFormDialog'
import { StockDialog } from './components/StockDialog'
import { StockHistoryDialog } from './components/StockHistoryDialog'
import {
  getInventoryItems,
  getCategories,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  stockIn,
  stockOut,
} from '@/services/inventory'
import type { InventoryItem, InventoryCategory } from '@/types/database'

type StockStatus = 'all' | 'low' | 'in_stock' | 'out_of_stock'

export function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState<StockStatus>('all')

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [stockType, setStockType] = useState<'stock_in' | 'stock_out'>('stock_in')
  const [stockItem, setStockItem] = useState<InventoryItem | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [search])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setPageError(null)
    try {
      const [itemsData, catsData] = await Promise.all([
        getInventoryItems({
          search: debouncedSearch || undefined,
          category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
          stock_status: stockFilter,
        }),
        getCategories(),
      ])
      setItems(itemsData)
      setCategories(catsData)
    } catch (error) {
      console.error('Error fetching inventory:', error)
      setPageError('Failed to load inventory data')
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, categoryFilter, stockFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAdd = () => {
    setEditItem(null)
    setFormOpen(true)
  }

  const handleEdit = (item: InventoryItem) => {
    setEditItem(item)
    setFormOpen(true)
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (editItem) {
      await updateInventoryItem(editItem.id, data as Parameters<typeof updateInventoryItem>[1])
    } else {
      await createInventoryItem(data as Parameters<typeof createInventoryItem>[0])
    }
    fetchData()
  }

  const handleStockIn = (item: InventoryItem) => {
    setStockItem(item)
    setStockType('stock_in')
    setStockDialogOpen(true)
  }

  const handleStockOut = (item: InventoryItem) => {
    setStockItem(item)
    setStockType('stock_out')
    setStockDialogOpen(true)
  }

  const handleStockSubmit = async (quantity: number, notes?: string) => {
    if (!stockItem) return
    if (stockType === 'stock_in') {
      await stockIn(stockItem.id, quantity, notes)
    } else {
      await stockOut(stockItem.id, quantity, notes)
    }
    fetchData()
  }

  const handleHistory = (item: InventoryItem) => {
    setHistoryItem(item)
    setHistoryOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteInventoryItem(deleteTarget.id, deleteTarget.name)
      fetchData()
      setDeleteOpen(false)
      setDeleteTarget(null)
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteClose = () => {
    setDeleteOpen(false)
    setDeleteTarget(null)
  }

  const getStockBadge = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return <Badge className="bg-danger/10 text-danger border-0">Out of Stock</Badge>
    }
    if (item.quantity <= item.min_stock_threshold) {
      return <Badge className="bg-warning/10 text-warning border-0 gap-1"><AlertTriangle className="h-3 w-3" /> Low Stock</Badge>
    }
    return <Badge className="bg-success/10 text-success border-0">In Stock</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleAdd}
          className="bg-primary text-text-inverse hover:bg-primary-hover gap-2"
        >
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {/* Error */}
      {pageError && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{pageError}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search by item name..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-text-muted">Category:</span>
          <Select value={categoryFilter} onValueChange={(v) => { if (v) setCategoryFilter(v) }}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-text-muted">Stock:</span>
          <Select value={stockFilter} onValueChange={(v) => { if (v) setStockFilter(v as StockStatus) }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border-default bg-surface overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5">
              <Package className="h-10 w-10 text-primary/40" strokeWidth={1.5} />
            </div>
            <p className="text-base font-medium text-text-secondary">No inventory items found</p>
            <p className="mt-1 text-sm text-text-muted">Get started by adding your first inventory item</p>
            <Button
              onClick={handleAdd}
              className="mt-4 bg-primary text-text-inverse hover:bg-primary-hover gap-2"
            >
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id} className="hover:bg-surface-secondary/50">
                    <TableCell className="font-medium text-text-primary">{item.name}</TableCell>
                    <TableCell className="text-text-secondary">{item.category?.name || '—'}</TableCell>
                    <TableCell className="tabular-nums font-medium">{item.quantity} {item.unit}</TableCell>
                    <TableCell className="tabular-nums text-text-muted">{item.min_stock_threshold}</TableCell>
                    <TableCell>{getStockBadge(item)}</TableCell>
                    <TableCell className="text-text-muted">{item.location || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger
                            onClick={() => handleStockIn(item)}
                            className="rounded-md p-1.5 text-success hover:bg-success/10 transition-colors"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>Stock In</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            onClick={() => handleStockOut(item)}
                            className="rounded-md p-1.5 text-warning hover:bg-warning/10 transition-colors"
                          >
                            <ArrowDownRight className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>Stock Out</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            onClick={() => handleHistory(item)}
                            className="rounded-md p-1.5 text-info hover:bg-info/10 transition-colors"
                          >
                            <History className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>Stock History</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            onClick={() => handleEdit(item)}
                            className="rounded-md p-1.5 text-text-secondary hover:bg-surface-secondary transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            onClick={() => { setDeleteTarget(item); setDeleteOpen(true) }}
                            className="rounded-md p-1.5 text-danger hover:bg-danger/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <InventoryFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        item={editItem}
        categories={categories}
      />

      {/* Stock In/Out Dialog */}
      <StockDialog
        open={stockDialogOpen}
        onClose={() => setStockDialogOpen(false)}
        type={stockType}
        item={stockItem}
        onSubmit={handleStockSubmit}
      />

      {/* Stock History Dialog */}
      <StockHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        item={historyItem}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={handleDeleteClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleDeleteClose}>Cancel</Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-danger text-white hover:bg-danger/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
