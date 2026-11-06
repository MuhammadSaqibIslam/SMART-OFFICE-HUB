import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Eye,
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
import { PurchaseRequestFormDialog } from './components/PurchaseRequestFormDialog'
import { RequestDetailDialog } from './components/RequestDetailDialog'
import {
  getPurchaseRequests,
  createPurchaseRequest,
  updatePurchaseRequest,
  updateStatus,
  deletePurchaseRequest,
  PR_STATUSES,
  PR_STATUS_BADGE,
  type PurchaseRequestWithItems,
  type PRStatus,
} from '@/services/purchaseRequests'
import { getInventoryItems } from '@/services/inventory'
import type { InventoryItem } from '@/types/database'
import { EmptyPurchaseIllustration } from '@/components/shared/Illustrations'
import { getErrorMessage } from '@/lib/errors'

export function PurchaseRequestsPage() {
  const [requests, setRequests] = useState<PurchaseRequestWithItems[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editRequest, setEditRequest] = useState<PurchaseRequestWithItems | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRequest, setDetailRequest] = useState<PurchaseRequestWithItems | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PurchaseRequestWithItems | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setPageError(null)
    try {
      const [prData, invData] = await Promise.all([
        getPurchaseRequests({ search: debouncedSearch || undefined, status: statusFilter }),
        getInventoryItems(),
      ])
      setRequests(prData)
      setInventoryItems(invData)
    } catch (error) {
      console.error('Error fetching purchase requests:', error)
      setPageError('Failed to load purchase requests')
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAdd = () => { setEditRequest(null); setFormOpen(true) }
  const handleEdit = (r: PurchaseRequestWithItems) => { setEditRequest(r); setFormOpen(true) }
  const handleView = (r: PurchaseRequestWithItems) => { setDetailRequest(r); setDetailOpen(true) }

  const handleFormSubmit = async (data: Parameters<typeof createPurchaseRequest>[0]) => {
    if (editRequest) await updatePurchaseRequest(editRequest.id, data)
    else await createPurchaseRequest(data)
    fetchData()
  }

  const handleChangeStatus = async (status: PRStatus) => {
    if (!detailRequest) return
    await updateStatus(detailRequest.id, detailRequest.request_number, status)
    fetchData()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deletePurchaseRequest(deleteTarget.id, deleteTarget.request_number)
      fetchData()
      setDeleteOpen(false)
      setDeleteTarget(null)
    } catch (error) {
      console.error('Delete failed:', error)
      setDeleteError(getErrorMessage(error, 'Failed to delete. Please try again.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteClose = () => { setDeleteError(null); setDeleteOpen(false); setDeleteTarget(null) }

  const itemsSummary = (r: PurchaseRequestWithItems) => {
    const items = r.purchase_request_items || []
    if (items.length === 0) return '—'
    const first = items[0].item_name
    return items.length === 1 ? first : `${first} +${items.length - 1} more`
  }

  const totalQty = (r: PurchaseRequestWithItems) =>
    (r.purchase_request_items || []).reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="space-y-6 page-enter">
      {pageError && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{pageError}</div>
      )}

      {/* Filters + Add */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search by request number..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-text-muted hidden sm:inline">Status:</span>
          <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v) }}>
            <SelectTrigger className="w-36 sm:w-40">
              <SelectValue>{statusFilter === 'all' ? 'All Status' : PR_STATUSES.find((s) => s.value === statusFilter)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {PR_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <Button onClick={handleAdd} className="bg-primary text-text-inverse hover:bg-primary-hover gap-2">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Request</span><span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border-default bg-surface overflow-hidden table-enhanced">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center animate-fade-in-up">
            <EmptyPurchaseIllustration className="mx-auto mb-6 h-32 w-32 animate-float" />
            <p className="text-base font-medium text-text-secondary">No purchase requests found</p>
            <p className="mt-1 text-sm text-text-muted">Create your first purchase request</p>
            <Button onClick={handleAdd} className="mt-4 bg-primary text-text-inverse hover:bg-primary-hover gap-2">
              <Plus className="h-4 w-4" /> New Request
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead className="hidden md:table-cell">Items</TableHead>
                  <TableHead className="hidden lg:table-cell">Total Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id} className="hover:bg-surface-secondary/50 cursor-pointer" onClick={() => handleView(r)}>
                    <TableCell className="font-medium text-text-primary">{r.request_number || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-text-secondary">{itemsSummary(r)}</TableCell>
                    <TableCell className="hidden lg:table-cell tabular-nums text-text-secondary">{totalQty(r)}</TableCell>
                    <TableCell>
                      <Badge className={`border-0 ${PR_STATUS_BADGE[r.status]}`}>
                        {PR_STATUSES.find((s) => s.value === r.status)?.label || r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-text-muted">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger
                            onClick={() => handleView(r)}
                            className="rounded-md p-1.5 text-info hover:bg-info/10 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>View / Status</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            onClick={() => handleEdit(r)}
                            className="rounded-md p-1.5 text-text-secondary hover:bg-surface-secondary transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            onClick={() => { setDeleteTarget(r); setDeleteOpen(true) }}
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

      {/* Dialogs */}
      <PurchaseRequestFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        request={editRequest}
        inventoryItems={inventoryItems}
      />

      <RequestDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        request={detailRequest}
        onChangeStatus={handleChangeStatus}
      />

      <Dialog open={deleteOpen} onOpenChange={handleDeleteClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Purchase Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.request_number}</strong>? Its items will also be removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{deleteError}</div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleDeleteClose}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-danger text-white hover:bg-danger/90">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
