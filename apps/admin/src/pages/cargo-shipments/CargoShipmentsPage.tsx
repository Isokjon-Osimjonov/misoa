import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Plus, Search, Trash2, Eye, CheckCircle2, Truck, PackageCheck, DollarSign, BarChart3, List, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'
import { cargoShipmentsApi } from '../../api/cargo-shipments.api'
import { productsApi } from '../../api/products.api'
import { inventoryApi } from '../../api/inventory.api'
import { formatDate } from '../../utils/date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ProductSearchSelect } from '../../components/ProductSearchSelect'
import { CargoShipmentDetail } from './CargoShipmentDetail'
import { CargoForm } from './CargoForm'

const CargoStatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string, className: string }> = {
    SENT: {
      label: "Yo'lda",
      className: "bg-amber-50 text-amber-700 border border-amber-200"
    },
    ARRIVED: {
      label: "Yetib keldi",
      className: "bg-green-50 text-green-700 border border-green-200"
    },
    CANCELLED: {
      label: "Bekor",
      className: "bg-red-50 text-red-700 border border-red-200"
    },
  }
  const current = config[status] ?? {
    label: status,
    className: "bg-gray-50 text-gray-700 border border-gray-200"
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${current.className}`}>
      {current.label}
    </span>
  )
}

export default function CargoShipmentsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [editingShipment, setEditing] = useState<any>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  
  const { data: shipmentsData, isLoading } = useQuery({
    queryKey: ['cargo-shipments', filter],
    queryFn: () => cargoShipmentsApi.getAll({ status: filter || undefined }),
  })
  
  const shipments = (shipmentsData as any)?.data ?? []

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
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error?.message ?? 'Xatolik')
    }
  })

  const handleDelete = (id: string) => {
    if (!confirm("Bu kargoni o'chirishni tasdiqlaysizmi?")) return
    deleteMutation.mutate(id)
  }

  const stats = useMemo(() => {
    const all = shipments ?? []
    const sent = all.filter((s: any) => s.status === 'SENT')
    const arrived = all.filter((s: any) => s.status === 'ARRIVED')
    
    const totalCargoKrw = all.reduce((sum: number, s: any) => sum + (s.cargoFeeKrw ?? 0), 0)
    const totalItems = all.reduce((sum: number, s: any) => sum + (s.totalQuantity ?? 0), 0)

    return {
      sentCount: sent.length,
      arrivedCount: arrived.length,
      totalCount: all.length,
      totalCargoKrw,
      totalItems,
    }
  }, [shipments])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6" /> Kargo jo'natmalar
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')}>
              <List className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Yangi kargo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg shrink-0">
            <Truck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-600">Yo'lda</p>
            <p className="text-lg font-bold text-amber-700">{stats.sentCount} ta</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg shrink-0">
            <PackageCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-green-600">Yetib keldi</p>
            <p className="text-lg font-bold text-green-700">{stats.arrivedCount} ta</p>
          </div>
        </div>

        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg shrink-0">
            <Package className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-violet-600">Jami jo'natmalar</p>
            <p className="text-lg font-bold text-violet-700">{stats.totalCount} ta</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg shrink-0">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-600">Jami kargo xarajat</p>
            <p className="text-lg font-bold text-blue-700">₩{stats.totalCargoKrw.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg shrink-0">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-purple-600">Jami mahsulotlar</p>
            <p className="text-lg font-bold text-purple-700">{stats.totalItems} ta</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === '' ? 'default' : 'outline'} onClick={() => setFilter('')}>Barcha</Button>
        <Button variant={filter === 'SENT' ? 'default' : 'outline'} onClick={() => setFilter('SENT')}>Yo'lda</Button>
        <Button variant={filter === 'ARRIVED' ? 'default' : 'outline'} onClick={() => setFilter('ARRIVED')}>Yetdi</Button>
      </div>

      {viewMode === 'table' ? (
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
                    <CargoStatusBadge status={s.status} />
                  </td>
                  <td className="p-3 text-sm">{s.totalQuantity ?? 0} ta</td>
                  <td className="p-3">₩{s.totalCostKrw?.toLocaleString()}</td>
                  <td className="p-3 flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedShipment(s)
                      setShowDetail(true)
                    }}>
                      <Eye className="w-4 h-4 mr-1" /> Ko'rish
                    </Button>
                    <Button variant="outline" size="sm" onClick={async () => {
                      try {
                        const detail = await cargoShipmentsApi.getById(s.id);
                        setEditing(detail);
                        setShowEdit(true);
                      } catch(e) {}
                    }}>
                      Tahrirlash
                    </Button>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(s.id)}
                      >
                        O'chirish
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full p-4 text-center">Yuklanmoqda...</div>
          ) : shipments.length === 0 ? (
            <div className="col-span-full p-4 text-center">Ma'lumot topilmadi</div>
          ) : (
            shipments.map((s: any) => (
              <div key={s.id} className="border rounded-xl p-4 bg-background hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedShipment(s); setShowDetail(true); }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-sm">{s.shipmentNumber}</span>
                  <CargoStatusBadge status={s.status} />
                </div>
                <p className="text-xs text-muted-foreground mb-3">{formatDate(s.dateSent)}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Mahsulotlar</p>
                    <p className="font-medium">{s.totalQuantity ?? 0} ta</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Kargo</p>
                    <p className="font-medium">₩{(s.cargoFeeKrw ?? 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedShipment(s); setShowDetail(true); }}>
                    Ko'rish
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const detail = await cargoShipmentsApi.getById(s.id);
                      setEditing(detail);
                      setShowEdit(true);
                    } catch(e) {}
                  }}>
                    Tahrirlash
                  </Button>
                  {s.status === 'SENT' && (
                    <Button size="sm" className="flex-1 text-xs" onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Kargo #${s.shipmentNumber} yetib kelganligini tasdiqlaysizmi?`)) {
                        markArrivedMutation.mutate(s.id);
                      }
                    }}>
                      Yetdi
                    </Button>
                  )}
                  {s.status === 'SENT' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(s.id);
                      }}
                    >
                      O'chirish
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Yangi kargo</h2>
            <CargoForm mode="create" onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      <Sheet
        open={showEdit}
        onOpenChange={(open) => {
          setShowEdit(open)
          if (!open) setEditing(null)
        }}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Kargoni tahrirlash</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {editingShipment && (
              <CargoForm
                mode="edit"
                initialData={editingShipment}
                onSuccess={() => {
                  setShowEdit(false)
                  setEditing(null)
                  qc.invalidateQueries({ queryKey: ['cargo-shipments'] })
                }}
                onCancel={() => {
                  setShowEdit(false)
                  setEditing(null)
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Jo'natma: {selectedShipment?.shipmentNumber}</DialogTitle>
          </DialogHeader>
          <div className="mt-6">
            {selectedShipment && (
              <CargoShipmentDetail
                shipmentId={selectedShipment.id}
                onClose={() => setShowDetail(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
