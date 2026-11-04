import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Users,
  User,
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
import { EmployeeFormDialog } from './components/EmployeeFormDialog'
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '@/services/employees'
import { mergeDepartments } from '@/lib/departments'
import type { Employee } from '@/types/database'

type StatusFilter = 'all' | 'active' | 'inactive'

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  // Departments for the filter (derived from loaded data)
  const [allDepartments, setAllDepartments] = useState<string[]>([])

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
      const data = await getEmployees({
        search: debouncedSearch || undefined,
        department: departmentFilter,
        status: statusFilter,
      })
      setEmployees(data)
    } catch (error) {
      console.error('Error fetching employees:', error)
      setPageError('Failed to load employees')
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, departmentFilter, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Keep a stable, full list of department options (not affected by active filters)
  useEffect(() => {
    getEmployees()
      .then((all) => setAllDepartments(all.map((e) => e.department).filter((d): d is string => !!d)))
      .catch(() => { /* non-fatal: defaults still show */ })
  }, [employees.length])

  // Common defaults + any departments already in the data (so the filter is never empty)
  const departmentOptions = useMemo(() => mergeDepartments(allDepartments), [allDepartments])

  const handleAdd = () => {
    setEditEmployee(null)
    setFormOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setEditEmployee(employee)
    setFormOpen(true)
  }

  const handleFormSubmit = async (data: Parameters<typeof createEmployee>[0]) => {
    if (editEmployee) {
      await updateEmployee(editEmployee.id, data)
    } else {
      await createEmployee(data)
    }
    fetchData()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteEmployee(deleteTarget.id, deleteTarget.full_name)
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

  const getStatusBadge = (status: Employee['status']) => {
    if (status === 'active') {
      return <Badge className="bg-success/10 text-success border-0">Active</Badge>
    }
    return <Badge className="bg-text-muted/10 text-text-muted border-0">Inactive</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Error */}
      {pageError && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{pageError}</div>
      )}

      {/* Filters + Add Button */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search by name, ID or email..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-text-muted">Department:</span>
          <Select value={departmentFilter} onValueChange={(v) => { if (v) setDepartmentFilter(v) }}>
            <SelectTrigger className="w-44">
              <SelectValue>
                {departmentFilter === 'all' ? 'All Departments' : departmentFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departmentOptions.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-text-muted">Status:</span>
          <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v as StatusFilter) }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <Button
            onClick={handleAdd}
            className="bg-primary text-text-inverse hover:bg-primary-hover gap-2"
          >
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border-default bg-surface overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : employees.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5">
              <Users className="h-10 w-10 text-primary/40" strokeWidth={1.5} />
            </div>
            <p className="text-base font-medium text-text-secondary">No employees found</p>
            <p className="mt-1 text-sm text-text-muted">Get started by adding your first employee</p>
            <Button
              onClick={handleAdd}
              className="mt-4 bg-primary text-text-inverse hover:bg-primary-hover gap-2"
            >
              <Plus className="h-4 w-4" /> Add Employee
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-surface-secondary/50">
                    <TableCell className="font-medium text-text-primary">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border-default bg-surface-secondary">
                          {emp.avatar_url ? (
                            <img src={emp.avatar_url} alt={emp.full_name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-text-muted">
                              <User className="h-4 w-4" strokeWidth={1.5} />
                            </div>
                          )}
                        </div>
                        <div>
                          {emp.full_name}
                          {emp.email && (
                            <span className="block text-xs text-text-muted">{emp.email}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-text-secondary">{emp.employee_id || '—'}</TableCell>
                    <TableCell className="text-text-secondary">{emp.department || '—'}</TableCell>
                    <TableCell className="text-text-secondary">{emp.job_title || '—'}</TableCell>
                    <TableCell className="text-text-muted">{emp.contact_number || '—'}</TableCell>
                    <TableCell>{getStatusBadge(emp.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger
                            onClick={() => handleEdit(emp)}
                            className="rounded-md p-1.5 text-text-secondary hover:bg-surface-secondary transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            onClick={() => { setDeleteTarget(emp); setDeleteOpen(true) }}
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
      <EmployeeFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        employee={editEmployee}
        departments={departmentOptions}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={handleDeleteClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.full_name}</strong>? This action cannot be undone.
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
