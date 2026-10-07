'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearClienteNavegador } from '@/lib/supabase/client';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setError(''); setCargando(true);
    const { error } = await crearClienteNavegador().auth.signInWithPassword({ email: email.trim(), password: clave });
    if (error) { setError('Correo o contraseña incorrectos.'); setCargando(false); return; }
    router.replace('/'); router.refresh();
  }

  return (
    <form onSubmit={entrar}>
      <label className="f" htmlFor="email">Correo</label>
      <input id="email" type="email" autoComplete="username" required placeholder="tucorreo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label className="f" htmlFor="clave">Contraseña</label>
      <input id="clave" type="password" autoComplete="current-password" required placeholder="Tu contraseña" value={clave} onChange={(e) => setClave(e.target.value)} />
      {error && <div className="err" role="alert">{error}</div>}
      <button className="btn" disabled={cargando}>{cargando ? 'Entrando...' : 'Entrar'}</button>
    </form>
  );
}
