ALTER INDEX "users_active_idx" RENAME TO "users_active_filters_idx";--> statement-breakpoint
DROP INDEX "users_active_filters_idx";--> statement-breakpoint
CREATE INDEX "users_active_filters_idx" ON "users" ("age","created_at") WHERE "deleted_at" IS NULL
        AND "avatars_count" > 2
        AND "description" IS NOT NULL
        AND "description" <> '' ;--> statement-breakpoint
CREATE INDEX "avatars_users_latest_idx" ON "avatars" ("user_id","created_at") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "users_active_created_at_idx" ON "users" ("created_at") WHERE "deleted_at" IS NULL
        AND "avatars_count" > 2
        AND "description" IS NOT NULL
        AND "description" <> '' ;