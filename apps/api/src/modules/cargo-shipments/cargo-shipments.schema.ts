import { z } from 'zod'

export const createCargoShipmentSchema = z.object({
  shipmentNumber: z.string().min(1).max(50),
  dateSent: z.string().datetime(),
  cargoFeeKrw: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().min(1),
      buyPriceKrw: z.number().min(0),
    })
  ).min(1, "Kamida 1 ta mahsulot kerak"),
})
