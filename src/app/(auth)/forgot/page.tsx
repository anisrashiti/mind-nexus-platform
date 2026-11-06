import { AuthForm } from '@/components/auth/auth-form';
import { redirectAuthenticated } from '@/lib/auth/guards';
export default async function Forgot() {
  await redirectAuthenticated();
  return <AuthForm mode="forgot" />;
}
