import 'server-only';
import {createCipheriv,createDecipheriv,randomBytes,createHash,createHmac,timingSafeEqual} from 'node:crypto';
export function encryptionKey(){const value=process.env.ENCRYPTION_KEY;if(!value)throw new Error('ENCRYPTION_KEY is required');const key=Buffer.from(value,'base64');if(key.length!==32)throw new Error('ENCRYPTION_KEY must contain 32 bytes');return key;}
export function encrypt(value:string){const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',encryptionKey(),iv);const data=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return ['v1',iv.toString('base64'),cipher.getAuthTag().toString('base64'),data.toString('base64')].join('.');}
export function decrypt(value:string){const [version,iv,tag,data,...rest]=value.split('.');if(version!=='v1'||!iv||!tag||data===undefined||rest.length)throw new Error('Invalid encrypted field');const decipher=createDecipheriv('aes-256-gcm',encryptionKey(),Buffer.from(iv,'base64'));decipher.setAuthTag(Buffer.from(tag,'base64'));return Buffer.concat([decipher.update(Buffer.from(data,'base64')),decipher.final()]).toString('utf8');}
export const hashToken=(token:string)=>createHash('sha256').update(token).digest('hex');
export const newToken=()=>randomBytes(32).toString('hex');
export function privateKey(value:string){if(!process.env.AUTH_SECRET)throw new Error('AUTH_SECRET is required');return createHmac('sha256',process.env.AUTH_SECRET).update(value).digest('hex');}
export function constantEqual(a:string,b:string){const left=Buffer.from(a);const right=Buffer.from(b);return left.length===right.length&&timingSafeEqual(left,right);}
