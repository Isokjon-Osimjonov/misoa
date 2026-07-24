import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShoppingBag, Plus, Trash2, Banknote, CreditCard, FileText, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { walkInSalesApi } from '../../api/walk-in-sales.api'
import { productsApi } from '../../api/products.api'
import { formatDate } from '../../utils/date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProductSearchSelect } from '../../components/ProductSearchSelect'
const schema = z.object({
  paymentType: z.enum(['CASH', 'CARD', 'DEBT']),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    productName: z.string(),
    quantity: z.coerce.number().min(1),
    priceUzs: z.coerce.number().min(0),
  })).min(1, 'Kamida 1 ta mahsulot')
}).refine(data => {
  if (data.paymentType === 'DEBT') {
    return !!data.customerName && !!data.customerPhone
  }
  return true
}, { message: "Nasiya uchun ism/telefon majburiy", path: ['customerName'] })

export default function WalkInSalesPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['walk-in-sales', filter],
    queryFn: () => walkInSalesApi.getAll({ paymentType: filter || undefined }),
  })
  
  const sales = (salesData as any)?.data ?? []

  const { data: summary } = useQuery({
    queryKey: ['walk-in-sales-summary'],
    queryFn: () => walkInSalesApi.getSummary({})
  })

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentType: 'CASH',
      items: []
    }
  })
  
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const paymentType = watch('paymentType')
  const watchedItems = watch('items')
  const formTotalUzs = watchedItems.reduce((acc: number, item: any) => acc + ((Number(item.quantity) || 0) * (Number(item.priceUzs) || 0)), 0)


  const createMutation = useMutation({
    mutationFn: walkInSalesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['walk-in-sales'] })
      qc.invalidateQueries({ queryKey: ['walk-in-sales-summary'] })
      toast.success("Sotuv saqlandi")
      setShowForm(false)
      reset()
    },
    onError: (err: any) => toast.error(err.message || 'Xatolik')
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" /> Sotuvlar (UZB)
        </h1>
        <Button className="w-full sm:w-auto" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Yangi sotuv
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-6">
        {/* Naqd */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg shrink-0">
            <Banknote className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-green-600">Naqd pul</p>
            <p className="text-lg font-bold text-green-700">
              {summary?.totalCash?.toLocaleString() || 0} UZS
            </p>
          </div>
        </div>

        {/* Karta */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg shrink-0">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-600">Karta</p>
            <p className="text-lg font-bold text-blue-700">
              {summary?.totalCard?.toLocaleString() || 0} UZS
            </p>
          </div>
        </div>

        {/* Nasiya */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg shrink-0">
            <FileText className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-orange-600">Nasiya</p>
            <p className="text-lg font-bold text-orange-700">
              {summary?.totalDebt?.toLocaleString() || 0} UZS
            </p>
          </div>
        </div>

        {/* Jami */}
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg shrink-0">
            <TrendingUp className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-violet-600">Jami daromad</p>
            <p className="text-lg font-bold text-violet-700">
              {summary?.totalRevenue?.toLocaleString() || 0} UZS
            </p>
          </div>
        </div>
      </div>

      {summary && (
        <div className="p-4 bg-muted/30 border border-border rounded-xl mb-6">
          <p className="text-sm font-medium mb-3">
            UZB Sotuvlar Xulosasi & Moliyaviy Holat
          </p>
          <div className="space-y-2 text-sm max-w-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jami savdo (UZS):</span>
              <span className="font-medium">
                {summary.totalRevenue?.toLocaleString() ?? 0} UZS
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mahsulot xarajati (₩):</span>
              <span className="font-medium">
                ₩{summary.totalCogs?.toLocaleString() ?? 0}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant={filter === '' ? 'default' : 'outline'} onClick={() => setFilter('')}>Barchasi</Button>
        <Button variant={filter === 'CASH' ? 'default' : 'outline'} onClick={() => setFilter('CASH')}>Naqd</Button>
        <Button variant={filter === 'CARD' ? 'default' : 'outline'} onClick={() => setFilter('CARD')}>Karta</Button>
        <Button variant={filter === 'DEBT' ? 'default' : 'outline'} onClick={() => setFilter('DEBT')}>Nasiya</Button>
      </div>

      <div className="rounded-lg border overflow-hidden bg-background">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Raqam</th>
              <th className="p-3">Sana</th>
              <th className="p-3">To'lov</th>
              <th className="p-3">Mijoz</th>
              <th className="p-3">Summa</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-4 text-center">Yuklanmoqda...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center">Ma'lumot topilmadi</td></tr>
            ) : (
              sales.map((s: any, idx: number) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3 font-medium">{s.saleNumber}</td>
                  <td className="p-3">{formatDate(s.createdAt)}</td>
                  <td className="p-3 font-semibold">{s.paymentType === 'CASH' ? 'Naqd' : s.paymentType === 'CARD' ? 'Karta' : 'Nasiya'}</td>
                  <td className="p-3">{s.customerName || '-'}</td>
                  <td className="p-3 font-bold">{s.totalAmountUzs?.toLocaleString()} UZS</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Yangi sotuv</h2>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-6">
              <div className="space-y-2">
                <Label>To'lov turi</Label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <label className="flex items-center gap-2 border p-3 rounded cursor-pointer hover:bg-muted">
                    <input type="radio" value="CASH" {...register('paymentType')} />
                    💵 Naqd
                  </label>
                  <label className="flex items-center gap-2 border p-3 rounded cursor-pointer hover:bg-muted">
                    <input type="radio" value="CARD" {...register('paymentType')} />
                    💳 Karta
                  </label>
                  <label className="flex items-center gap-2 border p-3 rounded cursor-pointer hover:bg-muted">
                    <input type="radio" value="DEBT" {...register('paymentType')} />
                    📋 Nasiya
                  </label>
                </div>
              </div>

              {paymentType === 'DEBT' && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <Label>Mijoz ismi</Label>
                    <Input {...register('customerName')} />
                    {errors.customerName && <p className="text-red-500 text-xs">{errors.customerName.message as string}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Telefon</Label>
                    <Input {...register('customerPhone')} />
                  </div>
                </div>
              )}

              <div>
                <Label>Mahsulot qo'shish (UZB ombor)</Label>
                <div className="mb-4">
                  <ProductSearchSelect
                    placeholder="UZB ombordan tanlang..."
                    filterUzbStock={true}
                    selectedIds={fields.map((f: any) => f.productId)}
                    onSelect={(p: any) => {
                      const exists = fields.find((f: any) => f.productId === p.id)
                      if (!exists) {
                        append({ productId: p.id, productName: p.name, quantity: 1, priceUzs: p.priceUzs ?? 0 })
                      }
                    }}
                  />
                </div>

                <div className="space-y-2 border rounded-md p-4 bg-muted/20">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col sm:flex-row gap-4 sm:gap-2 sm:items-end border-b sm:border-none pb-4 sm:pb-0">
                      <div className="flex-1 w-full sm:w-auto">
                        <Label className="text-xs">{watch(`items.${index}.productName`)}</Label>
                        <Input type="hidden" {...register(`items.${index}.productId`)} />
                      </div>
                      <div className="w-full sm:w-24">
                        <Label className="text-xs">Soni</Label>
                        <Input type="number" {...register(`items.${index}.quantity`)} />
                      </div>
                      <div className="w-full sm:w-40">
                        <Label className="text-xs">Narx (UZS)</Label>
                        <Input type="number" {...register(`items.${index}.priceUzs`)} />
                      </div>
                      <div className="w-full sm:w-40">
                        <Label className="text-xs">Jami</Label>
                        <div className="p-2 border rounded bg-muted">
                          {((Number(watch(`items.${index}.quantity`)) || 0) * (Number(watch(`items.${index}.priceUzs`)) || 0)).toLocaleString()}
                        </div>
                      </div>
                      <Button type="button" variant="destructive" size="icon" className="w-full sm:w-auto shrink-0" onClick={() => remove(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {fields.length === 0 && <p className="text-sm text-muted-foreground text-center">Mahsulot qo'shilmagan</p>}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center pt-4 border-t">
                <div className="text-xl font-bold">Jami: {formTotalUzs.toLocaleString()} UZS</div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => setShowForm(false)}>Bekor qilish</Button>
                  <Button type="submit" className="flex-1 sm:flex-none" disabled={createMutation.isPending}>Sotish</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
