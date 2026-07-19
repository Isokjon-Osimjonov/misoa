import { pgTable, uuid, varchar, integer, timestamp, text } from 'drizzle-orm/pg-core'
import { products } from './products'

export const walkInSales = pgTable(
  'walk_in_sales', {
  id: uuid('id')
    .primaryKey()
    .defaultRandom(),
  saleNumber: varchar('sale_number',
    { length: 50 }).notNull(),
  paymentType: varchar('payment_type',
    { length: 20 }).notNull(),
  // CASH, CARD, DEBT
  totalAmountUzs: integer(
    'total_amount_uzs').notNull(),
  customerName: varchar('customer_name',
    { length: 200 }),
  customerPhone: varchar('customer_phone',
    { length: 20 }),
  notes: text('notes'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at',
    { withTimezone: true })
    .defaultNow().notNull(),
})

export const walkInSaleItems = pgTable(
  'walk_in_sale_items', {
  id: uuid('id')
    .primaryKey()
    .defaultRandom(),
  saleId: uuid('sale_id')
    .notNull()
    .references(() =>
      walkInSales.id,
      { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  productName: varchar('product_name',
    { length: 300 }).notNull(),
  quantity: integer('quantity')
    .notNull(),
  priceUzs: integer('price_uzs')
    .notNull(),
  totalUzs: integer('total_uzs')
    .notNull(),
  createdAt: timestamp('created_at',
    { withTimezone: true })
    .defaultNow().notNull(),
})
