import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { cargarFotos } from '@/lib/fotos';
import { etiquetaSemana, dinero, porcentaje } from '@/lib/fechas';
import Fotos from '@/components/Fotos';

const GRUPOS = [['LIDER', 'Líderes'], ['SUBLIDER', 'Sublíderes'], ['DISCIPULO', 'Discípulos']];

// Detalle completo de un reporte (solo lectura) para el pastor.
export default async function DetalleReporte({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
  if (perfil?.rol !== 'ADMIN') redirect('/reporte');

  const { data: r } = await supabase.from('reportes').select('*, mentores(perfiles(nombre), grupos(nombre))').eq('id', id).single();
  if (!r) notFound();
  const { data: filas } = await supabase.from('asistencias').select('id, asistio, personas(nombre, tipo)').eq('reporte_id', id);
  const asis = (filas || []).sort((a, b) => a.personas.nombre.localeCompare(b.personas.nombre));
  const fotos = await cargarFotos(supabase, id);
  const total = r.total_esperados ?? asis.length;
  const pres = r.total_asistentes ?? asis.filter((a) => a.asistio).length;

  return (
    <>
      <p><Link href="/admin" style={{ color: 'var(--blue)', fontWeight: 700 }}>← Volver</Link></p>
      <div className="hola"><h1>{r.mentores?.perfiles?.nombre}</h1>
        <p>{r.mentores?.grupos?.nombre || 'Sin grupo'}</p>
        <span className="semana">Semana: {etiquetaSemana(r.semana_inicio)}</span>
        {' '}<span className={`badge ${r.estado === 'REVISADO' ? 'ok' : r.estado === 'BORRADOR' ? 'pend' : ''}`}>{r.estado === 'BORRADOR' ? 'Pendiente' : r.estado === 'REVISADO' ? 'Revisado' : 'Enviado'}</span></div>
      <div className="stats">
        <div className="stat"><b>{r.disc_asistentes ?? '-'}/{r.disc_esperados ?? '-'}</b><span>Discípulos</span></div>
        <div className="stat"><b>{porcentaje(pres, total)}%</b><span>Asistencia</span></div>
      </div>
      <div className="sec"><h2>Asistencia</h2>
        <div className="resumen"><span>Mentor</span><b>{r.mentor_asistio ? 'Asistió' : 'No asistió'}</b></div>
        {GRUPOS.map(([tipo, titulo]) => asis.filter((a) => a.personas.tipo === tipo).map((a) => (
          <div className="resumen" key={a.id}><span>{a.personas.nombre} <small>({titulo.slice(0, -1).toLowerCase()})</small></span><b>{a.asistio ? '✓' : '—'}</b></div>
        )))}
      </div>
      <div className="sec"><h2>Finanzas</h2>
        <div className="resumen"><span>Ofrenda</span><b>{dinero(r.ofrenda)}</b></div>
        <div className="resumen"><span>Diezmos</span><b>{dinero(r.diezmos)}</b></div>
      </div>
      <div className="sec"><h2>Tema impartido</h2><p style={{ margin: 0 }}>{r.tema || '—'}</p></div>
      <div className="sec"><h2>Seguimiento</h2><p style={{ margin: 0 }}>{r.seguimiento || '—'}</p></div>
      <div className="sec"><h2>Observaciones</h2><p style={{ margin: 0 }}>{r.observaciones || '—'}</p></div>
      <div className="sec"><h2>Fotos</h2><Fotos reporteId={r.id} inicial={fotos} /></div>
    </>
  );
}
