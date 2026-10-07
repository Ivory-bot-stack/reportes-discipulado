import { Fraunces, Nunito_Sans } from 'next/font/google';
import './globals.css';

const titulo = Fraunces({ subsets: ['latin'], weight: ['600', '700'], variable: '--f-titulo' });
const texto = Nunito_Sans({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--f-texto' });

export const metadata = {
  title: 'Reportes de Discipulado',
  description: 'Jesucristo Manantial de Vida - Rivas',
  manifest: '/manifest.json',
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
};
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#1236B8' };

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <body className={`${titulo.variable} ${texto.variable}`}>{children}</body>
    </html>
  );
}
