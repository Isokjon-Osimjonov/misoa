import { Router } from 'express'
import { requirePermission } from '../../middleware/auth'
import * as service from './walk-in-sales.service'
import { createWalkInSaleSchema } from './walk-in-sales.schema'

export const walkInSalesRouter = Router()

walkInSalesRouter.get(
  '/',
  requirePermission('walk_in_sales', 'read'),
  async (req, res) => {
    try {
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 20
      const paymentType = req.query.paymentType as string | undefined
      const from = req.query.from ? new Date(req.query.from as string) : undefined
      const to = req.query.to ? new Date(req.query.to as string) : undefined

      const result = await service.getWalkInSales({ page, limit, paymentType, from, to })
      res.json({ data: result.data, meta: { total: result.total, page, limit }, error: null })
    } catch (err: any) {
      res.status(400).json({ error: err.message, data: null })
    }
  }
)

walkInSalesRouter.get(
  '/summary',
  requirePermission('walk_in_sales', 'read'),
  async (req, res) => {
    try {
      const from = req.query.from ? new Date(req.query.from as string) : new Date(0)
      const to = req.query.to ? new Date(req.query.to as string) : new Date()

      const data = await service.getWalkInSalesSummary({ from, to })
      res.json({ data, error: null })
    } catch (err: any) {
      res.status(400).json({ error: err.message, data: null })
    }
  }
)

walkInSalesRouter.get(
  '/:id',
  requirePermission('walk_in_sales', 'read'),
  async (req, res) => {
    try {
      const data = await service.getWalkInSale(req.params.id)
      if (!data) return res.status(404).json({ error: 'Not found', data: null })
      res.json({ data, error: null })
    } catch (err: any) {
      res.status(400).json({ error: err.message, data: null })
    }
  }
)

walkInSalesRouter.post(
  '/',
  requirePermission('walk_in_sales', 'write'),
  async (req, res) => {
    try {
      const validated = createWalkInSaleSchema.parse(req.body)
      const data = await service.createWalkInSale({
        ...validated,
        createdBy: req.user!.sub,
      })
      res.json({ data, error: null })
    } catch (err: any) {
      res.status(400).json({ error: err.message || err, data: null })
    }
  }
)
