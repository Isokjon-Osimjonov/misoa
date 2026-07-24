import { pgTable, uuid, varchar, integer, timestamp, text, numeric } from 'drizzle-orm/pg-core'
import { products } from './products'

export const cargoShipments = pgTable(
  'cargo_shipments', {
  id: uuid('id')
    .primaryKey()
    .defaultRandom(),
  shipmentNumber: varchar(
    'shipment_number', { length: 50 })
    .notNull(),
  dateSent: timestamp('date_sent',
    { withTimezone: true })
    .notNull(),
  dateArrived: timestamp('date_arrived',
    { withTimezone: true }),
  status: varchar('status',
    { length: 20 })
    .default('SENT')
    .notNull(),
  // SENT, ARRIVED, CANCELLED
  totalCostKrw: integer(
    'total_cost_krw').default(0),
  cargoFeeKrw: integer(
    'cargo_fee_krw').default(0),
  notes: text('notes'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at',
    { withTimezone: true })
    .defaultNow().notNull(),
  updatedAt: timestamp('updated_at',
    { withTimezone: true })
    .defaultNow().notNull(),
})

export const cargoShipmentItems = pgTable(
  'cargo_shipment_items', {
  id: uuid('id')
    .primaryKey()
    .defaultRandom(),
  shipmentId: uuid('shipment_id')
    .notNull()
    .references(() =>
      cargoShipments.id,
      { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity')
    .notNull(),
  buyPriceKrw: integer('buy_price_krw')
    .default(0),
  cargoShareKrw: integer(
    'cargo_share_krw').default(0),
  createdAt: timestamp('created_at',
    { withTimezone: true })
    .defaultNow().notNull(),
})
