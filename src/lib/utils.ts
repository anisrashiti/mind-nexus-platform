import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0,2).map(n=>n[0]).join('').toUpperCase();
