DO $$ BEGIN
 CREATE TYPE "public"."status" AS ENUM('Inactive', 'Active');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Plan" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"amount" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"interval" varchar(10) NOT NULL,
	"trial_period" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Subscription" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"userId" varchar(36) NOT NULL,
	"planId" varchar(36) NOT NULL,
	"status" "status" DEFAULT 'Inactive' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_Plan_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."Plan"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
