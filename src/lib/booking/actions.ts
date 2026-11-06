'use server';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {requireEmployee} from '@/lib/auth/guards';
import {createBooking,BookingError} from './service';
import {cancelEmployeeBooking} from './cancel';
import {notifyConfirmed,notifyCancelled} from './notifications';
export async function confirmBooking(_: {error?:string},form:FormData):Promise<{error?:string}>{const employee=await requireEmployee();const parsed=z.object({start:z.iso.datetime(),consent:z.literal('on')}).safeParse(Object.fromEntries(form));if(!parsed.success)return {error:'consentRequired'};try{const result=await createBooking(employee,new Date(parsed.data.start),true);await notifyConfirmed(result).catch(()=>console.error('email failure: booking-confirmed',result.appointment.id));}catch(error){if(error instanceof BookingError)return {error:error.code};throw error;}revalidatePath('/');redirect('/');}
export async function cancelBooking(input:unknown){const employee=await requireEmployee();const parsed=z.object({id:z.uuid()}).safeParse(input);if(!parsed.success)return {error:'unavailable'};try{const result=await cancelEmployeeBooking(employee,parsed.data.id);await notifyCancelled(result.appointment,true,result.refund).catch(()=>console.error('email failure: cancelled',result.appointment.id));}catch(error){if(error instanceof BookingError)return {error:error.code};throw error;}revalidatePath('/');revalidatePath('/book');return {success:true};}
