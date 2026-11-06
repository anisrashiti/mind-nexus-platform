import 'server-only';
import {constantEqual} from '@/lib/crypto';
export function authorizedCron(request:Request){const secret=process.env.CRON_SECRET;return !!secret&&constantEqual(request.headers.get('authorization')??'',`Bearer ${secret}`);}
