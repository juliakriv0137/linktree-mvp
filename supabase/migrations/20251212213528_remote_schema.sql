


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."click_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "link_id" "uuid" NOT NULL,
    "destination" "text" NOT NULL,
    "referrer" "text",
    "user_agent" "text",
    "ip" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."click_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."links" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "url" "text" NOT NULL,
    "position" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "site_id" "uuid" NOT NULL,
    "slug" "text" DEFAULT 'home'::"text" NOT NULL,
    "title" "text" DEFAULT 'Home'::"text" NOT NULL,
    "blocks" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "display_name" "text",
    "bio" "text",
    "avatar_url" "text",
    "theme" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "site_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."site_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sites" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "theme" "jsonb" DEFAULT '{"bg": "#0b0b0f", "card": "#12121a", "text": "#ffffff", "muted": "#a1a1aa", "accent": "#e92063", "radius": 18}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sites" OWNER TO "postgres";


ALTER TABLE ONLY "public"."click_events"
    ADD CONSTRAINT "click_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."links"
    ADD CONSTRAINT "links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pages"
    ADD CONSTRAINT "pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pages"
    ADD CONSTRAINT "pages_site_id_slug_key" UNIQUE ("site_id", "slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."site_blocks"
    ADD CONSTRAINT "site_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sites"
    ADD CONSTRAINT "sites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sites"
    ADD CONSTRAINT "sites_slug_key" UNIQUE ("slug");



CREATE INDEX "click_events_link_id_created_at_idx" ON "public"."click_events" USING "btree" ("link_id", "created_at" DESC);



CREATE INDEX "links_profile_id_position_idx" ON "public"."links" USING "btree" ("profile_id", "position");



CREATE INDEX "profiles_username_idx" ON "public"."profiles" USING "btree" ("username");



CREATE OR REPLACE TRIGGER "trg_links_updated_at" BEFORE UPDATE ON "public"."links" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."click_events"
    ADD CONSTRAINT "click_events_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."links"
    ADD CONSTRAINT "links_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pages"
    ADD CONSTRAINT "pages_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_blocks"
    ADD CONSTRAINT "site_blocks_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE CASCADE;



CREATE POLICY "Public read sites" ON "public"."sites" FOR SELECT USING (true);



CREATE POLICY "Public read visible blocks" ON "public"."site_blocks" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Users manage blocks of own sites" ON "public"."site_blocks" USING (("site_id" IN ( SELECT "sites"."id"
   FROM "public"."sites"
  WHERE ("sites"."owner_id" = "auth"."uid"())))) WITH CHECK (("site_id" IN ( SELECT "sites"."id"
   FROM "public"."sites"
  WHERE ("sites"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Users manage own site" ON "public"."sites" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



ALTER TABLE "public"."click_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "click_events_owner_select" ON "public"."click_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."links" "l"
  WHERE (("l"."id" = "click_events"."link_id") AND ("l"."profile_id" = "auth"."uid"())))));



CREATE POLICY "click_events_public_insert" ON "public"."click_events" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



ALTER TABLE "public"."links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "links_owner_all" ON "public"."links" TO "authenticated" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "links_public_read_active" ON "public"."links" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



ALTER TABLE "public"."pages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pages_owner_all" ON "public"."pages" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."sites" "s"
  WHERE (("s"."id" = "pages"."site_id") AND ("s"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sites" "s"
  WHERE (("s"."id" = "pages"."site_id") AND ("s"."owner_id" = "auth"."uid"())))));



CREATE POLICY "pages_public_read" ON "public"."pages" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_public_read" ON "public"."profiles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."site_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sites_owner_all" ON "public"."sites" TO "authenticated" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "sites_public_read" ON "public"."sites" FOR SELECT TO "authenticated", "anon" USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."click_events" TO "anon";
GRANT ALL ON TABLE "public"."click_events" TO "authenticated";
GRANT ALL ON TABLE "public"."click_events" TO "service_role";



GRANT ALL ON TABLE "public"."links" TO "anon";
GRANT ALL ON TABLE "public"."links" TO "authenticated";
GRANT ALL ON TABLE "public"."links" TO "service_role";



GRANT ALL ON TABLE "public"."pages" TO "anon";
GRANT ALL ON TABLE "public"."pages" TO "authenticated";
GRANT ALL ON TABLE "public"."pages" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."site_blocks" TO "anon";
GRANT ALL ON TABLE "public"."site_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."site_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."sites" TO "anon";
GRANT ALL ON TABLE "public"."sites" TO "authenticated";
GRANT ALL ON TABLE "public"."sites" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































