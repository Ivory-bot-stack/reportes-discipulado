import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cliente para el servidor: usa la sesión del usuario, por lo que
// las reglas de privacidad (RLS) de la base de datos siempre aplican.
export async function crearClienteServidor() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (lista) => { try { lista.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {} },
    },
  });
}
