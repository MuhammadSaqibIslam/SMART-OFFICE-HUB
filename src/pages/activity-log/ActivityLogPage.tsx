import { useEffect, useState, useCallback, useRef } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Search,
  Loader2,
  Package,
  Users,
  Monitor,
  ShoppingCart,
  Activity,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { getActivityLogs, deleteActivityLog, deleteActivityLogs, ENTITY_TYPES, type ActivityLogRow } from '@/services/activityLog'
import { EmptyActivityIllustration } from '@/components/shared/Illustrations'

const PAGE_SIZE = 50

const entityIcon: Record<string, typeof Package> = {
  inventory_item: Package,
  employee: Users,
  hardware_asset: Monitor,
  purchase_request: ShoppingCart,
}

const entityColor: Record<string, string> = {
  inventory_item: 'text-info bg-info/10',
  employee: 'text-success bg-success/10',
  hardware_asset: 'text-warning bg-warning/10',
  purchase_request: 'text-primary bg-primary/10',
}

export function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogRow[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [pageError, setPageError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<ActivityLogRow | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setDebouncedSearch(search); setLimit(PAGE_SIZE) }, 300)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setPageError(null)
    try {
      const { logs: data, total: count } = await getActivityLogs({
        search: debouncedSearch || undefined,
        entity_type: entityFilter,
        limit,
      })
      setLogs(data)
      setTotal(count)
      setSelected((prev) => prev.filter((id) => data.some((l) => l.id === id)))
    } catch (error) {
      console.error('Error fetching activity logs:', error)
      setPageError('Failed to load activity log')
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, entityFilter, limit])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteActivityLog(deleteTarget.id)
      setDeleteTarget(null)
      fetchData()
    } catch (error) {
      console.error('Delete failed:', error)
      setDeleteTarget(null)
      setPageError(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const allSelected = logs.length > 0 && selected.length === logs.length
  const toggleAll = () => setSelected(allSelected ? [] : logs.map((l) => l.id))
  const clearSelection = () => setSelected([])

  // Show the header checkbox as indeterminate (–) when only some rows are selected
  const selectAllRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = selected.length > 0 && !allSelected
  }, [selected.length, allSelected])

  const handleBulkDelete = async () => {
    setBusy(true)
    try {
      await deleteActivityLogs(selected)
      setBulkOpen(false)
      setSelected([])
      fetchData()
    } catch (error) {
      console.error('Bulk delete failed:', error)
      setBulkOpen(false)
      setPageError(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  const exactTime = (iso: string) => {
    try { return format(new Date(iso), 'd MMM yyyy, h:mm a') } catch { return new Date(iso).toLocaleString() }
  }
  const relTime = (iso: string) => {
    try { return formatDistanceToNow(new Date(iso), { addSuffix: true }) } catch { return '' }
  }

  return (
    <div className="space-y-6 page-enter">
      {pageError && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{pageError}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search activity..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-text-muted hidden sm:inline">Module:</span>
          <Select value={entityFilter} onValueChange={(v) => { if (v) { setEntityFilter(v); setLimit(PAGE_SIZE) } }}>
            <SelectTrigger className="w-40 sm:w-48">
              <SelectValue>{entityFilter === 'all' ? 'All Modules' : ENTITY_TYPES.find((t) => t.value === entityFilter)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {ENTITY_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        {!isLoading && (
          <span className="ml-auto text-[13px] text-text-muted">{total} {total === 1 ? 'entry' : 'entries'}</span>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-border-default bg-surface">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center animate-fade-in-up">
            <EmptyActivityIllustration className="mx-auto mb-6 h-32 w-32 animate-float" />
            <p className="text-base font-medium text-text-secondary">No activity yet</p>
            <p className="mt-1 text-sm text-text-muted">Actions across the app will appear here</p>
          </div>
        ) : (
          <>
            {/* Selection toolbar */}
            <div className="flex items-center gap-3 border-b border-border-default px-4 py-2.5">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 cursor-pointer rounded border-border-default accent-primary"
                aria-label="Select all"
              />
              {selected.length > 0 ? (
                <>
                  <span className="text-[13px] sm:text-sm font-medium text-text-primary">{selected.length} selected</span>
                  <button
                    onClick={clearSelection}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[13px] text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary"
                  >
                    <X className="h-3.5 w-3.5" /> Deselect all
                  </button>
                  <button
                    onClick={() => setBulkOpen(true)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-danger/10 px-2.5 py-1 text-[13px] font-medium text-danger transition-colors hover:bg-danger/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete selected ({selected.length})
                  </button>
                </>
              ) : (
                <span className="text-[13px] text-text-muted">Select all</span>
              )}
            </div>
            <div className="divide-y divide-border-default">
              {logs.map((log) => {
                const Icon = entityIcon[log.entity_type || ''] || Activity
                const color = entityColor[log.entity_type || ''] || 'text-text-muted bg-text-muted/10'
                return (
                  <div key={log.id} className={`group flex items-start gap-3 px-4 py-3 hover:bg-surface-secondary/40 ${selected.includes(log.id) ? 'bg-primary/5' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selected.includes(log.id)}
                      onChange={() => toggleOne(log.id)}
                      className="mt-1.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border-default accent-primary"
                      aria-label="Select entry"
                    />
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color}`}>
                      <Icon className="h-4 w-4" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary">{log.description}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.performer_name || 'Unknown user'}
                        </span>
                        <span title={relTime(log.created_at)}>{exactTime(log.created_at)}</span>
                        {log.entity_type && (
                          <Badge className="border-0 bg-surface-secondary text-xs text-text-muted">
                            {ENTITY_TYPES.find((t) => t.value === log.entity_type)?.label || log.entity_type.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger
                        onClick={() => setDeleteTarget(log)}
                        className="rounded-md p-1.5 text-text-muted opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger focus:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent>Delete entry</TooltipContent>
                    </Tooltip>
                  </div>
                )
              })}
            </div>
            {logs.length < total && (
              <div className="flex justify-center border-t border-border-default py-3">
                <Button variant="outline" onClick={() => setLimit((l) => l + PAGE_SIZE)}>Load more</Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete single */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
            <DialogDescription>Remove this activity log entry? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onClick={handleDelete} disabled={busy} className="bg-danger text-white hover:bg-danger/90">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk delete selected */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Selected</DialogTitle>
            <DialogDescription>
              Delete <strong>{selected.length}</strong> selected {selected.length === 1 ? 'entry' : 'entries'}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkDelete} disabled={busy} className="bg-danger text-white hover:bg-danger/90">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
