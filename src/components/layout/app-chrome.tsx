'use client';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import {useTranslations} from 'next-intl';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import {CalendarDays,Clock3,MessageSquare,Building2,ChevronDown,LogOut} from 'lucide-react';
import {Avatar,Badge} from '@/components/ui/primitives';
import {LanguageSwitch} from './language-switch';
type ChromeUser={fullName:string;role:'employee'|'hr'|'psychologist'};
function Logo(){const t=useTranslations('common');return <Link className="logo" href="/"><Image src="/logo-mark.svg" alt="" width={32} height={32}/><span>{t('brand')}</span></Link>;}
export function UserMenu({user,onSignOut}:{user:ChromeUser;onSignOut:()=>Promise<void>}){const t=useTranslations('common');return <Dropdown.Root><Dropdown.Trigger asChild><button className="btn btn-ghost" style={{color:'inherit',padding:4}} aria-label={t('userMenu')}><Avatar name={user.fullName} size="sm"/><span className="user-name">{user.fullName}</span><ChevronDown size={16}/></button></Dropdown.Trigger><Dropdown.Portal><Dropdown.Content className="dropdown" align="end" sideOffset={12}><div className="mobile-language" style={{padding:8}}><LanguageSwitch/></div><Dropdown.Item className="dropdown-item" onSelect={()=>void onSignOut()}><LogOut/>{t('signOut')}</Dropdown.Item></Dropdown.Content></Dropdown.Portal></Dropdown.Root>;}
export function TopBar({user,organization,urgent,onSignOut}:{user:ChromeUser;organization?:string;urgent?:React.ReactNode;onSignOut:()=>Promise<void>}){const t=useTranslations('hr');return <header className="topbar"><Logo/>{user.role==='hr'&&<Badge>{t('role',{organization:organization??''})}</Badge>}<div className="topbar-tools"><LanguageSwitch/>{urgent}<UserMenu user={user} onSignOut={onSignOut}/></div></header>;}
export function PsychologistSidebar({user,unread=0,onSignOut}:{user:ChromeUser;unread?:number;onSignOut:()=>Promise<void>}){const t=useTranslations('psychologist');const path=usePathname();return <aside className="sidebar"><div className="stack" style={{gap:12}}><Logo/><Badge tone="brand">{t('role')}</Badge></div><nav>{[["/psychologist",'schedule',CalendarDays],["/psychologist/availability",'availability',Clock3],["/psychologist/urgent",'urgent',MessageSquare],["/psychologist/organization",'organization',Building2]].map(([href,key,Icon])=><Link key={String(href)} href={String(href)} aria-current={path===href?'page':undefined}>{typeof Icon!=='string'&&<Icon/>}{t(key as 'schedule')}{key==='urgent'&&unread>0&&<Badge tone="danger">{unread}</Badge>}</Link>)}</nav><div className="sidebar-bottom stack"><LanguageSwitch/><UserMenu user={user} onSignOut={onSignOut}/></div></aside>;}
