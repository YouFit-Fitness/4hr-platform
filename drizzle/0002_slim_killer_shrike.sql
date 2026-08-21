ALTER TABLE "exercises" ADD COLUMN "equipment" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "movement_category" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "program_exercises" ADD COLUMN "tempo" text;