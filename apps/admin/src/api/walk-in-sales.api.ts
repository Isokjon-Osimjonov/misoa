import { api } from '../lib/api'

export const walkInSalesApi = {
  getAll: async (params: { page?: number; limit?: number; paymentType?: string; from?: string; to?: string }) => {
    const res = await api.get('/admin/walk-in-sales', { params })
    return res.data
  },
  getSummary: async (params: { from?: string; to?: string }) => {
    const res = await api.get('/admin/walk-in-sales/summary', { params })
    return res.data.data
  },
  getById: async (id: string) => {
    const res = await api.get(`/admin/walk-in-sales/${id}`)
    return res.data.data
  },
  create: async (data: any) => {
    const res = await api.post('/admin/walk-in-sales', data)
    return res.data.data
  },
}
