export interface PortalWidget {
  id: string;
  type: 'text' | 'chart' | 'weather' | 'custom';
  title: string;
  position: { x: number; y: number; width: number; height: number; zIndex: number };
  minimized: boolean;
  maximized: boolean;
  fullscreen: boolean;
  config: Record<string, any>;
}

export interface UserPortalSettings {
  id?: string;
  userId: string;
  layout: PortalWidget[];
  theme: string;
  language: string;
  createdAt?: Date;
  updatedAt?: Date;
}

