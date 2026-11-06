import {z} from 'zod';
export const urgentSchema=z.object({body:z.string().trim().min(1).max(2000),phone:z.string().trim().max(40).refine(value=>!value||/^[+\d\s().-]{5,40}$/.test(value)).optional()});
