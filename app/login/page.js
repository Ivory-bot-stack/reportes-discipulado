import LoginForm from './LoginForm';
import ThemeToggle from '@/components/ThemeToggle';

export default function Login() {
  return (
    <main className="wrap centro">
      <ThemeToggle className="flotante" />
      <img className="logo-grande" src="/logo.png" alt="Jesucristo Manantial de Vida" />
      <h1>Reportes de discipulado</h1>
      <p className="sub">Ingresa con tu usuario de mentor</p>
      <LoginForm />
    </main>
  );
}
