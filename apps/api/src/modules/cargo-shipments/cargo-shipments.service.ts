import { db } from '../../config/db'
import { cargoShipments, cargoShipmentItems, inventoryBatches, products, expenses, expenseCategories } from '@misoa/db'
import { eq, desc, sql, count, and, gt, asc } from 'drizzle-orm'
import { sendAdminAlert } from '../../bot/helpers/notify'


async function deductFromKorWarehouse(
  productId: string,
  quantityNeeded: number,
  tx: any
): Promise<void> {
  const korBatches = await tx
    .select()
    .from(inventoryBatches)
    .where(
      and(
        eq(inventoryBatches.productId, productId),
        eq(inventoryBatches.location, 'KOR_WAREHOUSE'),
        gt(inventoryBatches.currentQty, 0)
      )
    )
    .orderBy(asc(inventoryBatches.createdAt))

  const totalAvailable = korBatches.reduce((sum: number, b: any) => sum + b.currentQty, 0)

  if (totalAvailable < quantityNeeded) {
    const product = await tx
      .select({ name: products.name })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1)
    
    throw new Error(
      `Koreya omborida yetarli mahsulot yo'q: ` +
      `${product[0]?.name}. ` +
      `Mavjud: ${totalAvailable}, ` +
      `Kerak: ${quantityNeeded}`
    )
  }

  let remaining = quantityNeeded
  for (const batch of korBatches) {
    if (remaining <= 0) break
    
    const deduct = Math.min(batch.currentQty, remaining)
    
    await tx
      .update(inventoryBatches)
      .set({
        currentQty: batch.currentQty - deduct,
        updatedAt: new Date()
      })
      .where(eq(inventoryBatches.id, batch.id))
    
    remaining -= deduct
  }
}

export async function createCargoShipment(data: {
  shipmentNumber: string
  dateSent: Date
  cargoFeeKrw: number
  notes?: string
  items: Array<{
    productId: string
    quantity: number
    buyPriceKrw: number
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
      await deductFromKorWarehouse(item.productId, item.quantity, tx)
      const cargoShareKrw = Math.round(data.cargoFeeKrw / totalItems)
      const itemTotalCost = item.buyPriceKrw + cargoShareKrw
      totalCostKrw += itemTotalCost * item.quantity

      itemsToInsert.push({
        shipmentId: shipment.id,
        productId: item.productId,
        quantity: item.quantity,
        buyPriceKrw: item.buyPriceKrw,
        cargoShareKrw,
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
      id: cargoShipments.id,
      shipmentNumber: cargoShipments.shipmentNumber,
      dateSent: cargoShipments.dateSent,
      dateArrived: cargoShipments.dateArrived,
      status: cargoShipments.status,
      totalCostKrw: cargoShipments.totalCostKrw,
      cargoFeeKrw: cargoShipments.cargoFeeKrw,
      notes: cargoShipments.notes,
      itemsCount: sql<number>`COUNT(DISTINCT ${cargoShipmentItems.id})`.mapWith(Number),
      totalQuantity: sql<number>`COALESCE(SUM(${cargoShipmentItems.quantity}), 0)`.mapWith(Number),
    })
    .from(cargoShipments)
    .leftJoin(
      cargoShipmentItems,
      eq(cargoShipmentItems.shipmentId, cargoShipments.id)
    )
    .where(conditions)
    .groupBy(cargoShipments.id)
    .orderBy(desc(cargoShipments.dateSent))
    .limit(limit)
    .offset(offset)

  const [countRes] = await db
    .select({ count: count() })
    .from(cargoShipments)
    .where(conditions)

  const total = Number(countRes?.count || 0)

  return {
    data: itemsQuery,
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
      imageUrl: sql<string>`${products.imageUrls}->>0`
    })
    .from(cargoShipmentItems)
    .leftJoin(products, eq(cargoShipmentItems.productId, products.id))
    .where(eq(cargoShipmentItems.shipmentId, id))

  const formattedItems = items.map(row => ({
    ...row.item,
    productName: row.productName,
    imageUrl: row.imageUrl,
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
    
    // Auto-create cargo expense
    if (shipment.cargoFeeKrw && shipment.cargoFeeKrw > 0) {
      let [cargoCat] = await tx.select().from(expenseCategories).where(eq(expenseCategories.slug, 'cargo'))
      if (!cargoCat) {
        const [newCat] = await tx.insert(expenseCategories).values({
          name: 'Yuk tashish (Kargo)',
          slug: 'cargo',
          isSystem: true
        }).returning()
        cargoCat = newCat
      }
      
      await tx.insert(expenses).values({
        categoryId: cargoCat.id,
        amountKrw: BigInt(shipment.cargoFeeKrw),
        description: `Kargo: ${shipment.shipmentNumber}`,
        expenseDate: new Date().toISOString().split('T')[0],
        createdBy: arrivedBy,
        referenceType: 'CARGO_SHIPMENT',
        referenceId: id,
      })
    }
    
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

export async function updateCargoShipment(
  id: string,
  data: any
) {
  return await db.transaction(async (tx) => {
    // Only SENT shipments can be edited
    const existing = await tx
      .select()
      .from(cargoShipments)
      .where(eq(cargoShipments.id, id))
      .limit(1)

    if (!existing[0]) {
      throw new Error('Kargo topilmadi')
    }

    // Update shipment header
    await tx.update(cargoShipments)
      .set({
        shipmentNumber: data.shipmentNumber,
        dateSent: new Date(data.dateSent),
        cargoFeeKrw: data.cargoFeeKrw,
        notes: data.notes,
        updatedAt: new Date()
      })
      .where(eq(cargoShipments.id, id))

    // Sync cargo expense
    if (data.cargoFeeKrw !== undefined) {
      // Find existing expense for this cargo
      const existingExpense = await tx
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.referenceType, 'CARGO_SHIPMENT'),
            eq(expenses.referenceId, id)
          )
        )
        .limit(1)

      if (existingExpense.length > 0) {
        // UPDATE existing expense
        await tx.update(expenses)
          .set({
            amountKrw: BigInt(data.cargoFeeKrw),
            description: `Kargo: ${data.shipmentNumber ?? existing[0].shipmentNumber}`,
            updatedAt: new Date()
          })
          .where(eq(expenses.id, existingExpense[0].id))
      } else if (data.cargoFeeKrw > 0) {
        // CREATE new expense if not exists
        let [cargoCat] = await tx
          .select()
          .from(expenseCategories)
          .where(eq(expenseCategories.slug, 'cargo'))

        if (!cargoCat) {
          const [newCat] = await tx
            .insert(expenseCategories)
            .values({
              name: 'Yuk tashish (Kargo)',
              slug: 'cargo',
              isSystem: true
            })
            .returning()
          cargoCat = newCat
        }

        await tx.insert(expenses).values({
          categoryId: cargoCat.id,
          amountKrw: BigInt(data.cargoFeeKrw),
          description: `Kargo: ${data.shipmentNumber ?? existing[0].shipmentNumber}`,
          expenseDate: new Date().toISOString().split('T')[0],
          createdBy: data.updatedBy,
          referenceType: 'CARGO_SHIPMENT',
          referenceId: id,
        })
      }
    }

    if (data.items) {
      const location = existing[0].status === 'ARRIVED' ? 'UZB_STORE' : 'IN_TRANSIT'

      // Get existing IN_TRANSIT batches
      const oldBatches = await tx
        .select()
        .from(inventoryBatches)
        .where(
          and(
            eq(inventoryBatches.location, location),
            sql`batch_ref = ${`CARGO-${existing[0].shipmentNumber}`}`
          )
        )

      // Restore KOR stock for old items
      for (const batch of oldBatches) {
        const korBatch = await tx
          .select()
          .from(inventoryBatches)
          .where(
            and(
              eq(inventoryBatches.productId, batch.productId),
              eq(inventoryBatches.location, 'KOR_WAREHOUSE')
            )
          )
          .limit(1)

        if (korBatch[0]) {
          await tx.update(inventoryBatches)
            .set({
              currentQty: korBatch[0].currentQty + batch.currentQty,
              updatedAt: new Date()
            })
            .where(eq(inventoryBatches.id, korBatch[0].id))
        } else {
          await tx.insert(inventoryBatches)
            .values({
              productId: batch.productId,
              location: 'KOR_WAREHOUSE',
              initialQty: batch.currentQty,
              currentQty: batch.currentQty,
              costPrice: batch.costPrice,
              costCurrency: 'KRW',
              batchRef: 'RESTORED',
              createdAt: new Date(),
              updatedAt: new Date()
            })
        }
      }

      // Delete old IN_TRANSIT batches
      await tx.delete(inventoryBatches)
        .where(
          and(
            eq(inventoryBatches.location, location),
            sql`batch_ref = ${`CARGO-${existing[0].shipmentNumber}`}`
          )
        )

      // Delete old cargo items
      await tx.delete(cargoShipmentItems)
        .where(eq(cargoShipmentItems.shipmentId, id))

      let totalItems = 0
      for (const item of data.items) {
        totalItems += item.quantity
      }

      let totalCostKrw = 0

      // Add new items
      for (const item of data.items) {
        await deductFromKorWarehouse(item.productId, item.quantity, tx)

        const cargoShareKrw = Math.round(data.cargoFeeKrw / totalItems)
        const itemTotalCost = item.buyPriceKrw + cargoShareKrw
        totalCostKrw += itemTotalCost * item.quantity

        await tx.insert(cargoShipmentItems)
          .values({
            shipmentId: id,
            productId: item.productId,
            quantity: item.quantity,
            buyPriceKrw: item.buyPriceKrw,
            cargoShareKrw,
            createdAt: new Date()
          })

        const newLocation = existing[0].status === 'ARRIVED' ? 'UZB_STORE' : 'IN_TRANSIT'

        await tx.insert(inventoryBatches)
          .values({
            productId: item.productId,
            location: newLocation,
            initialQty: item.quantity,
            currentQty: item.quantity,
            costPrice: BigInt(itemTotalCost),
            costCurrency: 'KRW',
            batchRef: `CARGO-${data.shipmentNumber}`,
            createdAt: new Date(),
            updatedAt: new Date()
          })
      }

      // Update totalCostKrw
      await tx.update(cargoShipments)
        .set({ totalCostKrw })
        .where(eq(cargoShipments.id, id))
    }

    return getCargoShipment(id)
  })
}
