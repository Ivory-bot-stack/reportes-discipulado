import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { salir } from '../actions-auth';
import ThemeToggle from '@/components/ThemeToggle';
import Tabs from '@/components/Tabs';

export const dynamic = 'force-dynamic';

export default async function LayoutPrivado({ children }) {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: perfil } = await supabase.from('perfiles').select('nombre,rol,estado').eq('id', user.id).single();
  if (!perfil || perfil.estado !== 'ACTIVO') { await supabase.auth.signOut(); redirect('/login'); }
  return (
    <>
      <header className="top"><div className="in">
        <img src="/logo.png" alt="" />
        <b>Jesucristo Manantial de Vida</b>
        <ThemeToggle />
        <form action={salir}><button className="salir">Salir</button></form>
      </div></header>
      <div className="wrap">
        {perfil.rol !== 'ADMIN' && <Tabs />}
        {children}
      </div>
    </>
  );
}
