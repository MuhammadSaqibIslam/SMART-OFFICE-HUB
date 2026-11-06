import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import type { HardwareAsset } from '@/types/database'
import type { AssetInput } from '@/services/assets'
import { DEFAULT_ASSET_TYPES, ASSET_STATUSES } from '@/lib/assetTypes'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  asset_type: z.string().min(1, 'Asset type is required'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_cost: z.string().optional(),
  warranty_expiry: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['available', 'under_maintenance', 'missing', 'retired']),
  description: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const ADD_NEW = '__add_new__'

// Statuses that can be set manually (assigned is driven by the assign/return flow)
const MANUAL_STATUSES = ASSET_STATUSES.filter((s) => s.value !== 'assigned')

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: AssetInput) => Promise<void>
  asset?: HardwareAsset | null
  assetTypes?: string[]
}

const emptyValues: FormData = {
  name: '',
  asset_type: '',
  brand: '',
  model: '',
  serial_number: '',
  purchase_date: '',
  purchase_cost: '',
  warranty_expiry: '',
  location: '',
  status: 'available',
  description: '',
  notes: '',
}

export function AssetFormDialog({ open, onClose, onSubmit, asset, assetTypes = [] }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [addingType, setAddingType] = useState(false)

  const isAssigned = asset?.status === 'assigned'

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

  const typeValue = watch('asset_type')
  const statusValue = watch('status')

  const typeOptions = useMemo(() => {
    const set = new Set<string>([...DEFAULT_ASSET_TYPES, ...assetTypes])
    if (asset?.asset_type) set.add(asset.asset_type)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [assetTypes, asset])

  useEffect(() => {
    if (open) {
      setError(null)
      setAddingType(false)
      if (asset) {
        reset({
          name: asset.name,
          asset_type: asset.asset_type,
          brand: asset.brand || '',
          model: asset.model || '',
          serial_number: asset.serial_number || '',
          purchase_date: asset.purchase_date || '',
          purchase_cost: asset.purchase_cost != null ? String(asset.purchase_cost) : '',
          warranty_expiry: asset.warranty_expiry || '',
          location: asset.location || '',
          status: isAssigned ? 'available' : (asset.status as FormData['status']),
          description: asset.description || '',
          notes: asset.notes || '',
        })
      } else {
        reset(emptyValues)
      }
    }
  }, [asset, open, reset, isAssigned])

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    setError(null)
    const d = data as FormData
    const input: AssetInput = {
      name: d.name,
      asset_type: d.asset_type,
      brand: d.brand || null,
      model: d.model || null,
      serial_number: d.serial_number || null,
      purchase_date: d.purchase_date || null,
      purchase_cost: d.purchase_cost ? Number(d.purchase_cost) : null,
      warranty_expiry: d.warranty_expiry || null,
      location: d.location || null,
      // Keep 'assigned' status untouched when editing an assigned asset
      status: isAssigned ? 'assigned' : d.status,
      description: d.description || null,
      notes: d.notes || null,
    }
    try {
      await onSubmit(input)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save asset')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{asset ? 'Edit Hardware Asset' : 'Add Hardware Asset'}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex max-h-[70vh] flex-col">
          <div className="flex-1 overflow-y-auto px-1 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Name *</label>
              <Input {...register('name')} placeholder="e.g. Dell Latitude 5420" />
              {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
            </div>

            {/* Asset Type */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Asset Type *</label>
              {addingType ? (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    value={typeValue || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue('asset_type', e.target.value)}
                    placeholder="New asset type"
                  />
                  <Button type="button" variant="outline" onClick={() => { setAddingType(false); setValue('asset_type', '') }}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select
                  value={typeValue || ''}
                  onValueChange={(val) => {
                    if (!val) return
                    if (val === ADD_NEW) { setAddingType(true); setValue('asset_type', '') }
                    else setValue('asset_type', val)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type">{typeValue}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                    <SelectItem value={ADD_NEW} className="text-primary font-medium">+ Add new type</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {errors.asset_type && <p className="mt-1 text-xs text-danger">{errors.asset_type.message}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Status</label>
              {isAssigned ? (
                <div className="flex h-9 items-center rounded-md border border-border-default bg-surface-secondary/50 px-3 text-sm text-text-muted">
                  Assigned — return it to change status
                </div>
              ) : (
                <Select value={statusValue} onValueChange={(val) => { if (val) setValue('status', val as FormData['status']) }}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{MANUAL_STATUSES.find((s) => s.value === statusValue)?.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MANUAL_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Brand */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Brand</label>
              <Input {...register('brand')} placeholder="e.g. Dell" />
            </div>

            {/* Model */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Model</label>
              <Input {...register('model')} placeholder="e.g. Latitude 5420" />
            </div>

            {/* Serial Number */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Serial Number</label>
              <Input {...register('serial_number')} placeholder="e.g. SN-123456" />
            </div>

            {/* Location */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Location</label>
              <Input {...register('location')} placeholder="e.g. Floor 2, Room A" />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Purchase Date</label>
              <Input type="date" {...register('purchase_date')} />
            </div>

            {/* Purchase Cost */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Purchase Cost</label>
              <Input type="number" min={0} step="0.01" {...register('purchase_cost')} placeholder="0.00" />
            </div>

            {/* Warranty Expiry */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Warranty Expiry</label>
              <Input type="date" {...register('warranty_expiry')} />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Description</label>
              <Textarea {...register('description')} placeholder="Short description" rows={2} />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Notes</label>
              <Textarea {...register('notes')} placeholder="Additional notes" rows={2} />
            </div>
          </div>
          </div>

          <div className="mt-3 flex shrink-0 justify-end gap-2 border-t border-border-default pt-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary text-text-inverse hover:bg-primary-hover">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : asset ? 'Update' : 'Add Asset'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
