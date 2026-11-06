import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Sparkles, Loader2, MessageSquare, Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { AIConversation } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

interface ChatSidebarProps {
  conversations: AIConversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
  onRename: (id: string, title: string) => void
  isOpen: boolean
  onClose: () => void
}

export function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onBulkDelete,
  onRename,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<AIConversation | null>(null)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const selectAllRef = useRef<HTMLInputElement>(null)
  const allSelected = conversations.length > 0 && selected.length === conversations.length
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = selected.length > 0 && !allSelected
  }, [selected.length, allSelected])

  const toggleOne = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try { await onDelete(deleteTarget.id); setDeleteTarget(null) } finally { setBusy(false) }
  }

  const handleBulkDelete = async () => {
    setBusy(true)
    try { await onBulkDelete(selected); setSelected([]); setBulkOpen(false) } finally { setBusy(false) }
  }

  const startRename = (conv: AIConversation) => {
    setRenameId(conv.id)
    setRenameValue(conv.title)
    setTimeout(() => renameInputRef.current?.focus(), 50)
  }

  const confirmRename = () => {
    if (renameId && renameValue.trim()) {
      onRename(renameId, renameValue.trim())
    }
    setRenameId(null)
  }

  const cancelRename = () => {
    setRenameId(null)
  }

  const relTime = (iso: string) => {
    try { return formatDistanceToNow(new Date(iso), { addSuffix: true }) } catch { return '' }
  }

  const content = (
    <div className="flex h-full flex-col bg-surface-secondary/30">
      {/* New Chat button */}
      <div className="p-3 border-b border-border-default">
        <button
          onClick={() => { onNew(); onClose() }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* Selection bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-2 border-b border-border-default px-3 py-2 bg-primary/5">
          <input ref={selectAllRef} type="checkbox" checked={allSelected}
            onChange={() => setSelected(allSelected ? [] : conversations.map((c) => c.id))}
            className="h-3.5 w-3.5 cursor-pointer accent-primary" />
          <span className="text-xs font-medium text-text-primary">{selected.length} selected</span>
          <button onClick={() => setSelected([])} className="ml-auto text-xs text-text-muted hover:text-text-primary">Cancel</button>
          <button onClick={() => setBulkOpen(true)} className="text-xs font-medium text-danger hover:text-danger/80">Delete</button>
        </div>
      )}

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary">
              <Sparkles className="h-6 w-6 text-text-muted/50" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">No conversations yet</p>
              <p className="text-xs text-text-muted mt-0.5">Start by asking a question</p>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
                  activeId === conv.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {selected.length > 0 && (
                  <input type="checkbox" checked={selected.includes(conv.id)}
                    onChange={() => toggleOne(conv.id)} onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-primary" />
                )}
                <MessageSquare className="h-4 w-4 shrink-0 opacity-50" />
                {renameId === conv.id ? (
                  <div className="flex flex-1 items-center gap-1 min-w-0">
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') cancelRename() }}
                      className="flex-1 min-w-0 rounded-md border border-border-default bg-background px-2 py-1 text-sm text-text-primary outline-none focus:border-primary"
                    />
                    <button onClick={confirmRename} className="shrink-0 rounded p-1 text-success hover:bg-success/10"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={cancelRename} className="shrink-0 rounded p-1 text-text-muted hover:bg-surface-secondary"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => { onSelect(conv.id); onClose() }} className="flex-1 min-w-0 text-left">
                      <p className="truncate text-sm">{conv.title}</p>
                      <p className="text-[11px] text-text-muted mt-0.5">{relTime(conv.updated_at)}</p>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); startRename(conv) }}
                      className="shrink-0 rounded-lg p-1.5 text-text-muted opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(conv) }}
                      className="shrink-0 rounded-lg p-1.5 text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-danger/10 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Select toggle */}
      {conversations.length > 1 && selected.length === 0 && (
        <div className="border-t border-border-default px-3 py-2.5">
          <button
            onClick={() => setSelected(conversations.map((c) => c.id))}
            className="w-full text-xs text-text-muted hover:text-text-primary text-center transition-colors"
          >
            Select all conversations
          </button>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>Delete "<strong>{deleteTarget?.title}</strong>"? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onClick={handleDelete} disabled={busy} className="bg-danger text-white hover:bg-danger/90">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Selected</DialogTitle>
            <DialogDescription>Delete <strong>{selected.length}</strong> conversation{selected.length !== 1 && 's'}? This cannot be undone.</DialogDescription>
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

  return (
    <>
      {isOpen && <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40 md:hidden" aria-hidden="true" />}
      <aside className={`fixed left-0 top-0 z-50 h-full w-72 border-r border-border-default bg-surface transition-transform duration-200 md:relative md:translate-x-0 md:z-auto md:shrink-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {content}
      </aside>
    </>
  )
}
