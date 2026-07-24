import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProductSearchSelect } from '../../components/ProductSearchSelect'
import { cargoShipmentsApi } from '../../api/cargo-shipments.api'
import { inventoryApi } from '../../api/inventory.api'

const schema = z.object({
  shipmentNumber: z.string().min(1, 'Raqam kiritish shart'),
  dateSent: z.string(),
  cargoFeeKrw: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    productName: z.string(),
    imageUrl: z.string().optional(),
    availableQty: z.coerce.number().optional(),
    quantity: z.coerce.number().min(1),
    buyPriceKrw: z.coerce.number().min(0),
  })).min(1, 'Kamida 1 ta mahsulot kerak')
})

export interface CargoFormProps {
  mode: 'create' | 'edit'
  initialData?: any
  onSuccess: () => void
  onCancel: () => void
}

export function CargoForm({ mode, initialData, onSuccess, onCancel }: CargoFormProps) {
  const qc = useQueryClient()
  
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      shipmentNumber: initialData.shipmentNumber,
      dateSent: initialData.dateSent ? new Date(initialData.dateSent).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      cargoFeeKrw: initialData.cargoFeeKrw,
      notes: initialData.notes || '',
      items: initialData.items?.map((i: any) => ({
        productId: i.productId,
        productName: i.productName,
        imageUrl: i.imageUrl || '',
        availableQty: i.availableQty || 0,
        quantity: i.quantity,
        buyPriceKrw: i.buyPriceKrw,
      })) || []
    } : {
      dateSent: new Date().toISOString().slice(0, 16),
      items: []
    }
  })
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const createMutation = useMutation({
    mutationFn: cargoShipmentsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cargo-shipments'] })
      toast.success("Kargo qo'shildi")
      onSuccess()
    },
    onError: (err: any) => toast.error(err.message || 'Xatolik yuz berdi')
  })

  const updateMutation = useMutation({
    mutationFn: cargoShipmentsApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cargo-shipments'] })
      toast.success("Kargo yangilandi")
      onSuccess()
    },
    onError: (err: any) => toast.error(err.message || 'Xatolik yuz berdi')
  })

  const onSubmit = (d: any) => {
    const payload = { ...d, dateSent: new Date(d.dateSent).toISOString() }
    if (mode === 'create') {
      createMutation.mutate(payload)
    } else {
      updateMutation.mutate({ id: initialData.id, ...payload })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Jo'natma raqami</Label>
          <Input {...register('shipmentNumber')} />
        </div>
        <div className="space-y-1">
          <Label>Sana</Label>
          <Input type="datetime-local" {...register('dateSent')} />
        </div>
        <div className="space-y-1">
          <Label>Kargo narxi (₩)</Label>
          <Input type="number" {...register('cargoFeeKrw')} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Izoh</Label>
        <Input {...register('notes')} />
      </div>

      <div>
        <Label>Mahsulot qo'shish</Label>
        <div className="mb-4">
          <ProductSearchSelect
            placeholder="Mahsulot tanlang..."
            selectedIds={fields.map((f: any) => f.productId)}
            onSelect={async (product: any) => {
              if (fields.find((f: any) => f.productId === product.id)) return

              append({ 
                productId: product.id, 
                productName: product.name, 
                imageUrl: product.imageUrls?.[0] ?? '',
                quantity: 1, 
                buyPriceKrw: Number(product.avgCostKrw) || Number(product.retailPrice) || 0,
                availableQty: Number(product.availableQty) || 0,
              })
            }}
          />
        </div>

        <div className="space-y-2 border rounded-md p-4 bg-muted/20">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg">
              {field.imageUrl ? (
                <img
                  src={field.imageUrl as string}
                  alt={field.productName}
                  className="w-10 h-10 rounded-md object-cover border flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{field.productName}</p>
                <Input type="hidden" {...register(`items.${index}.productId`)} />
                <Input type="hidden" {...register(`items.${index}.productName`)} />
                <Input type="hidden" {...register(`items.${index}.imageUrl`)} />
                <Input type="hidden" {...register(`items.${index}.availableQty`)} />
                {field.availableQty !== undefined && Number(field.availableQty) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Mavjud: {String(field.availableQty)} ta</p>
                )}
              </div>
              <div className="w-24">
                <Label className="text-xs">Soni</Label>
                <Input type="number" {...register(`items.${index}.quantity`)} />
              </div>
              <div className="w-32">
                <Label className="text-xs">Olish (₩)</Label>
                <Input type="number" {...register(`items.${index}.buyPriceKrw`)} />
              </div>
              <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {fields.length === 0 && <p className="text-sm text-muted-foreground text-center">Mahsulot qo'shilmagan</p>}
          {errors.items && <p className="text-red-500 text-sm mt-1">{errors.items.message as string}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Bekor qilish</Button>
        <Button type="submit" disabled={isPending}>Saqlash</Button>
      </div>
    </form>
  )
}
