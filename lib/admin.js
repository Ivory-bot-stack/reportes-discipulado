import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';

// Verifica en el servidor que quien llama es ADMIN activo. Devuelve el cliente con su sesión.
export async function exigirAdmin() {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: p } = await supabase.from('perfiles').select('rol,estado').eq('id', user.id).single();
  if (p?.rol !== 'ADMIN' || p.estado !== 'ACTIVO') redirect('/reporte');
  return supabase;
}
export const volver = (ruta, t, msg) => redirect(`${ruta}?t=${t}&msg=${encodeURIComponent(msg)}`);
