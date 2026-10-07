'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Tabs() {
  const ruta = usePathname();
  return (
    <nav className="tabs">
      <Link href="/reporte" className={ruta.startsWith('/reporte') ? 'on' : ''}>Reporte de la semana</Link>
      <Link href="/historial" className={ruta.startsWith('/historial') ? 'on' : ''}>Mis reportes</Link>
    </nav>
  );
}
