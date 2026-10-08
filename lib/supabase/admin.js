import 'server-only'; // el build falla si algún componente cliente intenta importar este archivo
import { createClient } from '@supabase/supabase-js';

// Cliente con la clave de servidor. SOLO para auth.admin (crear/borrar usuarios).
export function crearClienteAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
