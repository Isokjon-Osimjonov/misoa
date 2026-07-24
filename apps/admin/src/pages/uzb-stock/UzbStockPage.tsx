import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Warehouse, Search } from 'lucide-react'
import { api } from '../../lib/api'
import { Input } from '@/components/ui/input'

export default function UzbStockPage() {
  const [search, setSearch] = useState('')
  
  const { data: stockData, isLoading } = useQuery({
    queryKey: ['uzb-stock', search],
    queryFn: async () => {
      const res = await api.get('/admin/inventory/uzb-stock', { params: { search } })
      return res.data
    },
  })
  
  const items = stockData?.data ?? []
  
  const totalItems = items.length
  const lowStock = items.filter((i: any) => i.uzbQty > 0 && i.uzbQty <= 5).length
  const outOfStock = items.filter((i: any) => i.uzbQty === 0).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Warehouse className="w-6 h-6" /> UZB Ombor
        </h1>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input 
            className="pl-9" 
            placeholder="Qidirish..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-md shadow-sm bg-card text-card-foreground">
          <p className="text-sm text-muted-foreground">📦 Jami</p>
          <p className="text-xl font-bold">{totalItems} mahsulot</p>
        </div>
        <div className="p-4 border rounded-md shadow-sm bg-card text-card-foreground">
          <p className="text-sm text-muted-foreground">⚠️ Kam qolgan</p>
          <p className="text-xl font-bold text-yellow-600">{lowStock} ta</p>
        </div>
        <div className="p-4 border rounded-md shadow-sm bg-card text-card-foreground">
          <p className="text-sm text-muted-foreground">🔴 Tugagan</p>
          <p className="text-xl font-bold text-red-600">{outOfStock} ta</p>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden bg-background">
        <div className="overflow-x-auto">
          <table className="w-full sm:min-w-[640px] text-sm text-left block sm:table">
          <thead className="bg-muted text-muted-foreground hidden sm:table-header-group">
            <tr>
              <th className="p-3 w-16">Rasm</th>
              <th className="p-3">Nomi</th>
              <th className="p-3 hidden sm:table-cell">Brand</th>
              <th className="p-3">UZB Qoldi</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="block sm:table-row-group">
            {isLoading ? (
              <tr><td colSpan={5} className="p-4 text-center">Yuklanmoqda...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center">Ma'lumot topilmadi</td></tr>
            ) : (
              items.map((item: any) => (
                <tr key={item.id} className="border sm:border-t sm:border-x-0 sm:border-b-0 block sm:table-row mb-4 sm:mb-0 rounded-md sm:rounded-none p-3 sm:p-0 bg-card">
                  <td className="p-3 block sm:table-cell border-b sm:border-none pb-3 sm:pb-3 w-16">
                    <div className="flex justify-center sm:justify-start">
                      {item.imageUrl || item.images?.[0]?.url || item.image ? (
                        <img 
                          src={item.imageUrl ?? item.images?.[0]?.url ?? item.image} 
                          alt={item.name} 
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs">Rasm</div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 flex justify-between items-center sm:table-cell font-medium text-base sm:text-sm border-b sm:border-none">
                    <span className="sm:hidden font-normal text-muted-foreground text-sm">Nomi:</span>
                    <span className="line-clamp-2 text-right sm:text-left ml-4 sm:ml-0">{item.name}</span>
                  </td>
                  <td className="p-3 hidden sm:table-cell">{item.brandName || '-'}</td>
                  <td className="p-3 flex justify-between items-center sm:table-cell font-bold text-lg border-b sm:border-none">
                    <span className="sm:hidden font-normal text-muted-foreground text-sm">UZB Qoldi:</span>
                    <span>{item.uzbQty}</span>
                  </td>
                  <td className="p-3 flex justify-between items-center sm:table-cell">
                    <span className="sm:hidden font-normal text-muted-foreground">Status:</span>
                    {item.uzbQty === 0 ? (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">🔴 Tugagan</span>
                    ) : item.uzbQty <= 5 ? (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">🟡 Kam qoldi</span>
                    ) : (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">🟢 Mavjud</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
