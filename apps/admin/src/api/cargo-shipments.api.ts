import { api } from '../lib/api'

export const cargoShipmentsApi = {
  getAll: async (params: { page?: number; limit?: number; status?: string }) => {
    const res = await api.get('/admin/cargo-shipments', { params })
    return res.data
  },
  getById: async (id: string) => {
    const res = await api.get(`/admin/cargo-shipments/${id}`)
    return res.data.data
  },
  create: async (data: any) => {
    const res = await api.post('/admin/cargo-shipments', data)
    return res.data.data
  },
  update: async ({ id, ...data }: { id: string } & any) => {
    const res = await api.patch(`/admin/cargo-shipments/${id}`, data)
    return res.data.data
  },
  markArrived: async (id: string) => {
    const res = await api.patch(`/admin/cargo-shipments/${id}/arrive`)
    return res.data.data
  },
  delete: async (id: string) => {
    const res = await api.delete(`/admin/cargo-shipments/${id}`)
    return res.data.data
  },
}
