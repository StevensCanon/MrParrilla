create table if not exists public.configuracion_restaurante (
  id smallint primary key default 1 check (id = 1),
  nombre text not null default 'MrParrilla',
  nit text null,
  telefono text null,
  correo text null,
  direccion text null,
  umbral_demora_minutos integer not null default 15
    check (umbral_demora_minutos between 1 and 180),
  intervalo_actualizacion_segundos integer not null default 10
    check (intervalo_actualizacion_segundos between 5 and 120),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid null references public.usuarios(id) on delete set null
);

alter table public.configuracion_restaurante enable row level security;

revoke all on public.configuracion_restaurante from anon, authenticated;

insert into public.configuracion_restaurante (id)
values (1)
on conflict (id) do nothing;
