import { AuthForm } from '@/components/auth/auth-form';
import { redirectAuthenticated } from '@/lib/auth/guards';
export default async function Login() {
  await redirectAuthenticated();
  return <AuthForm mode="login" />;
}
