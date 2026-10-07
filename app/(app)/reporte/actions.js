'use server';
import { revalidatePath } from 'next/cache';
import { crearClienteServidor } from '@/lib/supabase/server';

const numero = (x) => { const n = parseFloat(x); return Number.isNaN(n) || n < 0 ? 0 : n; };

// Guarda el borrador. La base de datos solo permite editar reportes
// propios que sigan en borrador (reglas RLS), pase lo que pase aquí.
export async function guardarBorrador(id, d) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from('reportes').update({
    mentor_asistio: !!d.mentor_asistio,
    ofrenda: numero(d.ofrenda), diezmos: numero(d.diezmos),
    tema: d.tema ?? '', seguimiento: d.seguimiento ?? '', testimonios: d.testimonios ?? '', observaciones: d.observaciones ?? '',
  }).eq('id', id).select('id');
  if (error) return { error: error.message };
  if (!data?.length) return { error: 'Este reporte ya no se puede modificar.' };

  const marcas = Object.entries(d.asistencia || {});
  for (const valor of [true, false]) {
    const ids = marcas.filter(([, v]) => !!v === valor).map(([k]) => Number(k));
    if (ids.length) {
      const { error: e } = await supabase.from('asistencias').update({ asistio: valor }).in('id', ids);
      if (e) return { error: e.message };
    }
  }
  return { ok: true };
}

export async function enviarReporte(id, d) {
  const g = await guardarBorrador(id, d);
  if (g.error) return g;
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc('enviar_reporte', { p_id: id });
  if (error) return { error: error.message };
  revalidatePath('/historial');
  return { ok: true };
}
