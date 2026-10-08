-- GESTION DE PERSONAS: único cambio de base de datos.
-- Reemplaza la función obtener_reporte_semana (mismo nombre y parámetros).
-- Novedad: en un reporte BORRADOR, quita las filas de asistencia de personas
-- que ya no son del mentor o están inactivas (reasignadas/desactivadas).
-- NO toca reportes ENVIADO/REVISADO, así que el historial queda intacto.
create or replace function public.obtener_reporte_semana(
  p_fecha date default current_date)
returns bigint language plpgsql security definer
set search_path = public as $$
declare v_mentor bigint; v_grupo bigint; v_id bigint;
        v_estado text; v_semana date;
begin
  v_mentor := mi_mentor_id();
  if v_mentor is null then raise exception 'No autorizado'; end if;
  v_semana := lunes_de(p_fecha);
  select id, estado into v_id, v_estado from reportes
    where mentor_id = v_mentor and semana_inicio = v_semana;
  if v_id is null then
    select grupo_id into v_grupo from mentores where id = v_mentor;
    insert into reportes(mentor_id, grupo_id, semana_inicio)
      values (v_mentor, v_grupo, v_semana)
      returning id, estado into v_id, v_estado;
  end if;
  if v_estado = 'BORRADOR' then
    delete from asistencias a where a.reporte_id = v_id
      and not exists (select 1 from personas p where p.id = a.persona_id
                      and p.mentor_id = v_mentor and p.activo);
    insert into asistencias(reporte_id, persona_id)
      select v_id, id from personas
      where mentor_id = v_mentor and activo
      on conflict do nothing;
  end if;
  return v_id;
end $$;
