import 'server-only';
import { demoEnabled } from './config';

export function skipDemoEmail() {
  if (!demoEnabled()) return false;
  console.info('demo: email skipped');
  return true;
}
