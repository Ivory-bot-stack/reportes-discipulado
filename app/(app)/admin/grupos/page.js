import { exigirAdmin } from '@/lib/admin';
import Mensaje from '@/components/Mensaje';
import { crearGrupo, editarGrupo } from '../actions';

export default async function Grupos({ searchParams }) {
  const sp = await searchParams; const supabase = await exigirAdmin();
  const { data: grupos } = await supabase.from('grupos').select('id, nombre').order('nombre');
  const { data: ms } = await supabase.from('mentores').select('grupo_id');
  const n = (id) => (ms || []).filter((m) => m.grupo_id === id).length;
  return (
    <>
      <Mensaje sp={sp} />
      <details className="sec" open={!grupos?.length}><summary>➕ Nuevo grupo</summary>
        <form action={crearGrupo} className="fila-edit">
          <input name="nombre" placeholder="Ej: Jóvenes" aria-label="Nombre del grupo" required />
          <button className="btn peq">Crear grupo</button>
        </form></details>
      <div className="sec"><h2>Grupos</h2>
        {!grupos?.length && <p className="sub" style={{ margin: 0 }}>Aún no hay grupos.</p>}
        {grupos?.map((g) => (
          <form action={editarGrupo} className="item" key={g.id}>
            <input type="hidden" name="id" value={g.id} />
            <input name="nombre" defaultValue={g.nombre} aria-label="Nombre del grupo" required />
            <small style={{ whiteSpace: 'nowrap' }}>{n(g.id)} mentor(es)</small>
            <button className="btn peq">Guardar</button>
          </form>
        ))}
      </div>
    </>
  );
}
