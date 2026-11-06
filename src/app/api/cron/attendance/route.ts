import {authorizedCron} from '@/lib/jobs/auth';
import {reconcileAttendance} from '@/lib/jobs/attendance';
export const maxDuration=60;
export async function GET(request:Request){if(!authorizedCron(request))return new Response(null,{status:401});await reconcileAttendance();return Response.json({ok:true});}
