import { exigirAdmin } from '@/lib/admin';
import Mensaje from '@/components/Mensaje';
import { crearPersona, editarPersona, alternarPersona } from '../actions';

const TIPOS = [['LIDER', 'Líder'], ['SUBLIDER', 'Sublíder'], ['DISCIPULO', 'Discípulo']];

export default async function Personas({ searchParams }) {
  const sp = await searchParams; const supabase = await exigirAdmin();
  const estado = sp.estado || 'true';
  const { data: grupos } = await supabase.from('grupos').select('id, nombre').order('nombre');
  const { data: mentores } = await supabase.from('mentores').select('id, estado, perfiles(nombre)').order('id');
  let q = supabase.from('personas').select('id, nombre, tipo, activo, mentor_id, mentores!inner(grupo_id, grupos(nombre))').order('nombre');
  if (/^\d+$/.test(sp.mentor || '')) q = q.eq('mentor_id', sp.mentor);
  if (/^\d+$/.test(sp.grupo || '')) q = q.eq('mentores.grupo_id', sp.grupo);
  if (TIPOS.some(([t]) => t === sp.tipo)) q = q.eq('tipo', sp.tipo);
  if (estado !== 'todos') q = q.eq('activo', estado === 'true');
  const { data: personas } = await q;
  const nombreMentor = (m) => `${m.perfiles?.nombre}${m.estado === 'INACTIVO' ? ' (inactivo)' : ''}`;
  const optM = (mentores || []).map((m) => <option key={m.id} value={m.id}>{nombreMentor(m)}</option>);
  const optT = TIPOS.map(([v, t]) => <option key={v} value={v}>{t}</option>);
  return (
    <>
      <Mensaje sp={sp} />
      <details className="sec"><summary>➕ Nueva persona</summary>
        {!mentores?.length ? <p>Primero crea un mentor.</p> : (
          <form action={crearPersona} className="fila-edit">
            <input name="nombre" placeholder="Nombre" aria-label="Nombre" required />
            <select name="tipo" defaultValue="DISCIPULO" aria-label="Tipo">{optT}</select>
            <select name="mentor_id" defaultValue="" aria-label="Mentor" required><option value="" disabled>Mentor...</option>{optM}</select>
            <select name="activo" aria-label="Estado"><option value="true">Activo</option><option value="false">Inactivo</option></select>
            <button className="btn peq">Crear persona</button>
          </form>)}
      </details>
      <form className="sec filtros" method="get">
        <select name="mentor" defaultValue={sp.mentor || ''} aria-label="Mentor"><option value="">Todos los mentores</option>{optM}</select>
        <select name="grupo" defaultValue={sp.grupo || ''} aria-label="Grupo"><option value="">Todos los grupos</option>{(grupos || []).map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}</select>
        <select name="tipo" defaultValue={sp.tipo || ''} aria-label="Tipo"><option value="">Todos los tipos</option>{optT}</select>
        <select name="estado" defaultValue={estado} aria-label="Estado"><option value="true">Activos</option><option value="false">Inactivos</option><option value="todos">Todos</option></select>
        <button className="btn peq" style={{ gridColumn: '1 / -1' }}>Filtrar</button>
      </form>
      <div className="sec"><h2>Personas ({personas?.length || 0})</h2>
        {!personas?.length && <p className="sub" style={{ margin: 0 }}>No hay personas con esos filtros.</p>}
        {personas?.map((p) => (
          <div className={`fila-edit ${p.activo ? '' : 'inactivo'}`} key={p.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            <small>Grupo: {p.mentores?.grupos?.nombre || '—'}</small>
            <form action={editarPersona} className="fila-edit">
              <input type="hidden" name="id" value={p.id} />
              <input name="nombre" defaultValue={p.nombre} aria-label="Nombre" required />
              <select name="tipo" defaultValue={p.tipo} aria-label="Tipo">{optT}</select>
              <select name="mentor_id" defaultValue={p.mentor_id} aria-label="Mentor">{optM}</select>
              <button className="btn peq" style={{ justifySelf: 'start' }}>Guardar</button>
            </form>
            <form action={alternarPersona}>
              <input type="hidden" name="id" value={p.id} /><input type="hidden" name="nuevo" value={String(!p.activo)} />
              <button className="btn peq ghost">{p.activo ? 'Desactivar' : 'Activar'}</button>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
