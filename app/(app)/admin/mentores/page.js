import Link from 'next/link';
import { exigirAdmin } from '@/lib/admin';
import Mensaje from '@/components/Mensaje';
import { crearMentor, editarMentor, alternarMentor } from '../actions';

export default async function Mentores({ searchParams }) {
  const sp = await searchParams; const supabase = await exigirAdmin();
  const { data: grupos } = await supabase.from('grupos').select('id, nombre').order('nombre');
  const { data: mentores } = await supabase.from('mentores').select('id, usuario_id, grupo_id, estado, perfiles(nombre, email)').order('id');
  const { data: pers } = await supabase.from('personas').select('mentor_id').eq('activo', true);
  const cuenta = (id) => (pers || []).filter((p) => p.mentor_id === id).length;
  const opciones = (grupos || []).map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>);
  return (
    <>
      <Mensaje sp={sp} />
      <details className="sec"><summary>➕ Nuevo mentor</summary>
        {!grupos?.length ? <p>Primero crea un grupo en la pestaña Grupos.</p> : (
          <form action={crearMentor} className="fila-edit" autoComplete="off">
            <input name="nombre" placeholder="Nombre" aria-label="Nombre" required />
            <input name="email" type="email" placeholder="Correo electrónico" aria-label="Correo" required />
            <input name="clave" type="text" placeholder="Contraseña temporal (mín. 8)" aria-label="Contraseña temporal" minLength={8} required />
            <select name="grupo_id" defaultValue="" aria-label="Grupo" required><option value="" disabled>Grupo...</option>{opciones}</select>
            <select name="estado" aria-label="Estado"><option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option></select>
            <button className="btn peq">Crear mentor</button>
          </form>)}
      </details>
      <div className="sec"><h2>Mentores</h2>
        {!mentores?.length && <p className="sub" style={{ margin: 0 }}>Aún no hay mentores.</p>}
        {mentores?.map((m) => (
          <div className={`fila-edit ${m.estado === 'INACTIVO' ? 'inactivo' : ''}`} key={m.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            <div><span className={`badge ${m.estado === 'ACTIVO' ? 'ok' : 'pend'}`}>{m.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}</span> <small>{m.perfiles?.email}</small></div>
            <form action={editarMentor} className="fila-edit">
              <input type="hidden" name="id" value={m.id} /><input type="hidden" name="usuario_id" value={m.usuario_id} />
              <input name="nombre" defaultValue={m.perfiles?.nombre} aria-label="Nombre" required />
              <select name="grupo_id" defaultValue={m.grupo_id ?? ''} aria-label="Grupo" required>{opciones}</select>
              <button className="btn peq" style={{ justifySelf: 'start' }}>Guardar</button>
            </form>
            <div className="acciones">
              <form action={alternarMentor}>
                <input type="hidden" name="id" value={m.id} /><input type="hidden" name="usuario_id" value={m.usuario_id} />
                <input type="hidden" name="nuevo" value={m.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'} />
                <button className="btn peq ghost">{m.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}</button>
              </form>
              <Link href={`/admin/personas?mentor=${m.id}&estado=todos`} style={{ color: 'var(--blue)', fontWeight: 700 }}>Ver personas ({cuenta(m.id)})</Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
