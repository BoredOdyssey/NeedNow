CREATE TYPE "public"."bid_status" AS ENUM('pending', 'accepted', 'not-selected');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'booked', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('pending', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('requester', 'provider');--> statement-breakpoint
CREATE TABLE "bids" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"provider_id" integer NOT NULL,
	"price" integer NOT NULL,
	"hours" integer NOT NULL,
	"status" "bid_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bids_price_positive" CHECK ("bids"."price" > 0),
	CONSTRAINT "bids_hours_positive" CHECK ("bids"."hours" > 0)
);
--> statement-breakpoint
CREATE TABLE "helpline_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"topic" text NOT NULL,
	"status" "ticket_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"recipient_id" integer,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"provider_id" integer NOT NULL,
	"requester_id" integer NOT NULL,
	"rating" smallint NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_task_id_unique" UNIQUE("task_id"),
	CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"requester_id" integer NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"custom_category" text DEFAULT '' NOT NULL,
	"location" text NOT NULL,
	"distance_km" real,
	"budget_inr" integer NOT NULL,
	"needed_by" text NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"image_url" text,
	"status" "task_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_budget_positive" CHECK ("tasks"."budget_inr" > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"role" "user_role" NOT NULL,
	"password_hash" text NOT NULL,
	"salt" text NOT NULL,
	"initials" text NOT NULL,
	"tone" text DEFAULT 'mint' NOT NULL,
	"rating" real DEFAULT 5 NOT NULL,
	"reviews_count" integer DEFAULT 0 NOT NULL,
	"jobs_completed" integer DEFAULT 0 NOT NULL,
	"distance_km" real,
	"hours" integer,
	"price" integer,
	"bio" text DEFAULT '' NOT NULL,
	"services" text[] DEFAULT '{}'::text[] NOT NULL,
	"portfolio" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "helpline_tickets" ADD CONSTRAINT "helpline_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bids_task_provider_idx" ON "bids" USING btree ("task_id","provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bids_one_accepted_per_task_idx" ON "bids" USING btree ("task_id") WHERE "bids"."status" = 'accepted';--> statement-breakpoint
CREATE INDEX "bids_provider_idx" ON "bids" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "messages_task_idx" ON "messages" USING btree ("task_id","created_at");--> statement-breakpoint
CREATE INDEX "reviews_provider_idx" ON "reviews" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_requester_idx" ON "tasks" USING btree ("requester_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_idx" ON "users" USING btree (lower("email"));