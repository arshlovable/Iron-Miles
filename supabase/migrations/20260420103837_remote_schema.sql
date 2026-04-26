drop extension if exists "pg_net";


  create table "public"."exercises" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "category" text not null,
    "equipment_type" text not null default 'bodyweight'::text,
    "workout_style" text,
    "sets_default" integer,
    "reps_default" text,
    "instruction_text" text,
    "video_url" text,
    "thumbnail_url" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."exercises" enable row level security;


  create table "public"."generated_workout_exercises" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "generated_workout_id" uuid not null,
    "exercise_id" uuid not null,
    "exercise_order" integer not null,
    "sets_assigned" integer,
    "reps_assigned" text,
    "instruction_override" text
      );


alter table "public"."generated_workout_exercises" enable row level security;


  create table "public"."generated_workouts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "title" text not null,
    "target_area" text not null,
    "equipment_selected" jsonb default '[]'::jsonb,
    "duration_minutes" integer not null,
    "workout_style" text,
    "iron_miles_reward" integer default 0,
    "status" text default 'ready'::text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."generated_workouts" enable row level security;


  create table "public"."iron_miles_log" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "source_type" text not null,
    "source_id" uuid,
    "miles_amount" integer not null,
    "note" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."iron_miles_log" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "auth_user_id" uuid,
    "full_name" text,
    "primary_goal" text,
    "experience_level" text,
    "truck_type" text,
    "available_equipment" jsonb default '[]'::jsonb,
    "pain_areas" jsonb default '[]'::jsonb,
    "lifetime_iron_miles" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."workout_sessions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "generated_workout_id" uuid,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "status" text default 'started'::text,
    "iron_miles_earned" integer default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."workout_sessions" enable row level security;

CREATE UNIQUE INDEX exercises_pkey ON public.exercises USING btree (id);

CREATE UNIQUE INDEX generated_workout_exercises_pkey ON public.generated_workout_exercises USING btree (id);

CREATE UNIQUE INDEX generated_workouts_pkey ON public.generated_workouts USING btree (id);

CREATE INDEX idx_exercises_category ON public.exercises USING btree (category);

CREATE INDEX idx_exercises_equipment ON public.exercises USING btree (equipment_type);

CREATE INDEX idx_generated_workouts_status ON public.generated_workouts USING btree (status);

CREATE INDEX idx_generated_workouts_user ON public.generated_workouts USING btree (user_id);

CREATE INDEX idx_iron_miles_log_source ON public.iron_miles_log USING btree (source_type);

CREATE INDEX idx_iron_miles_log_user ON public.iron_miles_log USING btree (user_id);

CREATE INDEX idx_workout_exercises_workout ON public.generated_workout_exercises USING btree (generated_workout_id);

CREATE INDEX idx_workout_sessions_status ON public.workout_sessions USING btree (status);

CREATE INDEX idx_workout_sessions_user ON public.workout_sessions USING btree (user_id);

CREATE UNIQUE INDEX iron_miles_log_pkey ON public.iron_miles_log USING btree (id);

CREATE UNIQUE INDEX profiles_auth_user_id_key ON public.profiles USING btree (auth_user_id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX workout_sessions_pkey ON public.workout_sessions USING btree (id);

alter table "public"."exercises" add constraint "exercises_pkey" PRIMARY KEY using index "exercises_pkey";

alter table "public"."generated_workout_exercises" add constraint "generated_workout_exercises_pkey" PRIMARY KEY using index "generated_workout_exercises_pkey";

alter table "public"."generated_workouts" add constraint "generated_workouts_pkey" PRIMARY KEY using index "generated_workouts_pkey";

alter table "public"."iron_miles_log" add constraint "iron_miles_log_pkey" PRIMARY KEY using index "iron_miles_log_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."workout_sessions" add constraint "workout_sessions_pkey" PRIMARY KEY using index "workout_sessions_pkey";

alter table "public"."generated_workout_exercises" add constraint "generated_workout_exercises_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE not valid;

alter table "public"."generated_workout_exercises" validate constraint "generated_workout_exercises_exercise_id_fkey";

alter table "public"."generated_workout_exercises" add constraint "generated_workout_exercises_generated_workout_id_fkey" FOREIGN KEY (generated_workout_id) REFERENCES public.generated_workouts(id) ON DELETE CASCADE not valid;

alter table "public"."generated_workout_exercises" validate constraint "generated_workout_exercises_generated_workout_id_fkey";

alter table "public"."generated_workouts" add constraint "generated_workouts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."generated_workouts" validate constraint "generated_workouts_user_id_fkey";

alter table "public"."iron_miles_log" add constraint "iron_miles_log_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."iron_miles_log" validate constraint "iron_miles_log_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_auth_user_id_key" UNIQUE using index "profiles_auth_user_id_key";

alter table "public"."workout_sessions" add constraint "workout_sessions_generated_workout_id_fkey" FOREIGN KEY (generated_workout_id) REFERENCES public.generated_workouts(id) ON DELETE SET NULL not valid;

alter table "public"."workout_sessions" validate constraint "workout_sessions_generated_workout_id_fkey";

alter table "public"."workout_sessions" add constraint "workout_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."workout_sessions" validate constraint "workout_sessions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."exercises" to "anon";

grant insert on table "public"."exercises" to "anon";

grant references on table "public"."exercises" to "anon";

grant select on table "public"."exercises" to "anon";

grant trigger on table "public"."exercises" to "anon";

grant truncate on table "public"."exercises" to "anon";

grant update on table "public"."exercises" to "anon";

grant delete on table "public"."exercises" to "authenticated";

grant insert on table "public"."exercises" to "authenticated";

grant references on table "public"."exercises" to "authenticated";

grant select on table "public"."exercises" to "authenticated";

grant trigger on table "public"."exercises" to "authenticated";

grant truncate on table "public"."exercises" to "authenticated";

grant update on table "public"."exercises" to "authenticated";

grant delete on table "public"."exercises" to "service_role";

grant insert on table "public"."exercises" to "service_role";

grant references on table "public"."exercises" to "service_role";

grant select on table "public"."exercises" to "service_role";

grant trigger on table "public"."exercises" to "service_role";

grant truncate on table "public"."exercises" to "service_role";

grant update on table "public"."exercises" to "service_role";

grant delete on table "public"."generated_workout_exercises" to "anon";

grant insert on table "public"."generated_workout_exercises" to "anon";

grant references on table "public"."generated_workout_exercises" to "anon";

grant select on table "public"."generated_workout_exercises" to "anon";

grant trigger on table "public"."generated_workout_exercises" to "anon";

grant truncate on table "public"."generated_workout_exercises" to "anon";

grant update on table "public"."generated_workout_exercises" to "anon";

grant delete on table "public"."generated_workout_exercises" to "authenticated";

grant insert on table "public"."generated_workout_exercises" to "authenticated";

grant references on table "public"."generated_workout_exercises" to "authenticated";

grant select on table "public"."generated_workout_exercises" to "authenticated";

grant trigger on table "public"."generated_workout_exercises" to "authenticated";

grant truncate on table "public"."generated_workout_exercises" to "authenticated";

grant update on table "public"."generated_workout_exercises" to "authenticated";

grant delete on table "public"."generated_workout_exercises" to "service_role";

grant insert on table "public"."generated_workout_exercises" to "service_role";

grant references on table "public"."generated_workout_exercises" to "service_role";

grant select on table "public"."generated_workout_exercises" to "service_role";

grant trigger on table "public"."generated_workout_exercises" to "service_role";

grant truncate on table "public"."generated_workout_exercises" to "service_role";

grant update on table "public"."generated_workout_exercises" to "service_role";

grant delete on table "public"."generated_workouts" to "anon";

grant insert on table "public"."generated_workouts" to "anon";

grant references on table "public"."generated_workouts" to "anon";

grant select on table "public"."generated_workouts" to "anon";

grant trigger on table "public"."generated_workouts" to "anon";

grant truncate on table "public"."generated_workouts" to "anon";

grant update on table "public"."generated_workouts" to "anon";

grant delete on table "public"."generated_workouts" to "authenticated";

grant insert on table "public"."generated_workouts" to "authenticated";

grant references on table "public"."generated_workouts" to "authenticated";

grant select on table "public"."generated_workouts" to "authenticated";

grant trigger on table "public"."generated_workouts" to "authenticated";

grant truncate on table "public"."generated_workouts" to "authenticated";

grant update on table "public"."generated_workouts" to "authenticated";

grant delete on table "public"."generated_workouts" to "service_role";

grant insert on table "public"."generated_workouts" to "service_role";

grant references on table "public"."generated_workouts" to "service_role";

grant select on table "public"."generated_workouts" to "service_role";

grant trigger on table "public"."generated_workouts" to "service_role";

grant truncate on table "public"."generated_workouts" to "service_role";

grant update on table "public"."generated_workouts" to "service_role";

grant delete on table "public"."iron_miles_log" to "anon";

grant insert on table "public"."iron_miles_log" to "anon";

grant references on table "public"."iron_miles_log" to "anon";

grant select on table "public"."iron_miles_log" to "anon";

grant trigger on table "public"."iron_miles_log" to "anon";

grant truncate on table "public"."iron_miles_log" to "anon";

grant update on table "public"."iron_miles_log" to "anon";

grant delete on table "public"."iron_miles_log" to "authenticated";

grant insert on table "public"."iron_miles_log" to "authenticated";

grant references on table "public"."iron_miles_log" to "authenticated";

grant select on table "public"."iron_miles_log" to "authenticated";

grant trigger on table "public"."iron_miles_log" to "authenticated";

grant truncate on table "public"."iron_miles_log" to "authenticated";

grant update on table "public"."iron_miles_log" to "authenticated";

grant delete on table "public"."iron_miles_log" to "service_role";

grant insert on table "public"."iron_miles_log" to "service_role";

grant references on table "public"."iron_miles_log" to "service_role";

grant select on table "public"."iron_miles_log" to "service_role";

grant trigger on table "public"."iron_miles_log" to "service_role";

grant truncate on table "public"."iron_miles_log" to "service_role";

grant update on table "public"."iron_miles_log" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."workout_sessions" to "anon";

grant insert on table "public"."workout_sessions" to "anon";

grant references on table "public"."workout_sessions" to "anon";

grant select on table "public"."workout_sessions" to "anon";

grant trigger on table "public"."workout_sessions" to "anon";

grant truncate on table "public"."workout_sessions" to "anon";

grant update on table "public"."workout_sessions" to "anon";

grant delete on table "public"."workout_sessions" to "authenticated";

grant insert on table "public"."workout_sessions" to "authenticated";

grant references on table "public"."workout_sessions" to "authenticated";

grant select on table "public"."workout_sessions" to "authenticated";

grant trigger on table "public"."workout_sessions" to "authenticated";

grant truncate on table "public"."workout_sessions" to "authenticated";

grant update on table "public"."workout_sessions" to "authenticated";

grant delete on table "public"."workout_sessions" to "service_role";

grant insert on table "public"."workout_sessions" to "service_role";

grant references on table "public"."workout_sessions" to "service_role";

grant select on table "public"."workout_sessions" to "service_role";

grant trigger on table "public"."workout_sessions" to "service_role";

grant truncate on table "public"."workout_sessions" to "service_role";

grant update on table "public"."workout_sessions" to "service_role";

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


