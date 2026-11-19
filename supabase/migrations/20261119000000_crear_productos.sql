-- Mini Inventario: tabla productos con Row Level Security.
-- Según docs/diseno.md. Cada usuario solo puede ver y modificar sus propias filas.

create table if not exists public.productos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre      text not null check (char_length(nombre) between 1 and 100),
  sku         text not null check (char_length(sku) between 1 and 50),
  cantidad    integer not null default 0 check (cantidad >= 0),
  minimo      integer not null default 0 check (minimo >= 0),
  created_at  timestamptz not null default now(),
  constraint productos_user_sku_unico unique (user_id, sku)
);

comment on table public.productos is 'Inventario de Mini Inventario; cada fila pertenece a un usuario (RLS).';

-- Las políticas filtran por user_id: un índice evita revisar toda la tabla.
create index if not exists productos_user_id_idx on public.productos (user_id);

alter table public.productos enable row level security;

-- Solo usuarios con sesión (rol authenticated). (select auth.uid()) se evalúa una vez por consulta.
create policy "productos_select_propios"
  on public.productos for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "productos_insert_propios"
  on public.productos for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "productos_update_propios"
  on public.productos for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "productos_delete_propios"
  on public.productos for delete
  to authenticated
  using ((select auth.uid()) = user_id);
