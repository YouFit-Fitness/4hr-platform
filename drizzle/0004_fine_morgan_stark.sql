ALTER TABLE "clients" ADD COLUMN "invite_code" text;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_invite_code_unique" UNIQUE("invite_code");