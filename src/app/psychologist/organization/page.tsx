import {getTranslations} from 'next-intl/server';
import {requirePsychologist} from '@/lib/auth/guards';
import {organizationSnapshot} from '@/lib/organization/queries';
import {OrganizationPanel} from '@/components/psychologist/organization-panel';
export default async function Organization(){await requirePsychologist();const t=await getTranslations();const data=await organizationSnapshot();if(!data)return <p>{t('common.empty')}</p>;return <div className="stack" style={{gap:24}}><div className="stack" style={{gap:8}}><h1>{data.org.name}</h1><p className="muted">{t('organization.description')}</p></div><OrganizationPanel org={{name:data.org.name,hrContactName:data.org.hrContactName,hrContactEmail:data.org.hrContactEmail,sessionsPerEmployee:data.org.sessionsPerEmployee,status:data.org.status}} employees={data.employees.map(({activatedAt,...e})=>({...e,activated:!!activatedAt}))} booked={data.booked} used={data.used}/></div>;}
