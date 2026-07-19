import { db } from '../../config/db'
import { walkInSales, walkInSaleItems, inventoryBatches, products } from '@misoa/db'
import { eq, and, sql, desc, count, asc, sum } from 'drizzle-orm'
import { sendAdminAlert } from '../../bot/helpers/notify'

export async function createWalkInSale(data: {
  paymentType: 'CASH' | 'CARD' | 'DEBT'
  customerName?: string
  customerPhone?: string
  notes?: string
  items: Array<{
    productId: string
    quantity: number
    priceUzs: number
  }>
  createdBy: string
}) {
  return await db.transaction(async (tx) => {
    // 1. Validate each product has enough stock in UZB_STORE location
    // and deduct stock from inventory_batches WHERE location = 'UZB_STORE' (FIFO)
    for (const item of data.items) {
      const batches = await tx
        .select()
        .from(inventoryBatches)
        .where(
          and(
            eq(inventoryBatches.productId, item.productId),
            eq(inventoryBatches.location, 'UZB_STORE'),
            sql`current_qty > 0`
          )
        )
        .orderBy(asc(inventoryBatches.receivedAt))

      let remainingToDeduct = item.quantity
      for (const batch of batches) {
        if (remainingToDeduct <= 0) break
        
        const deductQty = Math.min(batch.currentQty, remainingToDeduct)
        remainingToDeduct -= deductQty
        
        await tx
          .update(inventoryBatches)
          .set({ currentQty: batch.currentQty - deductQty })
          .where(eq(inventoryBatches.id, batch.id))
      }

      if (remainingToDeduct > 0) {
        const [prod] = await tx.select({ name: products.name }).from(products).where(eq(products.id, item.productId))
        throw new Error(`Not enough stock in UZB_STORE for product: ${prod?.name || item.productId}`)
      }
    }

    // 2. Generate sale number: WS-YYYYMMDD-XXX
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
    const [latest] = await tx
      .select({ saleNumber: walkInSales.saleNumber })
      .from(walkInSales)
      .where(sql`sale_number LIKE ${`WS-${dateStr}-%`}`)
      .orderBy(desc(walkInSales.saleNumber))
      .limit(1)
    
    let seq = 1
    if (latest) {
      const lastSeq = parseInt(latest.saleNumber.split('-')[2], 10)
      if (!isNaN(lastSeq)) seq = lastSeq + 1
    }
    const saleNumber = `WS-${dateStr}-${seq.toString().padStart(3, '0')}`

    // 3. Calculate totalAmountUzs
    let totalAmountUzs = 0
    const itemsToInsert = []
    let totalItems = 0

    for (const item of data.items) {
      const itemTotal = item.quantity * item.priceUzs
      totalAmountUzs += itemTotal
      totalItems += item.quantity

      const [prod] = await tx.select({ name: products.name }).from(products).where(eq(products.id, item.productId))

      itemsToInsert.push({
        productId: item.productId,
        productName: prod?.name || 'Unknown',
        quantity: item.quantity,
        priceUzs: item.priceUzs,
        totalUzs: itemTotal,
      })
    }

    // 4. Create walk_in_sales record
    const [sale] = await tx
      .insert(walkInSales)
      .values({
        saleNumber,
        paymentType: data.paymentType,
        totalAmountUzs,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        notes: data.notes,
        createdBy: data.createdBy,
      })
      .returning()

    // 5. Create walk_in_sale_items records
    await tx
      .insert(walkInSaleItems)
      .values(itemsToInsert.map(i => ({ ...i, saleId: sale.id })))

    // 8. Send Telegram notification
    let msg = `🛍 Yangi sotuv!\n` +
      `💰 ${totalAmountUzs.toLocaleString()} UZS\n` +
      `💳 ${data.paymentType === 'CASH' ? 'NAQD' : data.paymentType === 'CARD' ? 'KARTA' : 'NASIYA'}\n` +
      `📦 ${totalItems} ta mahsulot`
    
    if (data.paymentType === 'DEBT') {
      msg += `\n👤 Mijoz: ${data.customerName} ${data.customerPhone}`
    }

    await sendAdminAlert(msg)

    return sale
  })
}

export async function getWalkInSales(params: {
  paymentType?: string
  from?: Date
  to?: Date
  page: number
  limit: number
}) {
  const { page, limit, paymentType, from, to } = params
  const offset = (page - 1) * limit
  
  let conditions: any = sql`1=1`
  if (paymentType) {
    conditions = and(conditions, eq(walkInSales.paymentType, paymentType))
  }
  if (from) {
    conditions = and(conditions, sql`${walkInSales.createdAt} >= ${from.toISOString()}`)
  }
  if (to) {
    conditions = and(conditions, sql`${walkInSales.createdAt} <= ${to.toISOString()}`)
  }

  const data = await db
    .select()
    .from(walkInSales)
    .where(conditions)
    .orderBy(desc(walkInSales.createdAt))
    .limit(limit)
    .offset(offset)

  const [countRes] = await db
    .select({ count: count() })
    .from(walkInSales)
    .where(conditions)

  const total = Number(countRes?.count || 0)

  return { data, total }
}

export async function getWalkInSale(id: string) {
  const [sale] = await db
    .select()
    .from(walkInSales)
    .where(eq(walkInSales.id, id))
  
  if (!sale) return null

  const items = await db
    .select({
      item: walkInSaleItems,
      productImage: sql`${products.imageUrls}[1]`,
    })
    .from(walkInSaleItems)
    .leftJoin(products, eq(walkInSaleItems.productId, products.id))
    .where(eq(walkInSaleItems.saleId, id))

  const formattedItems = items.map(row => ({
    ...row.item,
    productImage: row.productImage,
  }))

  return {
    ...sale,
    items: formattedItems
  }
}

export async function getWalkInSalesSummary(params: { from: Date; to: Date }) {
  const { from, to } = params

  const sales = await db
    .select({
      paymentType: walkInSales.paymentType,
      totalAmount: sum(walkInSales.totalAmountUzs),
      count: count(walkInSales.id)
    })
    .from(walkInSales)
    .where(
      and(
        sql`${walkInSales.createdAt} >= ${from.toISOString()}`,
        sql`${walkInSales.createdAt} <= ${to.toISOString()}`
      )
    )
    .groupBy(walkInSales.paymentType)

  let totalCash = 0
  let totalCard = 0
  let totalDebt = 0
  let totalSales = 0

  for (const s of sales) {
    const amount = Number(s.totalAmount || 0)
    totalSales += Number(s.count || 0)
    if (s.paymentType === 'CASH') totalCash += amount
    else if (s.paymentType === 'CARD') totalCard += amount
    else if (s.paymentType === 'DEBT') totalDebt += amount
  }

  const totalRevenue = totalCash + totalCard + totalDebt

  return {
    totalCash,
    totalCard,
    totalDebt,
    totalRevenue,
    totalSales
  }
}
