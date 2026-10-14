CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"password" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "destination_images" (
	"id" text PRIMARY KEY NOT NULL,
	"destination_id" text NOT NULL,
	"url" text NOT NULL,
	"public_id" text,
	"alt" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_hero" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"continent" text NOT NULL,
	"region" text,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"budget_level" text DEFAULT 'mid' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"best_months" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"currency" text DEFAULT 'USD' NOT NULL,
	"language" text,
	"hero_image_url" text,
	"hero_image_public_id" text,
	"average_rating" double precision DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'subscribed' NOT NULL,
	"source" text DEFAULT 'site' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "package_images" (
	"id" text PRIMARY KEY NOT NULL,
	"package_id" text NOT NULL,
	"url" text NOT NULL,
	"public_id" text,
	"alt" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_hero" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text,
	"username" text,
	"bio" text,
	"phone" text,
	"country" text,
	"home_airport" text,
	"avatar_url" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"location" text NOT NULL,
	"avatar_url" text,
	"content" text NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_enquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"subject" text NOT NULL,
	"destination_id" text,
	"package_id" text,
	"travel_date" timestamp with time zone,
	"budget_cents" integer,
	"travellers" integer DEFAULT 1 NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_packages" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"destination_id" text NOT NULL,
	"price_cents" integer NOT NULL,
	"original_price_cents" integer,
	"currency" text DEFAULT 'USD' NOT NULL,
	"duration_days" integer NOT NULL,
	"duration_nights" integer NOT NULL,
	"travel_style" text NOT NULL,
	"max_group_size" integer DEFAULT 12 NOT NULL,
	"min_age" integer DEFAULT 12 NOT NULL,
	"inclusions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exclusions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"itinerary" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hero_image_url" text,
	"hero_image_public_id" text,
	"average_rating" double precision DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"seats_left" integer DEFAULT 0 NOT NULL,
	"departure_months" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destination_images" ADD CONSTRAINT "destination_images_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_images" ADD CONSTRAINT "package_images_package_id_travel_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."travel_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_enquiries" ADD CONSTRAINT "travel_enquiries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_enquiries" ADD CONSTRAINT "travel_enquiries_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_enquiries" ADD CONSTRAINT "travel_enquiries_package_id_travel_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."travel_packages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_packages" ADD CONSTRAINT "travel_packages_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "destination_images_destination_idx" ON "destination_images" USING btree ("destination_id");--> statement-breakpoint
CREATE UNIQUE INDEX "destinations_slug_unique" ON "destinations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "destinations_country_idx" ON "destinations" USING btree ("country");--> statement-breakpoint
CREATE INDEX "destinations_continent_idx" ON "destinations" USING btree ("continent");--> statement-breakpoint
CREATE INDEX "destinations_category_idx" ON "destinations" USING btree ("category");--> statement-breakpoint
CREATE INDEX "destinations_budget_level_idx" ON "destinations" USING btree ("budget_level");--> statement-breakpoint
CREATE INDEX "destinations_published_featured_idx" ON "destinations" USING btree ("is_published","is_featured");--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_entity_unique" ON "favorites" USING btree ("user_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "favorites_user_idx" ON "favorites" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_email_unique" ON "newsletter_subscriptions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "package_images_package_idx" ON "package_images" USING btree ("package_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_user_id_unique" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_username_unique" ON "profiles" USING btree ("username");--> statement-breakpoint
CREATE INDEX "profiles_role_idx" ON "profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "testimonials_published_idx" ON "testimonials" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "travel_enquiries_user_idx" ON "travel_enquiries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "travel_enquiries_status_idx" ON "travel_enquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "travel_enquiries_email_idx" ON "travel_enquiries" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "travel_packages_slug_unique" ON "travel_packages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "travel_packages_destination_idx" ON "travel_packages" USING btree ("destination_id");--> statement-breakpoint
CREATE INDEX "travel_packages_style_idx" ON "travel_packages" USING btree ("travel_style");--> statement-breakpoint
CREATE INDEX "travel_packages_price_idx" ON "travel_packages" USING btree ("price_cents");--> statement-breakpoint
CREATE INDEX "travel_packages_duration_idx" ON "travel_packages" USING btree ("duration_days");--> statement-breakpoint
CREATE INDEX "travel_packages_published_featured_idx" ON "travel_packages" USING btree ("is_published","is_featured");