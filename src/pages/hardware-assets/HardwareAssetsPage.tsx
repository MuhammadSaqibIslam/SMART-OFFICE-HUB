import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Monitor,
  UserPlus,
  Undo2,
  History,
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
import { AssetFormDialog } from './components/AssetFormDialog'
import { AssignDialog } from './components/AssignDialog'
import { AssetHistoryDialog } from './components/AssetHistoryDialog'
import {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  assignAsset,
  returnAsset,
  type AssetWithAssignment,
} from '@/services/assets'
import { getEmployees } from '@/services/employees'
import { mergeAssetTypes, ASSET_STATUSES } from '@/lib/assetTypes'
import type { Employee, HardwareAsset } from '@/types/database'

export function HardwareAssetsPage() {
  const [assets, setAssets] = useState<AssetWithAssignment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [allTypes, setAllTypes] = useState<string[]>([])

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [editAsset, setEditAsset] = useState<HardwareAsset | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignAssetTarget, setAssignAssetTarget] = useState<AssetWithAssignment | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyAsset, setHistoryAsset] = useState<HardwareAsset | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AssetWithAssignment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  // Debounce search
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
      const [assetsData, empData] = await Promise.all([
        getAssets({
          search: debouncedSearch || undefined,
          asset_type: typeFilter,
          status: statusFilter,
        }),
        getEmployees({ status: 'active' }),
      ])
      setAssets(assetsData)
      setEmployees(empData)
    } catch (error) {
      console.error('Error fetching assets:', error)
      setPageError('Failed to load hardware assets')
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, typeFilter, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  // Stable, full list of asset-type options for the filter
  useEffect(() => {
    getAssets()
      .then((all) => setAllTypes(all.map((a) => a.asset_type).filter(Boolean)))
      .catch(() => { /* non-fatal: defaults still show */ })
  }, [assets.length])

  const typeOptions = useMemo(() => mergeAssetTypes(allTypes), [allTypes])

  const handleAdd = () => { setEditAsset(null); setFormOpen(true) }
  const handleEdit = (asset: HardwareAsset) => { setEditAsset(asset); setFormOpen(true) }

  const handleFormSubmit = async (data: Parameters<typeof createAsset>[0]) => {
    if (editAsset) await updateAsset(editAsset.id, data)
    else await createAsset(data)
    fetchData()
  }

  const handleAssignOpen = (asset: AssetWithAssignment) => {
    setAssignAssetTarget(asset)
    setAssignOpen(true)
  }

  const handleAssign = async (
    employeeId: string,
    employeeName: string,
    details: { assigned_date?: string; accessories?: string; notes?: string }
  ) => {
    if (!assignAssetTarget) return
    await assignAsset(assignAssetTarget.id, assignAssetTarget.name, employeeId, employeeName, details)
    fetchData()
  }

  const handleReturn = async (assignmentId: string, details: { return_condition: string; notes?: string }) => {
    if (!assignAssetTarget) return
    await returnAsset(assignmentId, assignAssetTarget.id, assignAssetTarget.name, details)
    fetchData()
  }

  const handleHistory = (asset: HardwareAsset) => { setHistoryAsset(asset); setHistoryOpen(true) }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteAsset(deleteTarget.id, deleteTarget.name)
      fetchData()
      setDeleteOpen(false)
      setDeleteTarget(null)
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteClose = () => { setDeleteOpen(false); setDeleteTarget(null) }

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      available: 'bg-success/10 text-success',
      assigned: 'bg-warning/10 text-warning',
      under_maintenance: 'bg-info/10 text-info',
      missing: 'bg-danger/10 text-danger',
      retired: 'bg-text-muted/10 text-text-muted',
    }
    const label = ASSET_STATUSES.find((s) => s.value === status)?.label || status
    return <Badge className={`border-0 ${map[status] || 'bg-text-muted/10 text-text-muted'}`}>{label}</Badge>
  }

  return (
    <div className="space-y-6">
      {pageError && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{pageError}</div>
      )}

      {/* Filters + Add */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search name, serial, brand..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-text-muted">Type:</span>
          <Select value={typeFilter} onValueChange={(v) => { if (v) setTypeFilter(v) }}>
            <SelectTrigger className="w-40">
              <SelectValue>{typeFilter === 'all' ? 'All Types' : typeFilter}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {typeOptions.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-text-muted">Status:</span>
          <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v) }}>
            <SelectTrigger className="w-44">
              <SelectValue>{statusFilter === 'all' ? 'All Status' : ASSET_STATUSES.find((s) => s.value === statusFilter)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {ASSET_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <Button onClick={handleAdd} className="bg-primary text-text-inverse hover:bg-primary-hover gap-2">
            <Plus className="h-4 w-4" /> Add Asset
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border-default bg-surface overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : assets.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5">
              <Monitor className="h-10 w-10 text-primary/40" strokeWidth={1.5} />
            </div>
            <p className="text-base font-medium text-text-secondary">No hardware assets found</p>
            <p className="mt-1 text-sm text-text-muted">Get started by adding your first asset</p>
            <Button onClick={handleAdd} className="mt-4 bg-primary text-text-inverse hover:bg-primary-hover gap-2">
              <Plus className="h-4 w-4" /> Add Asset
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id} className="hover:bg-surface-secondary/50">
                    <TableCell className="font-medium text-text-primary">
                      {asset.name}
                      {(asset.brand || asset.model) && (
                        <span className="block text-xs text-text-muted">
                          {[asset.brand, asset.model].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-text-secondary">{asset.asset_type}</TableCell>
                    <TableCell className="text-text-muted">{asset.serial_number || '—'}</TableCell>
                    <TableCell>{getStatusBadge(asset.status)}</TableCell>
                    <TableCell className="text-text-secondary">
                      {asset.current_assignment?.employee?.full_name || '—'}
                    </TableCell>
                    <TableCell className="text-text-muted">{asset.location || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {asset.status === 'assigned' ? (
                          <Tooltip>
                            <TooltipTrigger
                              onClick={() => handleAssignOpen(asset)}
                              className="rounded-md p-1.5 text-warning hover:bg-warning/10 transition-colors"
                            >
                              <Undo2 className="h-4 w-4" />
                            </TooltipTrigger>
                            <TooltipContent>Return</TooltipContent>
                          </Tooltip>
                        ) : asset.status === 'available' ? (
                          <Tooltip>
                            <TooltipTrigger
                              onClick={() => handleAssignOpen(asset)}
                              className="rounded-md p-1.5 text-success hover:bg-success/10 transition-colors"
                            >
                              <UserPlus className="h-4 w-4" />
                            </TooltipTrigger>
                            <TooltipContent>Assign</TooltipContent>
                          </Tooltip>
                        ) : null}
                        <Tooltip>
                          <TooltipTrigger
                            onClick={() => handleHistory(asset)}
                            className="rounded-md p-1.5 text-info hover:bg-info/10 transition-colors"
                          >
                            <History className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>History</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            onClick={() => handleEdit(asset)}
                            className="rounded-md p-1.5 text-text-secondary hover:bg-surface-secondary transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            onClick={() => { setDeleteTarget(asset); setDeleteOpen(true) }}
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
      <AssetFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        asset={editAsset}
        assetTypes={typeOptions}
      />

      <AssignDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        asset={assignAssetTarget}
        employees={employees}
        onAssign={handleAssign}
        onReturn={handleReturn}
      />

      <AssetHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        asset={historyAsset}
      />

      <Dialog open={deleteOpen} onOpenChange={handleDeleteClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? Its assignment and history will also be removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
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
