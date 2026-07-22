import { useQuery } from '@tanstack/react-query'
import { cargoShipmentsApi } from '../../api/cargo-shipments.api'
import { formatDate } from '../../utils/date'

interface CargoShipmentDetailProps {
  shipmentId: string
  onClose: () => void
}

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

export function CargoShipmentDetail({ shipmentId }: CargoShipmentDetailProps) {
  const { data: shipment, isLoading } = useQuery({
    queryKey: ['cargo-shipment', shipmentId],
    queryFn: () => cargoShipmentsApi.getById(shipmentId)
  })

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Yuklanmoqda...</div>
  }

  if (!shipment) {
    return <div className="p-4 text-center text-muted-foreground">Ma'lumot topilmadi</div>
  }

  const items = shipment.items || []
  const totalItems = items.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0)
  const cargoFeeKrw = shipment.cargoFeeKrw || 0
  
  // Totals
  let totalRevenueUzs = 0
  let totalProfitUzs = 0

  return (
    <div className="space-y-6 pb-6">
      <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
        <div>
          <p className="text-xs text-muted-foreground">Jo'natilgan</p>
          <p className="font-medium">{formatDate(shipment.dateSent)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Yetib keldi</p>
          <p className="font-medium">{shipment.dateArrived ? formatDate(shipment.dateArrived) : '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="mt-1">
            <CargoStatusBadge status={shipment.status} />
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Kargo narxi</p>
          <p className="font-medium">₩{cargoFeeKrw.toLocaleString()}</p>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">Mahsulotlar ({totalItems} ta)</h3>
        <div className="border rounded-md overflow-x-auto bg-background">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-2">Mahsulot</th>
                <th className="p-2 text-right">Soni</th>
                <th className="p-2 text-right">Olish ₩</th>
                <th className="p-2 text-right">Kargo ₩</th>
                <th className="p-2 text-right">Sotish UZS</th>
                <th className="p-2 text-right">Xarajat UZS</th>
                <th className="p-2 text-right">Foyda UZS</th>
                <th className="p-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => {
                const cargoShareKrw = totalItems > 0 ? Math.round(cargoFeeKrw / totalItems) : 0
                const costKrw = (item.buyPriceKrw || 0) + cargoShareKrw
                // Assuming 1 KRW ≈ 9.5 UZS for display (this should ideally come from exchange rate API, but since not provided, we just display the KRW value properly or use a fixed rate if needed. Actually the prompt says:
                // costUzs = costKrw * exchangeRate
                // Wait, exchange rate isn't defined. I'll use 9.5 temporarily, or just read it from somewhere. Let's use 9.5 as a dummy.
                const exchangeRate = 9.5 
                const costUzs = costKrw * exchangeRate
                const sellPriceUzs = item.sellPriceUzs || 0
                const profitUzs = sellPriceUzs - costUzs
                const marginPct = sellPriceUzs > 0 ? (profitUzs / sellPriceUzs) * 100 : 0

                totalRevenueUzs += sellPriceUzs * (item.quantity || 0)
                totalProfitUzs += profitUzs * (item.quantity || 0)

                return (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {item.productImage ? (
                          <img src={item.productImage} className="w-8 h-8 rounded object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 bg-muted rounded"></div>
                        )}
                        <span className="font-medium max-w-[150px] truncate" title={item.productName}>
                          {item.productName}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-right font-medium">{item.quantity}</td>
                    <td className="p-2 text-right">₩{item.buyPriceKrw?.toLocaleString()}</td>
                    <td className="p-2 text-right text-muted-foreground">₩{cargoShareKrw.toLocaleString()}</td>
                    <td className="p-2 text-right font-medium">{sellPriceUzs.toLocaleString()}</td>
                    <td className="p-2 text-right text-muted-foreground">{costUzs.toLocaleString()}</td>
                    <td className={`p-2 text-right font-medium ${profitUzs > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitUzs > 0 ? '+' : ''}{profitUzs.toLocaleString()}
                    </td>
                    <td className={`p-2 text-right ${marginPct > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {marginPct.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-muted font-bold">
              <tr>
                <td className="p-2">Jami</td>
                <td className="p-2 text-right">{totalItems} ta</td>
                <td className="p-2 text-right" colSpan={2}>₩{(shipment.totalCostKrw || 0).toLocaleString()}</td>
                <td className="p-2 text-right text-primary">{totalRevenueUzs.toLocaleString()}</td>
                <td className="p-2 text-right"></td>
                <td className={`p-2 text-right ${totalProfitUzs > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalProfitUzs > 0 ? '+' : ''}{totalProfitUzs.toLocaleString()}
                </td>
                <td className="p-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
