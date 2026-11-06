import 'server-only';
import {Resend} from 'resend';
import {createTranslator} from 'next-intl';
import messages from '../../../messages/en.json';
import {CalmEmail} from './templates/base';
export type EmailTemplate='invite'|'password-reset'|'booking-confirmed'|'reminder-24h'|'reminder-15m'|'cancelled'|'urgent-alert'|'extra-session';
type EmailInput={template:EmailTemplate;userId:string;to:string;values?:Record<string,string>;href?:string;attachment?:string;idempotencyKey?:string;returned?:boolean};
export async function sendEmail(input:EmailInput){
  if(!process.env.RESEND_API_KEY){if(process.env.NODE_ENV==='production')throw new Error('Email service is not configured');console.info(`email queued: ${input.template} to ${input.userId}`);return;}
  const t=createTranslator({locale:'en',messages:messages.email});const values=input.values??{};const appUrl=process.env.APP_URL!;
  let subject:string,text:string,action=t('open');
  switch(input.template){
    case 'invite':subject=t('inviteSubject',{organization:values.organization});text=t('inviteBody');action=t('inviteAction');break;
    case 'password-reset':subject=t('resetSubject');text=t('resetBody');action=t('resetAction');break;
    case 'booking-confirmed':subject=t('confirmedSubject');text=t('confirmedBody',{date:values.date,time:values.time});break;
    case 'reminder-24h':case 'reminder-15m':subject=t('reminderSubject',{time:values.time});text=t('reminderBody',{time:values.time});break;
    case 'cancelled':subject=t('cancelledSubject');text=t('cancelledBody',{date:values.date,time:values.time})+(input.returned===undefined?'':`\n${input.returned?t('returned'):t('pending')}`);break;
    case 'urgent-alert':subject=t('urgentSubject',{name:values.name});text=t('urgentBody',{name:values.name});break;
    case 'extra-session':subject=t('extraSubject');text=t('extraBody');break;
  }
  const result=await new Resend(process.env.RESEND_API_KEY).emails.send({from:process.env.EMAIL_FROM!,to:input.to,subject,react:<CalmEmail subject={subject} text={text} action={action} href={input.href??appUrl} footer={t('footer')} appUrl={appUrl}/>,attachments:input.attachment?[{filename:'session.ics',content:Buffer.from(input.attachment)}]:undefined},{idempotencyKey:input.idempotencyKey});
  if(result.error)throw new Error('Email delivery failed');
}
