import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Camera, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { uploadEmployeePhoto } from '@/services/employees'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Employee } from '@/types/database'
import { DEFAULT_DEPARTMENTS } from '@/lib/departments'

const schema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  employee_id: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  department: z.string().optional(),
  job_title: z.string().optional(),
  contact_number: z.string().optional(),
  joining_date: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  notes: z.string().optional(),
  avatar_url: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const ADD_NEW = '__add_new__'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: FormData) => Promise<void>
  employee?: Employee | null
  departments?: string[]
}

const emptyValues: FormData = {
  full_name: '',
  employee_id: '',
  email: '',
  department: '',
  job_title: '',
  contact_number: '',
  joining_date: '',
  status: 'active',
  notes: '',
  avatar_url: '',
}

export function EmployeeFormDialog({ open, onClose, onSubmit, employee, departments = [] }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [addingDept, setAddingDept] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  const statusValue = watch('status')
  const departmentValue = watch('department')
  const avatarUrl = watch('avatar_url')

  // Known departments: defaults + those already used + the one being edited, deduped & sorted
  const departmentOptions = useMemo(() => {
    const set = new Set<string>([...DEFAULT_DEPARTMENTS, ...departments])
    if (employee?.department) set.add(employee.department)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [departments, employee])

  useEffect(() => {
    if (open) {
      setError(null)
      setAddingDept(false)
      if (employee) {
        reset({
          full_name: employee.full_name,
          employee_id: employee.employee_id || '',
          email: employee.email || '',
          department: employee.department || '',
          job_title: employee.job_title || '',
          contact_number: employee.contact_number || '',
          joining_date: employee.joining_date || '',
          status: employee.status,
          notes: employee.notes || '',
          avatar_url: employee.avatar_url || '',
        })
      } else {
        reset(emptyValues)
      }
    }
  }, [employee, open, reset])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const url = await uploadEmployeePhoto(file)
      setValue('avatar_url', url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    setError(null)
    try {
      await onSubmit(data as FormData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-4 rounded-xl border border-border-default bg-surface-secondary/40 p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              onClick={() => { if (!uploading) fileInputRef.current?.click() }}
              aria-label={avatarUrl ? 'Change photo' : 'Upload photo'}
              className="group relative h-20 w-20 shrink-0 rounded-full focus:outline-none"
            >
              {/* Clipped circle: image + overlays */}
              <div className="h-full w-full overflow-hidden rounded-full border-2 border-surface bg-surface-secondary shadow-sm ring-1 ring-border-default transition group-hover:ring-2 group-hover:ring-primary/40 group-focus-visible:ring-2 group-focus-visible:ring-primary">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Employee" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-text-muted">
                    <User className="h-9 w-9" strokeWidth={1.5} />
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                {/* Uploading overlay */}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
              </div>
              {/* Camera badge (outside the clipped circle so it isn't cut off) */}
              <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-text-inverse ring-2 ring-surface">
                <Camera className="h-3 w-3" />
              </span>
            </button>

            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">Profile Photo</p>
              <p className="mt-0.5 text-xs text-text-muted">JPG or PNG · up to 5&nbsp;MB</p>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                >
                  {uploading ? 'Uploading…' : avatarUrl ? 'Change' : 'Upload'}
                </button>
                {avatarUrl && !uploading && (
                  <>
                    <span className="h-3 w-px bg-border-default" />
                    <button
                      type="button"
                      onClick={() => setValue('avatar_url', '')}
                      className="text-xs font-medium text-danger hover:underline"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="col-span-2">
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Full Name *</label>
              <Input {...register('full_name')} placeholder="e.g. Ali Ahmed" />
              {errors.full_name && <p className="mt-1 text-xs text-danger">{errors.full_name.message}</p>}
            </div>

            {/* Employee ID */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Employee ID</label>
              <Input {...register('employee_id')} placeholder="e.g. EMP-001" />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Email</label>
              <Input type="email" {...register('email')} placeholder="name@company.com" />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Department</label>
              {addingDept ? (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    value={departmentValue || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue('department', e.target.value)}
                    placeholder="New department name"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setAddingDept(false); setValue('department', '') }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select
                  value={departmentValue || ''}
                  onValueChange={(val) => {
                    if (!val) return
                    if (val === ADD_NEW) {
                      setAddingDept(true)
                      setValue('department', '')
                    } else {
                      setValue('department', val)
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select department">
                      {departmentValue}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                    <SelectItem value={ADD_NEW} className="text-primary font-medium">
                      + Add new department
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Job Title */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Job Title</label>
              <Input {...register('job_title')} placeholder="e.g. Software Engineer" />
            </div>

            {/* Contact Number */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Contact Number</label>
              <Input {...register('contact_number')} placeholder="e.g. 0300-1234567" />
            </div>

            {/* Joining Date */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Joining Date</label>
              <Input type="date" {...register('joining_date')} />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Status *</label>
              <Select
                value={statusValue}
                onValueChange={(val) => { if (val) setValue('status', val as 'active' | 'inactive') }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {statusValue === 'active' ? 'Active' : 'Inactive'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Notes</label>
              <Textarea {...register('notes')} placeholder="Additional notes" rows={2} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-text-inverse hover:bg-primary-hover"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : employee ? 'Update' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
