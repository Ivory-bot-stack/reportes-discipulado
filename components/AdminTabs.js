'use client';
import './admin.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [['/admin', 'Reportes'], ['/admin/mentores', 'Mentores'], ['/admin/personas', 'Personas'], ['/admin/grupos', 'Grupos']];

export default function AdminTabs() {
  const ruta = usePathname();
  const activo = (h) => (h === '/admin' ? ruta === '/admin' || ruta.startsWith('/admin/reporte') : ruta.startsWith(h));
  return <nav className="tabs adm">{ITEMS.map(([h, t]) => <Link key={h} href={h} className={activo(h) ? 'on' : ''}>{t}</Link>)}</nav>;
}
