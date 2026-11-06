import {authorizedCron} from '@/lib/jobs/auth';
import {sendDueReminders} from '@/lib/jobs/reminders';
export const maxDuration=60;
export async function GET(request:Request){if(!authorizedCron(request))return new Response(null,{status:401});await sendDueReminders();return Response.json({ok:true});}
