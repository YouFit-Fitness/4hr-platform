CREATE TABLE "nutrition_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"calories" integer,
	"protein" integer,
	"carbs" integer,
	"fat" integer,
	"meal_guidance" text DEFAULT '' NOT NULL,
	"coach_notes" text DEFAULT '' NOT NULL,
	"adherence" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "nutrition_plans" ADD CONSTRAINT "nutrition_plans_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;