import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Sin sesión no se entra a ninguna pantalla, excepto /login.
export async function middleware(request) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const enLogin = request.nextUrl.pathname.startsWith('/login');
  if (!user && !enLogin) return NextResponse.redirect(new URL('/login', request.url));
  if (user && enLogin) return NextResponse.redirect(new URL('/', request.url));
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|icon-.*|manifest.json).*)'] };
