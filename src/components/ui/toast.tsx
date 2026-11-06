'use client';
import * as ToastPrimitive from '@radix-ui/react-toast';
export function Toast({message,open,onOpenChange}:{message:string;open:boolean;onOpenChange:(open:boolean)=>void}){return <ToastPrimitive.Provider swipeDirection="right"><ToastPrimitive.Root className="toast" open={open} onOpenChange={onOpenChange}><ToastPrimitive.Description>{message}</ToastPrimitive.Description></ToastPrimitive.Root><ToastPrimitive.Viewport className="toast-viewport"/></ToastPrimitive.Provider>;}
