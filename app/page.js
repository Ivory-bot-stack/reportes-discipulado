import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';

// Envía a cada persona a su pantalla según su rol.
export default async function Inicio() {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
  redirect(perfil?.rol === 'ADMIN' ? '/admin' : '/reporte');
}
