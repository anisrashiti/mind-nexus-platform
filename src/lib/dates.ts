import {formatInTimeZone,fromZonedTime} from 'date-fns-tz';
import {TIME_ZONE} from './constants';
export const localDate=(date:Date)=>formatInTimeZone(date,TIME_ZONE,'yyyy-MM-dd');
export const displayDate=(date:Date,pattern='EEEE d MMMM')=>formatInTimeZone(date,TIME_ZONE,pattern);
export const displayTime=(date:Date)=>formatInTimeZone(date,TIME_ZONE,'HH:mm');
export const localInstant=(date:string,time='00:00')=>fromZonedTime(`${date}T${time}:00`,TIME_ZONE);
export const nextDate=(date:string,days=1)=>new Date(Date.parse(`${date}T12:00:00Z`)+days*86400000).toISOString().slice(0,10);
export const weekStart=(date:string)=>nextDate(date,1-(new Date(`${date}T12:00:00Z`).getUTCDay()||7));
