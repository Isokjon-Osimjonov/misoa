-- Settings columns from 0006
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS
    kor_bank_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS
    kor_bank_name varchar(200),
  ADD COLUMN IF NOT EXISTS
    kor_bank_holder varchar(200),
  ADD COLUMN IF NOT EXISTS
    kor_bank_number varchar(100),
  ADD COLUMN IF NOT EXISTS
    uzb_bank_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS
    uzb_bank_name varchar(200),
  ADD COLUMN IF NOT EXISTS
    uzb_bank_holder varchar(200),
  ADD COLUMN IF NOT EXISTS
    uzb_bank_number varchar(100),
  ADD COLUMN IF NOT EXISTS
    e9pay_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS
    e9pay_account varchar(100);

-- Settings columns from 0007
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS
    standard_shipping_fee_krw
    integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS
    free_shipping_threshold_krw
    integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS
    low_stock_threshold
    integer DEFAULT 10;

-- Fix orders table missing columns
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS
    payment_mode varchar(20)
    DEFAULT 'BANK_TRANSFER',
  ADD COLUMN IF NOT EXISTS
    order_discount_pct numeric(5,2)
    DEFAULT 0,
  ADD COLUMN IF NOT EXISTS
    order_discount_flat integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS
    box_cost_krw integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS
    payment_currency varchar(10)
    DEFAULT 'KRW',
  ADD COLUMN IF NOT EXISTS
    payment_amount_uzs bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS
    admin_note text,
  ADD COLUMN IF NOT EXISTS
    created_by uuid,
  ADD COLUMN IF NOT EXISTS
    refund_amount integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS
    refunded_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS
    refunded_by uuid,
  ADD COLUMN IF NOT EXISTS
    refund_requested_at
    timestamp with time zone,
  ADD COLUMN IF NOT EXISTS
    refund_note text,
  ADD COLUMN IF NOT EXISTS
    delivery_covered_by varchar(20),
  ADD COLUMN IF NOT EXISTS
    delivery_fee_actual integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS
    delivery_fee_charged integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS
    cargo_date_id uuid,
  ADD COLUMN IF NOT EXISTS
    estimated_delivery_start
    timestamp with time zone,
  ADD COLUMN IF NOT EXISTS
    estimated_delivery_end
    timestamp with time zone,
  ADD COLUMN IF NOT EXISTS
    customer_note text,
  ADD COLUMN IF NOT EXISTS
    box_price_snapshot integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS
    box_weight_snapshot numeric(8,3)
    DEFAULT 0,
  ADD COLUMN IF NOT EXISTS
    rate_snapshot_id uuid,
  ADD COLUMN IF NOT EXISTS
    coupon_id uuid,
  ADD COLUMN IF NOT EXISTS
    coupon_code varchar(50),
  ADD COLUMN IF NOT EXISTS
    order_source varchar(20)
    DEFAULT 'STOREFRONT';

SELECT 'Schema fixed ✅' as status;
