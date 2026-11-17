export type ServiceId = 'treatment' | 'implants' | 'crowns' | 'ortho' | 'surgery';
export const services: ReadonlyArray<{ id: ServiceId; title: string; description: string; icon: string }>;
