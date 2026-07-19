import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Plus, Search, Trash2, Eye, CheckCircle2, Truck, PackageCheck } from 'lucide-react'
import { toast } from 'sonner'
import { cargoShipmentsApi } from '../../api/cargo-shipments.api'
import { productsApi } from '../../api/products.api'
import { formatDate } from '../../utils/date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  shipmentNumber: z.string().min(1, 'Raqam kiritish shart'),
  dateSent: z.string(),
  cargoFeeKrw: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    productName: z.string(),
    quantity: z.coerce.number().min(1),
    buyPriceKrw: z.coerce.number().min(0),
    sellPriceUzs: z.coerce.number().min(0),
  })).min(1, 'Kamida 1 ta mahsulot kerak')
})

export default function CargoShipmentsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  
  const { data: shipmentsData, isLoading } = useQuery({
    queryKey: ['cargo-shipments', filter],
    queryFn: () => cargoShipmentsApi.getAll({ status: filter || undefined }),
  })
  
  const shipments = (shipmentsData as any)?.data ?? []

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      dateSent: new Date().toISOString().split('T')[0],
      items: []
    }
  })
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const [productSearch, setProductSearch] = useState('')
  const { data: productsData } = useQuery({
    queryKey: ['products', productSearch],
    queryFn: () => productsApi.list({ q: productSearch }),
    enabled: productSearch.length > 1
  })
  const products = (productsData as any)?.items ?? []

  const createMutation = useMutation({
    mutationFn: cargoShipmentsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cargo-shipments'] })
      toast.success("Kargo qo'shildi")
      setShowForm(false)
      reset()
    },
    onError: (err: any) => toast.error(err.message || 'Xatolik yuz berdi')
  })

  const markArrivedMutation = useMutation({
    mutationFn: cargoShipmentsApi.markArrived,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cargo-shipments'] })
      toast.success("Kargo yetib keldi")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: cargoShipmentsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cargo-shipments'] })
      toast.success("Kargo o'chirildi")
    }
  })

  const sentCount = shipments?.filter((s: any) => s.status === 'SENT').length ?? 0
  const arrivedCount = shipments?.filter((s: any) => s.status === 'ARRIVED').length ?? 0
  const totalCount = shipments?.length ?? 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6" /> Kargo jo'natmalar
        </h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Yangi kargo
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Yo'lda */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg shrink-0">
            <Truck className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-yellow-600">Yo'lda</p>
            <p className="text-lg font-bold text-yellow-700">
              {sentCount} ta
            </p>
          </div>
        </div>

        {/* Yetib keldi */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg shrink-0">
            <PackageCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-green-600">Yetib keldi</p>
            <p className="text-lg font-bold text-green-700">
              {arrivedCount} ta
            </p>
          </div>
        </div>

        {/* Jami mahsulotlar */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg shrink-0">
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-purple-600">Jami jo'natmalar</p>
            <p className="text-lg font-bold text-purple-700">
              {totalCount} ta
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === '' ? 'default' : 'outline'} onClick={() => setFilter('')}>Barcha</Button>
        <Button variant={filter === 'SENT' ? 'default' : 'outline'} onClick={() => setFilter('SENT')}>Yo'lda</Button>
        <Button variant={filter === 'ARRIVED' ? 'default' : 'outline'} onClick={() => setFilter('ARRIVED')}>Yetdi</Button>
      </div>

      <div className="border rounded-md overflow-hidden bg-background">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Raqam</th>
              <th className="p-3">Sana</th>
              <th className="p-3">Status</th>
              <th className="p-3">Mahsulotlar</th>
              <th className="p-3">Kargo Narxi</th>
              <th className="p-3">Amal</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="p-4 text-center">Yuklanmoqda...</td></tr>
            ) : shipments.length === 0 ? (
              <tr><td colSpan={7} className="p-4 text-center">Ma'lumot topilmadi</td></tr>
            ) : (
              shipments.map((s: any, idx: number) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3 font-medium">{s.shipmentNumber}</td>
                  <td className="p-3">{formatDate(s.dateSent)}</td>
                  <td className="p-3">
                    {s.status === 'SENT' ? (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">🟡 Yo'lda</span>
                    ) : s.status === 'ARRIVED' ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">🟢 Yetib keldi</span>
                    ) : (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">🔴 Bekor</span>
                    )}
                  </td>
                  <td className="p-3">{s.itemCount} ta</td>
                  <td className="p-3">₩{s.totalCostKrw?.toLocaleString()}</td>
                  <td className="p-3 flex gap-2">
                    {s.status === 'SENT' && (
                      <Button variant="outline" size="sm" onClick={() => {
                        if (confirm(`Kargo #${s.shipmentNumber} yetib kelganligini tasdiqlaysizmi? Barcha mahsulotlar UZB omboriga o'tkaziladi.`)) {
                          markArrivedMutation.mutate(s.id)
                        }
                      }}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Yetdi ✓
                      </Button>
                    )}
                    {s.status === 'SENT' && (
                      <Button variant="destructive" size="sm" onClick={() => {
                        if (confirm('Ochirishni xohlaysizmi?')) deleteMutation.mutate(s.id)
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Yangi kargo</h2>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-6">
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
                <div className="flex gap-2 mb-4 relative">
                  <Input 
                    placeholder="Mahsulot qidirish..." 
                    value={productSearch} 
                    onChange={e => setProductSearch(e.target.value)} 
                  />
                  {productSearch.length > 1 && products.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-background border rounded shadow-md z-10 max-h-48 overflow-y-auto mt-1">
                      {products.map((p: any) => (
                        <div 
                          key={p.id} 
                          className="p-2 hover:bg-muted cursor-pointer text-sm border-b"
                          onClick={() => {
                            append({ productId: p.id, productName: p.name, quantity: 1, buyPriceKrw: 0, sellPriceUzs: 0 })
                            setProductSearch('')
                          }}
                        >
                          {p.name} ({p.barcode})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 border rounded-md p-4 bg-muted/20">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-xs">{watch(`items.${index}.productName`)}</Label>
                        <Input type="hidden" {...register(`items.${index}.productId`)} />
                        <Input type="hidden" {...register(`items.${index}.productName`)} />
                      </div>
                      <div className="w-24">
                        <Label className="text-xs">Soni</Label>
                        <Input type="number" {...register(`items.${index}.quantity`)} />
                      </div>
                      <div className="w-32">
                        <Label className="text-xs">Olish (₩)</Label>
                        <Input type="number" {...register(`items.${index}.buyPriceKrw`)} />
                      </div>
                      <div className="w-32">
                        <Label className="text-xs">Sotish (UZS)</Label>
                        <Input type="number" {...register(`items.${index}.sellPriceUzs`)} />
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
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Bekor qilish</Button>
                <Button type="submit" disabled={createMutation.isPending}>Saqlash</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
