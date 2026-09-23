ALTER TABLE "users" ALTER COLUMN "balance" SET DATA TYPE numeric(12,2) USING "balance"::numeric(12,2);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "balance" SET DEFAULT '0.00';