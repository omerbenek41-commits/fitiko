-- Supabase > SQL Editor'de çalıştır. Her tabloda satır düzeyi güvenlik (RLS) açıktır: kullanıcı yalnızca kendi verisini görür.
create table profiles(id uuid primary key references auth.users on delete cascade,age int,height numeric,weight numeric,target_weight numeric,sex text,activity numeric,goal text,kcal numeric,protein numeric,carb numeric,fat numeric);
create table foods(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users on delete cascade,name text not null,kcal numeric,protein numeric,carb numeric,fat numeric,unit_g numeric default 100,serving_g numeric default 100,favorite boolean default false);
create table entries(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users on delete cascade,day date not null,meal text not null,name text not null,amount numeric,unit text,kcal numeric,protein numeric,carb numeric,fat numeric,created_at timestamptz default now());
create table weights(user_id uuid not null default auth.uid() references auth.users on delete cascade,day date not null,kg numeric not null,primary key(user_id,day));
create table daily(user_id uuid not null default auth.uid() references auth.users on delete cascade,day date not null,water_ml int default 0,steps int default 0,exercise_kcal int default 0,note text,primary key(user_id,day));
create index on entries(user_id,day);
do $$ declare t text; begin foreach t in array array['profiles','foods','entries','weights','daily'] loop
 execute format('alter table %I enable row level security',t);
 execute format('create policy "own" on %I for all using (%s = auth.uid()) with check (%s = auth.uid())',t,case when t='profiles' then 'id' else 'user_id' end,case when t='profiles' then 'id' else 'user_id' end);
end loop; end $$;
