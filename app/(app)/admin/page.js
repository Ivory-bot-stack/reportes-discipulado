import Link from 'next/link';
import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { etiquetaSemana, dinero } from '@/lib/fechas';

// Versión inicial del panel del pastor: lista de reportes recientes.
// (Filtros, detalle, revisar y autorizar edición se agregan después.)
export default async function Admin() {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
  if (perfil?.rol !== 'ADMIN') redirect('/reporte');

  const { data: reportes } = await supabase.from('reportes')
    .select('id, semana_inicio, estado, ofrenda, diezmos, disc_esperados, disc_asistentes, mentores(perfiles(nombre))')
    .neq('estado', 'BORRADOR').order('semana_inicio', { ascending: false }).limit(50);
  const lista = reportes || [];
  const suma = (k) => lista.reduce((t, r) => t + Number(r[k] || 0), 0);

  return (
    <>
      <div className="hola"><h1>Reporte general</h1><p>Últimos reportes enviados</p></div>
      <div className="stats">
        <div className="stat"><b>{lista.length}</b><span>Reportes</span></div>
        <div className="stat"><b>{dinero(suma('ofrenda'))}</b><span>Ofrendas</span></div>
        <div className="stat"><b>{dinero(suma('diezmos'))}</b><span>Diezmos</span></div>
      </div>
      <div className="sec"><h2>Reportes</h2>
        {!lista.length && <p className="sub" style={{ margin: 0 }}>Todavía no hay reportes enviados.</p>}
        {lista.map((r) => (
          <Link className="item" key={r.id} href={`/admin/reporte/${r.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            <span><b>{r.mentores?.perfiles?.nombre}</b><br /><small>{etiquetaSemana(r.semana_inicio)} · {r.disc_asistentes}/{r.disc_esperados}</small></span>
            <span className={`badge ${r.estado === 'REVISADO' ? 'ok' : ''}`}>{r.estado === 'REVISADO' ? 'Revisado' : 'Enviado'}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
