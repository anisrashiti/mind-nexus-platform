export const demoEnabled = () => process.env.DEMO_MODE === 'true';
export const demoAccountAllowed = (isDemo: boolean) => demoEnabled() === isDemo;
export const DEMO_ORGANIZATION_ID = 'de000000-0000-4000-8000-000000000001';
export const DEMO_VIEWS = {
  available: { id: 'de000000-0000-4000-8000-000000000011', role: 'employee' },
  booked: { id: 'de000000-0000-4000-8000-000000000012', role: 'employee' },
  used: { id: 'de000000-0000-4000-8000-000000000013', role: 'employee' },
  psychologist: { id: 'de000000-0000-4000-8000-000000000002', role: 'psychologist' },
  hr: { id: 'de000000-0000-4000-8000-000000000003', role: 'hr' },
} as const;
export type DemoView = keyof typeof DEMO_VIEWS;
export const DEMO_VIEW_KEYS = Object.keys(DEMO_VIEWS) as DemoView[];
