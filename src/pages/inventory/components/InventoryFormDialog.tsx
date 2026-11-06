import { useEffect, useState } from 'react'
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
import type { InventoryItem, InventoryCategory } from '@/types/database'
import { getErrorMessage } from '@/lib/errors'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  category_id: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, 'Quantity cannot be negative'),
  min_stock_threshold: z.coerce.number().min(0, 'Threshold cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  location: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: FormData) => Promise<void>
  item?: InventoryItem | null
  categories: InventoryCategory[]
}

export function InventoryFormDialog({ open, onClose, onSubmit, item, categories }: Props) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      category_id: '',
      description: '',
      quantity: 0,
      min_stock_threshold: 0,
      unit: 'pcs',
      location: '',
    },
  })

  const categoryValue = watch('category_id')
  const unitValue = watch('unit')

  useEffect(() => {
    if (open) {
      setError(null)
      if (item) {
        reset({
          name: item.name,
          category_id: item.category_id,
          description: item.description || '',
          quantity: item.quantity,
          min_stock_threshold: item.min_stock_threshold,
          unit: item.unit,
          location: item.location || '',
        })
      } else {
        reset({
          name: '',
          category_id: '',
          description: '',
          quantity: 0,
          min_stock_threshold: 0,
          unit: 'pcs',
          location: '',
        })
      }
    }
  }, [item, open, reset])

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    setError(null)
    try {
      await onSubmit(data as FormData)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save item'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Edit Inventory Item' : 'Add Inventory Item'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Name *</label>
              <Input {...register('name')} placeholder="Item name" />
              {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Category *</label>
              <Select
                value={categoryValue}
                onValueChange={(val) => { if (val) setValue('category_id', val) }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category">
                    {categories.find(c => c.id === categoryValue)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && <p className="mt-1 text-xs text-danger">{errors.category_id.message}</p>}
            </div>

            {/* Quantity */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Quantity *</label>
              <Input type="number" min={0} {...register('quantity')} />
              {errors.quantity && <p className="mt-1 text-xs text-danger">{errors.quantity.message}</p>}
            </div>

            {/* Min Stock */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Min Stock Threshold *</label>
              <Input type="number" min={0} {...register('min_stock_threshold')} />
              {errors.min_stock_threshold && <p className="mt-1 text-xs text-danger">{errors.min_stock_threshold.message}</p>}
            </div>

            {/* Unit */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Unit *</label>
              <Select
                value={unitValue}
                onValueChange={(val) => { if (val) setValue('unit', val) }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {{ pcs: 'Pieces', kg: 'Kilograms', liters: 'Liters', boxes: 'Boxes', packs: 'Packs', rolls: 'Rolls', reams: 'Reams' }[unitValue] || unitValue}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Pieces</SelectItem>
                  <SelectItem value="kg">Kilograms</SelectItem>
                  <SelectItem value="liters">Liters</SelectItem>
                  <SelectItem value="boxes">Boxes</SelectItem>
                  <SelectItem value="packs">Packs</SelectItem>
                  <SelectItem value="rolls">Rolls</SelectItem>
                  <SelectItem value="reams">Reams</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Location</label>
              <Input {...register('location')} placeholder="Storage location" />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Description</label>
              <Textarea {...register('description')} placeholder="Item description" rows={2} />
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
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : item ? 'Update' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
