CREATE TYPE "role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"login" varchar NOT NULL UNIQUE,
	"password_hash" varchar NOT NULL,
	"role" "role" DEFAULT 'user'::"role" NOT NULL,
	"email" varchar UNIQUE,
	"age" integer,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
