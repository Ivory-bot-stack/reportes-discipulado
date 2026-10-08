'use server';
import { exigirAdmin, volver } from '@/lib/admin';
import { crearClienteAdmin } from '@/lib/supabase/admin';

const txt = (fd, k) => String(fd.get(k) ?? '').trim();
const esId = (v) => /^\d+$/.test(v);
const TIPOS = ['LIDER', 'SUBLIDER', 'DISCIPULO'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// TEMPORAL (diagnóstico): solo en desarrollo local. Quitar cuando se resuelva.
// Registra únicamente datos del error; nunca contraseñas, claves ni tokens.
const logDev = (etapa, e) => {
  if (process.env.NODE_ENV !== 'development' || !e) return;
  console.error(`[crearMentor] falló en: ${etapa}`, {
    name: e.name, message: e.message, code: e.code, status: e.status,
    details: e.details, hint: e.hint, cause: e.cause?.message ?? e.cause, stack: e.stack,
  });
};

// ---------- GRUPOS ----------
export async function crearGrupo(fd) {
  const supabase = await exigirAdmin(); const nombre = txt(fd, 'nombre');
  if (!nombre) volver('/admin/grupos', 'err', 'Escribe el nombre del grupo.');
  const { error } = await supabase.from('grupos').insert({ nombre });
  if (error) volver('/admin/grupos', 'err', error.code === '23505' ? 'Ya existe un grupo con ese nombre.' : 'No se pudo crear el grupo.');
  volver('/admin/grupos', 'ok', 'Grupo creado correctamente.');
}
export async function editarGrupo(fd) {
  const supabase = await exigirAdmin(); const nombre = txt(fd, 'nombre'), id = txt(fd, 'id');
  if (!nombre || !esId(id)) volver('/admin/grupos', 'err', 'Escribe el nombre del grupo.');
  const { error } = await supabase.from('grupos').update({ nombre }).eq('id', id);
  if (error) volver('/admin/grupos', 'err', error.code === '23505' ? 'Ya existe un grupo con ese nombre.' : 'No se pudo guardar el grupo.');
  volver('/admin/grupos', 'ok', 'Grupo actualizado.');
}

// ---------- MENTORES ----------
export async function crearMentor(fd) {
  const supabase = await exigirAdmin();
  const nombre = txt(fd, 'nombre'), email = txt(fd, 'email').toLowerCase(), clave = String(fd.get('clave') ?? ''), grupo = txt(fd, 'grupo_id');
  const estado = txt(fd, 'estado') === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO';
  const R = '/admin/mentores';
  if (!nombre) volver(R, 'err', 'Escribe el nombre del mentor.');
  if (!EMAIL.test(email)) volver(R, 'err', 'Escribe un correo válido.');
  if (clave.length < 8) volver(R, 'err', 'La contraseña temporal debe tener al menos 8 caracteres.');
  if (!esId(grupo)) volver(R, 'err', 'Elige un grupo.');
  const { data: g } = await supabase.from('grupos').select('id').eq('id', grupo).maybeSingle();
  if (!g) volver(R, 'err', 'El grupo elegido no existe.');

  let msg = null, uid = null, admin;
  try {
    admin = crearClienteAdmin();
    // 1) Usuario en Supabase Auth (la contraseña solo vive aquí, hasheada por Supabase)
    const { data, error } = await admin.auth.admin.createUser({ email, password: clave, email_confirm: true });
    if (error) {
      logDev('auth.admin.createUser', error);
      msg = /already|registered|exists/i.test(error.message) ? 'El correo ya está registrado.' : 'No se pudo crear el mentor. No se realizaron cambios incompletos.';
    } else {
      uid = data.user.id;
      // 2) y 3) perfil y mentor, con la sesión del pastor (las reglas RLS de ADMIN aplican)
      const p = await supabase.from('perfiles').insert({ id: uid, nombre, email, rol: 'MENTOR', estado });
      const m = p.error ? p : await supabase.from('mentores').insert({ usuario_id: uid, grupo_id: grupo, estado });
      if (p.error || m.error) {
        logDev(p.error ? 'insert en perfiles' : 'insert en mentores', p.error || m.error);
        await admin.auth.admin.deleteUser(uid); // evita usuarios huérfanos (borra el perfil en cascada)
        msg = p.error?.code === '23505' ? 'El correo ya está registrado.' : 'No se pudo crear el mentor. No se realizaron cambios incompletos.';
      }
    }
  } catch (e) {
    logDev('excepción (antes o durante la creación)', e);
    if (uid && admin) await admin.auth.admin.deleteUser(uid).catch(() => {});
    msg = 'No se pudo crear el mentor. No se realizaron cambios incompletos.';
  }
  if (msg) volver(R, 'err', msg);
  volver(R, 'ok', 'Mentor creado correctamente.');
}
export async function editarMentor(fd) {
  const supabase = await exigirAdmin();
  const id = txt(fd, 'id'), uid = txt(fd, 'usuario_id'), nombre = txt(fd, 'nombre'), grupo = txt(fd, 'grupo_id');
  if (!nombre || !esId(id) || !esId(grupo)) volver('/admin/mentores', 'err', 'Revisa el nombre y el grupo.');
  const a = await supabase.from('perfiles').update({ nombre }).eq('id', uid);
  const b = await supabase.from('mentores').update({ grupo_id: grupo }).eq('id', id);
  if (a.error || b.error) volver('/admin/mentores', 'err', 'No se pudo guardar el mentor.');
  volver('/admin/mentores', 'ok', 'Mentor actualizado.');
}
export async function alternarMentor(fd) {
  const supabase = await exigirAdmin();
  const id = txt(fd, 'id'), uid = txt(fd, 'usuario_id'), nuevo = txt(fd, 'nuevo') === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO';
  const a = await supabase.from('perfiles').update({ estado: nuevo }).eq('id', uid);
  const b = await supabase.from('mentores').update({ estado: nuevo }).eq('id', id);
  if (a.error || b.error) volver('/admin/mentores', 'err', 'No se pudo cambiar el estado.');
  volver('/admin/mentores', 'ok', nuevo === 'ACTIVO' ? 'Mentor activado.' : 'Mentor desactivado. Su historial se conserva.');
}

// ---------- PERSONAS ----------
function validarPersona(fd) {
  const nombre = txt(fd, 'nombre'), tipo = txt(fd, 'tipo'), mentor = txt(fd, 'mentor_id');
  if (!nombre) volver('/admin/personas', 'err', 'Escribe el nombre de la persona.');
  if (!TIPOS.includes(tipo)) volver('/admin/personas', 'err', 'Elige el tipo de persona.');
  if (!esId(mentor)) volver('/admin/personas', 'err', 'Elige un mentor.');
  return { nombre, tipo, mentor_id: mentor };
}
export async function crearPersona(fd) {
  const supabase = await exigirAdmin(); const d = validarPersona(fd);
  const { error } = await supabase.from('personas').insert({ ...d, activo: txt(fd, 'activo') !== 'false' });
  if (error) volver('/admin/personas', 'err', 'No se pudo crear la persona.');
  volver('/admin/personas', 'ok', 'Persona creada correctamente.');
}
// Editar y reasignar: se conserva el mismo id, así el historial de asistencias no se pierde.
export async function editarPersona(fd) {
  const supabase = await exigirAdmin(); const d = validarPersona(fd), id = txt(fd, 'id');
  const { data, error } = await supabase.from('personas').update(d).eq('id', id).select('id');
  if (error || !data?.length) volver('/admin/personas', 'err', 'No se pudo guardar la persona.');
  volver('/admin/personas', 'ok', 'Persona actualizada.');
}
export async function alternarPersona(fd) {
  const supabase = await exigirAdmin(); const id = txt(fd, 'id'), activo = txt(fd, 'nuevo') === 'true';
  const { error } = await supabase.from('personas').update({ activo }).eq('id', id);
  if (error) volver('/admin/personas', 'err', 'No se pudo cambiar el estado.');
  volver('/admin/personas', 'ok', activo ? 'Persona activada.' : 'Persona desactivada. Su historial se conserva.');
}
