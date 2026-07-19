CREATE TABLE "cargo_shipment_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"buy_price_krw" integer DEFAULT 0,
	"cargo_share_krw" integer DEFAULT 0,
	"sell_price_uzs" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cargo_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_number" varchar(50) NOT NULL,
	"date_sent" timestamp with time zone NOT NULL,
	"date_arrived" timestamp with time zone,
	"status" varchar(20) DEFAULT 'SENT' NOT NULL,
	"total_cost_krw" integer DEFAULT 0,
	"cargo_fee_krw" integer DEFAULT 0,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "walk_in_sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(300) NOT NULL,
	"quantity" integer NOT NULL,
	"price_uzs" integer NOT NULL,
	"total_uzs" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "walk_in_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_number" varchar(50) NOT NULL,
	"payment_type" varchar(20) NOT NULL,
	"total_amount_uzs" integer NOT NULL,
	"customer_name" varchar(200),
	"customer_phone" varchar(20),
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD COLUMN "location" varchar(20) DEFAULT 'KOR_WAREHOUSE' NOT NULL;--> statement-breakpoint
ALTER TABLE "cargo_shipment_items" ADD CONSTRAINT "cargo_shipment_items_shipment_id_cargo_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."cargo_shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cargo_shipment_items" ADD CONSTRAINT "cargo_shipment_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "walk_in_sale_items" ADD CONSTRAINT "walk_in_sale_items_sale_id_walk_in_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."walk_in_sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "walk_in_sale_items" ADD CONSTRAINT "walk_in_sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;