import { z } from 'zod'

export const updateSettingsSchema = z.object({
  paymentTimeoutMinutes: z.number().optional(),
  lowStockThreshold: z.number().optional(),


  minOrderKorKrw: z.coerce.number().optional(),
  minOrderUzbUzs: z.coerce.number().optional(),

})

export const updatePaymentMethodSchema = z.object({
  isEnabled: z.boolean().optional(),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  holderName: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  region: z.string().optional(),
})

export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>
export type UpdatePaymentMethodDto = z.infer<typeof updatePaymentMethodSchema>
