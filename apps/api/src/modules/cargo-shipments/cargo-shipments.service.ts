import { db } from '../../config/db'
import { cargoShipments, cargoShipmentItems, inventoryBatches, products } from '@misoa/db'
import { eq, desc, sql, count } from 'drizzle-orm'
import { sendAdminAlert } from '../../bot/helpers/notify'

export async function createCargoShipment(data: {
  shipmentNumber: string
  dateSent: Date
  cargoFeeKrw: number
  notes?: string
  items: Array<{
    productId: string
    quantity: number
    buyPriceKrw: number
    sellPriceUzs: number
  }>
  createdBy: string
}) {
  return await db.transaction(async (tx) => {
    let totalItems = 0
    for (const item of data.items) {
      totalItems += item.quantity
    }

    let totalCostKrw = 0

    // 1. Create cargo_shipments record
    const [shipment] = await tx
      .insert(cargoShipments)
      .values({
        shipmentNumber: data.shipmentNumber,
        dateSent: data.dateSent,
        cargoFeeKrw: data.cargoFeeKrw,
        notes: data.notes,
        createdBy: data.createdBy,
        status: 'SENT',
        totalCostKrw: 0 // Will update later
      })
      .returning()

    // 2. Calculate cargoShareKrw per item
    const itemsToInsert = []
    const batchesToInsert = []
    for (const item of data.items) {
      const cargoShareKrw = Math.round(data.cargoFeeKrw / totalItems)
      const itemTotalCost = item.buyPriceKrw + cargoShareKrw
      totalCostKrw += itemTotalCost * item.quantity

      itemsToInsert.push({
        shipmentId: shipment.id,
        productId: item.productId,
        quantity: item.quantity,
        buyPriceKrw: item.buyPriceKrw,
        cargoShareKrw,
        sellPriceUzs: item.sellPriceUzs,
      })

      // 5. Create inventory_batches with location = 'IN_TRANSIT'
      batchesToInsert.push({
        productId: item.productId,
        batchRef: `CARGO-${shipment.shipmentNumber}`,
        initialQty: item.quantity,
        currentQty: item.quantity,
        costPrice: BigInt(itemTotalCost),
        costCurrency: 'KRW',
        location: 'IN_TRANSIT',
      })
    }

    // 3. Create cargo_shipment_items records
    if (itemsToInsert.length > 0) {
      await tx.insert(cargoShipmentItems).values(itemsToInsert)
      await tx.insert(inventoryBatches).values(batchesToInsert)
    }

    // 4. Update totalCostKrw
    const [updatedShipment] = await tx
      .update(cargoShipments)
      .set({ totalCostKrw })
      .where(eq(cargoShipments.id, shipment.id))
      .returning()

    return updatedShipment
  })
}

export async function getCargoShipments(params: {
  status?: string
  page: number
  limit: number
}) {
  const { page, limit } = params
  const offset = (page - 1) * limit
  
  let conditions: any = sql`1=1`
  if (params.status) {
    conditions = eq(cargoShipments.status, params.status)
  }

  const itemsQuery = await db
    .select({
      shipment: cargoShipments,
      itemCount: sql<number>`(SELECT COALESCE(SUM(quantity), 0) FROM cargo_shipment_items WHERE shipment_id = ${cargoShipments.id})`.mapWith(Number)
    })
    .from(cargoShipments)
    .where(conditions)
    .orderBy(desc(cargoShipments.dateSent))
    .limit(limit)
    .offset(offset)

  const [countRes] = await db
    .select({ count: count() })
    .from(cargoShipments)
    .where(conditions)

  const total = Number(countRes?.count || 0)

  return {
    data: itemsQuery.map(row => ({
      ...row.shipment,
      itemCount: row.itemCount
    })),
    total
  }
}

export async function getCargoShipment(id: string) {
  const [shipment] = await db
    .select()
    .from(cargoShipments)
    .where(eq(cargoShipments.id, id))
  
  if (!shipment) return null

  const items = await db
    .select({
      item: cargoShipmentItems,
      productName: products.name,
      productImage: sql`${products.imageUrls}[1]`
    })
    .from(cargoShipmentItems)
    .leftJoin(products, eq(cargoShipmentItems.productId, products.id))
    .where(eq(cargoShipmentItems.shipmentId, id))

  const formattedItems = items.map(row => ({
    ...row.item,
    productName: row.productName,
    productImage: row.productImage,
    itemProfit: 0 // Placeholder logic for profit
  }))

  return {
    ...shipment,
    items: formattedItems
  }
}

export async function markCargoArrived(id: string, arrivedBy: string) {
  return await db.transaction(async (tx) => {
    const [shipment] = await tx
      .select()
      .from(cargoShipments)
      .where(eq(cargoShipments.id, id))
    
    if (!shipment || shipment.status !== 'SENT') {
      throw new Error("Shipment not found or already arrived")
    }

    // 1. Update cargo_shipments status
    const [updatedShipment] = await tx
      .update(cargoShipments)
      .set({ status: 'ARRIVED', dateArrived: new Date(), updatedAt: new Date() })
      .where(eq(cargoShipments.id, id))
      .returning()

    // 3. Update inventory_batches location
    await tx
      .update(inventoryBatches)
      .set({ location: 'UZB_STORE' })
      .where(
        sql`batch_ref = ${`CARGO-${shipment.shipmentNumber}`} AND location = 'IN_TRANSIT'`
      )

    // Calculate total products
    const items = await tx.select({ qty: cargoShipmentItems.quantity }).from(cargoShipmentItems).where(eq(cargoShipmentItems.shipmentId, id))
    const totalQty = items.reduce((acc, item) => acc + item.qty, 0)
    
    // 4. Send Telegram notification
    const dateStr = updatedShipment.dateArrived?.toISOString().split('T')[0]
    await sendAdminAlert(
      `✅ Kargo yetib keldi!\n` +
      `📦 Shipment #${shipment.shipmentNumber}\n` +
      `📅 ${dateStr}\n` +
      `🗂 ${totalQty} ta mahsulot\n` +
      `UZB omboriga qo'shildi`
    )

    return updatedShipment
  })
}

export async function deleteCargoShipment(id: string) {
  return await db.transaction(async (tx) => {
    const [shipment] = await tx.select().from(cargoShipments).where(eq(cargoShipments.id, id))
    if (!shipment || shipment.status !== 'SENT') {
      throw new Error("Cannot delete shipment that is not SENT")
    }

    // Delete inventory batches
    await tx.delete(inventoryBatches).where(sql`batch_ref = ${`CARGO-${shipment.shipmentNumber}`}`)

    // Delete items (cascades usually, but explicit is fine)
    await tx.delete(cargoShipmentItems).where(eq(cargoShipmentItems.shipmentId, id))

    // Delete shipment
    await tx.delete(cargoShipments).where(eq(cargoShipments.id, id))
  })
}
