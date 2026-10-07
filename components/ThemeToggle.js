'use client';
import { useEffect, useState } from 'react';

// Tema claro por defecto; la elección se recuerda en el dispositivo.
export default function ThemeToggle({ className = '' }) {
  const [tema, setTema] = useState('light');
  useEffect(() => {
    let t = 'light';
    try { t = localStorage.getItem('tema') === 'dark' ? 'dark' : 'light'; } catch {}
    setTema(t); document.documentElement.setAttribute('data-theme', t);
  }, []);
  function cambiar() {
    const t = tema === 'dark' ? 'light' : 'dark';
    setTema(t); document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('tema', t); } catch {}
  }
  return <button type="button" className={`tg ${className}`} onClick={cambiar}>{tema === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}</button>;
}
