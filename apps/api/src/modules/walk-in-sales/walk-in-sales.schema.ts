import { z } from 'zod'

export const createWalkInSaleSchema = z
  .object({
    paymentType: z.enum(['CASH', 'CARD', 'DEBT']),
    customerName: z.string().max(200).optional(),
    customerPhone: z.string().max(20).optional(),
    notes: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().min(1),
          priceUzs: z.number().min(0),
        })
      )
      .min(1),
  })
  .refine(
    (data) => {
      if (data.paymentType === 'DEBT') {
        return !!data.customerName && !!data.customerPhone
      }
      return true
    },
    {
      message: 'Nasiya uchun mijoz ismi va telefoni majburiy',
      path: ['customerName'],
    }
  )
