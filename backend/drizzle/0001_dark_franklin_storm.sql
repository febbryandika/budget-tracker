ALTER TABLE "categories" ADD COLUMN "icon" text DEFAULT 'tag' NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "type" text DEFAULT 'expense' NOT NULL;