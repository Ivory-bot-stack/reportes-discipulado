import { crearClienteServidor } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { etiquetaSemana, dinero, porcentaje } from '@/lib/fechas';
import { cargarFotos } from '@/lib/fotos';
import Fotos from '@/components/Fotos';
import Formulario from './Formulario';

export default async function PaginaReporte() {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: perfil } = await supabase.from('perfiles').select('nombre,rol').eq('id', user.id).single();
  if (perfil.rol === 'ADMIN') redirect('/admin');

  // El servidor decide el mentor a partir de la sesión, nunca del navegador.
  const { data: id, error } = await supabase.rpc('obtener_reporte_semana');
  if (error || !id) return <div className="aviso">Tu usuario todavía no está asignado como mentor. Avisa al pastor.</div>;

  const { data: r } = await supabase.from('reportes').select('*').eq('id', id).single();
  const { data: filas } = await supabase.from('asistencias').select('id, asistio, personas(nombre, tipo)').eq('reporte_id', id);
  const asistencias = (filas || []).sort((a, b) => a.personas.nombre.localeCompare(b.personas.nombre));
  const fotos = await cargarFotos(supabase, id);
  const semana = etiquetaSemana(r.semana_inicio);
  const nombre = perfil.nombre.split(' ')[0];

  if (r.estado !== 'BORRADOR') {
    return (
      <>
        <div className="hecho"><div className="ck">✓</div><h1>Reporte {r.estado === 'REVISADO' ? 'revisado' : 'enviado'}</h1>
          <p className="sub">Semana: {semana}</p></div>
        <div className="sec">
          <div className="resumen"><span>Discípulos</span><b>{r.disc_asistentes}/{r.disc_esperados}</b></div>
          <div className="resumen"><span>Asistencia</span><b>{porcentaje(r.total_asistentes, r.total_esperados)}%</b></div>
          <div className="resumen"><span>Ofrenda</span><b>{dinero(r.ofrenda)}</b></div>
          <div className="resumen"><span>Diezmos</span><b>{dinero(r.diezmos)}</b></div>
        </div>
        {fotos.length > 0 && <div className="sec"><h2>Fotos</h2><Fotos reporteId={id} inicial={fotos} /></div>}
        <div className="lock">🔒 Este reporte ya no se puede modificar. Si necesitas corregirlo, pídele al pastor que autorice la edición.</div>
      </>
    );
  }
  return (
    <>
      <div className="hola"><h1>Hola, {nombre} 👋</h1><p>Reporte de discipulado</p><span className="semana">Semana: {semana}</span></div>
      {r.edicion_autorizada && <div className="aviso">El pastor autorizó que corrijas este reporte. Cuando termines, envíalo de nuevo.</div>}
      <Formulario reporte={r} asistencias={asistencias} fotos={fotos} />
    </>
  );
}
