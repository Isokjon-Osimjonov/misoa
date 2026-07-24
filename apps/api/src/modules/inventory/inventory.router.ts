import { Router } from 'express'
import * as ctrl from './inventory.controller'
import { requirePermission } from '../../middleware/auth'

const router = Router()

// All inventory routes require admin permissions
router.get('/uzb-stock', requirePermission('uzb_stock', 'read'), ctrl.getUzbStock)
router.get('/stock', requirePermission('inventory', 'read'), ctrl.getStockSummary)
router.post('/batches', requirePermission('inventory', 'write'), ctrl.createBatch)
router.get('/cost-price/:productId', requirePermission('inventory', 'read'), ctrl.getCostPrice)
router.get('/batches/:productId', requirePermission('inventory', 'read'), ctrl.getBatchesByProduct)
router.patch('/batches/:id', requirePermission('inventory', 'write'), ctrl.updateBatch)
router.delete('/batches/:id', requirePermission('inventory', 'write'), ctrl.deleteBatch)
router.get(
  '/:productId/movements',
  requirePermission('inventory', 'read'),
  ctrl.getProductMovements
)
router.post('/write-off', requirePermission('inventory', 'write'), ctrl.writeOffStock)
router.get('/write-off-reasons', requirePermission('inventory', 'read'), ctrl.getWriteOffReasons)
router.get('/write-offs', requirePermission('inventory', 'read'), ctrl.getWriteOffHistory)

export default router
