import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Employee } from '@/types/database'
import type { AssetWithAssignment } from '@/services/assets'
import { RETURN_CONDITIONS } from '@/lib/assetTypes'

interface Props {
  open: boolean
  onClose: () => void
  asset: AssetWithAssignment | null
  employees: Employee[]
  onAssign: (employeeId: string, employeeName: string, details: { assigned_date?: string; accessories?: string; notes?: string }) => Promise<void>
  onReturn: (assignmentId: string, details: { return_condition: string; notes?: string }) => Promise<void>
}

export function AssignDialog({ open, onClose, asset, employees, onAssign, onReturn }: Props) {
  const isAssigned = asset?.status === 'assigned' && !!asset.current_assignment
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Assign fields
  const [employeeId, setEmployeeId] = useState('')
  const [assignedDate, setAssignedDate] = useState('')
  const [accessories, setAccessories] = useState('')
  const [assignNotes, setAssignNotes] = useState('')

  // Return fields
  const [condition, setCondition] = useState('good')
  const [returnNotes, setReturnNotes] = useState('')

  useEffect(() => {
    if (open) {
      setError(null)
      setEmployeeId('')
      setAssignedDate(new Date().toISOString().slice(0, 10))
      setAccessories('')
      setAssignNotes('')
      setCondition('good')
      setReturnNotes('')
    }
  }, [open])

  const handleAssign = async () => {
    if (!employeeId) { setError('Please select an employee'); return }
    const emp = employees.find((e) => e.id === employeeId)
    setError(null)
    setSubmitting(true)
    try {
      await onAssign(employeeId, emp?.full_name || '', {
        assigned_date: assignedDate,
        accessories,
        notes: assignNotes,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign asset')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReturn = async () => {
    if (!asset?.current_assignment) return
    setError(null)
    setSubmitting(true)
    try {
      await onReturn(asset.current_assignment.id, { return_condition: condition, notes: returnNotes })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to return asset')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isAssigned ? 'Return Asset' : 'Assign Asset'}</DialogTitle>
          <DialogDescription>
            {asset?.name}{asset?.serial_number ? ` · ${asset.serial_number}` : ''}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
        )}

        {isAssigned ? (
          /* ---- RETURN ---- */
          <div className="space-y-4">
            <div className="rounded-lg bg-surface-secondary/50 px-3 py-2 text-sm">
              <span className="text-text-muted">Currently assigned to </span>
              <span className="font-medium text-text-primary">{asset?.current_assignment?.employee?.full_name || 'Unknown'}</span>
              {asset?.current_assignment?.assigned_date && (
                <span className="text-text-muted"> since {asset.current_assignment.assigned_date}</span>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Return Condition *</label>
              <Select value={condition} onValueChange={(v) => { if (v) setCondition(v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue>{RETURN_CONDITIONS.find((c) => c.value === condition)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {RETURN_CONDITIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Notes</label>
              <Textarea value={returnNotes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReturnNotes(e.target.value)} rows={2} placeholder="Any remarks on return" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleReturn} disabled={submitting} className="bg-primary text-text-inverse hover:bg-primary-hover">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark Returned'}
              </Button>
            </div>
          </div>
        ) : (
          /* ---- ASSIGN ---- */
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Assign To *</label>
              <Select value={employeeId} onValueChange={(v) => { if (v) setEmployeeId(v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select employee">
                    {employees.find((e) => e.id === employeeId)?.full_name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {employees.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-text-muted">No active employees</div>
                  ) : (
                    employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.full_name}{e.department ? ` · ${e.department}` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Assigned Date</label>
              <Input type="date" value={assignedDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignedDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Accessories</label>
              <Input value={accessories} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccessories(e.target.value)} placeholder="e.g. Charger, bag, mouse" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Notes</label>
              <Textarea value={assignNotes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAssignNotes(e.target.value)} rows={2} placeholder="Any remarks" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleAssign} disabled={submitting} className="bg-primary text-text-inverse hover:bg-primary-hover">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
