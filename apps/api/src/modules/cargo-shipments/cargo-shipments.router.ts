import { Router } from 'express'
import { requirePermission } from '../../middleware/auth'
import * as service from './cargo-shipments.service'
import { createCargoShipmentSchema } from './cargo-shipments.schema'

export const cargoShipmentsRouter = Router()

cargoShipmentsRouter.get(
  '/',
  requirePermission('cargo_shipments', 'read'),
  async (req, res) => {
    try {
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 20
      const status = req.query.status as string | undefined

      const result = await service.getCargoShipments({ page, limit, status })
      res.json({ data: result.data, meta: { total: result.total, page, limit }, error: null })
    } catch (err: any) {
      res.status(400).json({ error: err.message, data: null })
    }
  }
)

cargoShipmentsRouter.get(
  '/:id',
  requirePermission('cargo_shipments', 'read'),
  async (req, res) => {
    try {
      const data = await service.getCargoShipment(req.params.id)
      if (!data) return res.status(404).json({ error: 'Not found', data: null })
      res.json({ data, error: null })
    } catch (err: any) {
      res.status(400).json({ error: err.message, data: null })
    }
  }
)

cargoShipmentsRouter.post(
  '/',
  requirePermission('cargo_shipments', 'write'),
  async (req, res) => {
    try {
      const validated = createCargoShipmentSchema.parse(req.body)
      const data = await service.createCargoShipment({
        ...validated,
        dateSent: new Date(validated.dateSent),
        createdBy: req.user!.sub,
      })
      res.json({ data, error: null })
    } catch (err: any) {
      res.status(400).json({ error: err.message || err, data: null })
    }
  }
)

cargoShipmentsRouter.patch(
  '/:id/arrive',
  requirePermission('cargo_shipments', 'write'),
  async (req, res) => {
    try {
      const data = await service.markCargoArrived(req.params.id, req.user!.sub)
      res.json({ data, error: null })
    } catch (err: any) {
      res.status(400).json({ error: err.message, data: null })
    }
  }
)

cargoShipmentsRouter.patch(
  '/:id',
  requirePermission('cargo_shipments', 'write'),
  async (req, res) => {
    try {
      const validated = createCargoShipmentSchema.parse(req.body)
      const data = await service.updateCargoShipment(req.params.id, {
        ...validated,
        dateSent: new Date(validated.dateSent),
        createdBy: req.user!.sub,
      })
      res.json({ data, error: null })
    } catch (err: any) {
      res.status(400).json({ error: err.message || err, data: null })
    }
  }
)

cargoShipmentsRouter.delete(
  '/:id',
  requirePermission('cargo_shipments', 'write'),
  async (req, res) => {
    try {
      await service.deleteCargoShipment(req.params.id)
      res.json({ data: { success: true }, error: null })
    } catch (err: any) {
      res.status(400).json({ error: err.message, data: null })
    }
  }
)
