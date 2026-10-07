-- FOTOS: tabla, almacenamiento privado y reglas de privacidad
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reportes-fotos', 'reportes-fotos', false, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create table public.fotos (
  id bigint generated always as identity primary key,
  reporte_id bigint not null references public.reportes(id) on delete cascade,
  ruta text not null unique,
  created_at timestamptz not null default now()
);
create index on public.fotos(reporte_id);

-- Máximo 6 fotos por reporte
create or replace function public.limitar_fotos()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if (select count(*) from fotos where reporte_id = new.reporte_id) >= 6 then
    raise exception 'Máximo 6 fotos por reporte';
  end if;
  return new;
end $$;
revoke execute on function public.limitar_fotos() from public, anon;
create trigger fotos_limite before insert on public.fotos
for each row execute function public.limitar_fotos();

alter table public.fotos enable row level security;
revoke all on public.fotos from anon;
revoke update on public.fotos from authenticated;

-- Ver: las del reporte propio (el admin ve todas)
create policy fotos_ver on public.fotos for select to authenticated
  using (reporte_id in (select id from public.reportes));
-- Agregar y quitar: solo en reportes propios que sigan en borrador
create policy fotos_agregar on public.fotos for insert to authenticated
  with check (reporte_id in (select id from public.reportes
    where estado = 'BORRADOR' and mentor_id = public.mi_mentor_id()));
create policy fotos_quitar on public.fotos for delete to authenticated
  using (reporte_id in (select id from public.reportes
    where estado = 'BORRADOR' and mentor_id = public.mi_mentor_id()));

-- Archivos: carpeta = id del reporte
create policy fotos_archivos_ver on storage.objects for select to authenticated
  using (bucket_id = 'reportes-fotos'
    and (storage.foldername(name))[1] in (select id::text from public.reportes));
create policy fotos_archivos_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'reportes-fotos'
    and (storage.foldername(name))[1] in (select id::text from public.reportes
      where estado = 'BORRADOR' and mentor_id = public.mi_mentor_id()));
create policy fotos_archivos_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'reportes-fotos'
    and (storage.foldername(name))[1] in (select id::text from public.reportes
      where estado = 'BORRADOR' and mentor_id = public.mi_mentor_id()));
