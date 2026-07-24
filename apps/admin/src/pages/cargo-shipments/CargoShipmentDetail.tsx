import { useQuery } from '@tanstack/react-query'
import { cargoShipmentsApi } from '../../api/cargo-shipments.api'
import { settingsApi } from '../../api/settings.api'
import { formatDate } from '../../utils/date'
import { Package } from 'lucide-react'

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
  const { data: shipment, isLoading: shipmentLoading } = useQuery({
    queryKey: ['cargo-shipment', shipmentId],
    queryFn: () => cargoShipmentsApi.getById(shipmentId)
  })

  const { data: rateData, isLoading: rateLoading } = useQuery({
    queryKey: ['exchange-rate'],
    queryFn: () => settingsApi.getExchangeRates(1)
  })

  const isLoading = shipmentLoading || rateLoading

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
  const totalBuyPriceKrw = items.reduce((acc: number, item: any) => acc + (item.buyPriceKrw || 0) * (item.quantity || 0), 0)
  const totalCostKrw = totalBuyPriceKrw + cargoFeeKrw

  return (
    <div className="space-y-6 pb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg">
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
        <div className="border rounded-md overflow-x-auto bg-background w-full min-w-0">
          <table className="w-full sm:min-w-[640px] text-sm text-left whitespace-nowrap sm:whitespace-normal block sm:table">
            <thead className="bg-muted text-muted-foreground hidden sm:table-header-group">
              <tr>
                <th className="p-2">Mahsulot</th>
                <th className="p-2 text-right">Soni</th>
                <th className="p-2 text-right">Olish ₩</th>
                <th className="p-2 text-right">Kargo ₩</th>
                <th className="p-2 text-right">Jami xarajat ₩</th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group">
              {items.map((item: any) => {
                const cargoShareKrw = totalItems > 0 ? Math.round(cargoFeeKrw / totalItems) : 0
                const costKrw = (item.buyPriceKrw || 0) + cargoShareKrw
                const itemTotalCostKrw = costKrw * item.quantity

                return (
                  <tr key={item.id} className="border sm:border-t sm:border-x-0 sm:border-b-0 block sm:table-row mb-4 sm:mb-0 rounded-md sm:rounded-none p-2 sm:p-0">
                    <td className="p-2 block sm:table-cell border-b sm:border-b-0 pb-3 sm:pb-2">
                      <div className="flex items-center gap-2">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            className="w-8 h-8 rounded object-cover border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                            <Package className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="text-sm whitespace-normal sm:whitespace-nowrap line-clamp-2 sm:line-clamp-none">
                          {item.productName}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 flex justify-between sm:table-cell text-right font-medium">
                      <span className="sm:hidden font-normal text-muted-foreground">Soni:</span>
                      <span>{item.quantity}</span>
                    </td>
                    <td className="p-2 flex justify-between sm:table-cell text-right">
                      <span className="sm:hidden font-normal text-muted-foreground">Olish ₩:</span>
                      <span>₩{item.buyPriceKrw?.toLocaleString()}</span>
                    </td>
                    <td className="p-2 flex justify-between sm:table-cell text-right text-muted-foreground">
                      <span className="sm:hidden font-normal text-muted-foreground">Kargo ₩:</span>
                      <span>₩{cargoShareKrw.toLocaleString()}</span>
                    </td>
                    <td className="p-2 flex justify-between sm:table-cell text-right font-medium bg-muted/30 sm:bg-transparent mt-1 sm:mt-0 rounded sm:rounded-none">
                      <span className="sm:hidden font-normal text-muted-foreground">Jami xarajat ₩:</span>
                      <span>₩{itemTotalCostKrw.toLocaleString()}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-muted font-bold block sm:table-footer-group border rounded-md sm:border-none p-2 sm:p-0 mt-4 sm:mt-0">
              <tr className="block sm:table-row">
                <td className="p-2 hidden sm:table-cell">Jami</td>
                <td className="p-2 flex justify-between sm:table-cell text-right border-b sm:border-none">
                  <span className="sm:hidden font-normal text-muted-foreground">Jami Soni:</span>
                  <span>{totalItems} ta</span>
                </td>
                <td className="p-2 flex justify-between sm:table-cell text-right border-b sm:border-none">
                  <span className="sm:hidden font-normal text-muted-foreground">Jami Olish ₩:</span>
                  <span>₩{totalBuyPriceKrw.toLocaleString()}</span>
                </td>
                <td className="p-2 flex justify-between sm:table-cell text-right border-b sm:border-none">
                  <span className="sm:hidden font-normal text-muted-foreground">Jami Kargo ₩:</span>
                  <span>₩{cargoFeeKrw.toLocaleString()}</span>
                </td>
                <td className="p-2 flex justify-between sm:table-cell text-right">
                  <span className="sm:hidden font-normal text-muted-foreground">Jami Xarajat ₩:</span>
                  <span>₩{totalCostKrw.toLocaleString()}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
