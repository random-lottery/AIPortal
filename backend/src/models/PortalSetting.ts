import type { PortalWidget } from '../../src/interfaces/portal';

export interface PortalSetting {
  id?: string;
  userId: string;
  layout: PortalWidget[];
  theme: string;
  language: string;
  created_at?: string;
  updated_at?: string;
}
