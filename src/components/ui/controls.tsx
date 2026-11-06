'use client';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import {Check} from 'lucide-react';
export function Checkbox(props:React.ComponentProps<typeof CheckboxPrimitive.Root>){return <CheckboxPrimitive.Root className="checkbox-root" {...props}><CheckboxPrimitive.Indicator><Check size={16}/></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root>;}
export function Toggle(props:React.ComponentProps<typeof SwitchPrimitive.Root>){return <SwitchPrimitive.Root className="switch-root" {...props}><SwitchPrimitive.Thumb className="switch-thumb"/></SwitchPrimitive.Root>;}
