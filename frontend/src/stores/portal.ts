import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import api from '@/api/http';
import type { PortalWidget, UserPortalSettings } from '@/interfaces/portal';
import { useAuthStore } from './auth';

const defaultWidgets = (userId: string | null): UserPortalSettings => ({
  userId: userId ?? '',
  layout: [
    {
      id: 'widget-1',
      type: 'text',
      title: 'Welcome',
      position: { x: 24, y: 24, width: 320, height: 180, zIndex: 1 },
      minimized: false,
      maximized: false,
      fullscreen: false,
      config: { content: 'Hello, AI Agent Portal!' },
    },
    {
      id: 'widget-2',
      type: 'chart',
      title: 'Data Trends',
      position: { x: 360, y: 24, width: 420, height: 240, zIndex: 2 },
      minimized: false,
      maximized: false,
      fullscreen: false,
      config: { chartType: 'line', dataUrl: '/api/data/trends' },
    },
  ],
  theme: 'light',
  language: 'en',
});

export const usePortalStore = defineStore('portal', () => {
  const settings = ref<UserPortalSettings | null>(null);
  const loading = ref(false);

  const widgets = computed(() => settings.value?.layout ?? []);
  const theme = computed(() => settings.value?.theme ?? 'light');

  const maxZIndex = computed(() => widgets.value.reduce((max, w) => Math.max(max, w.position.zIndex), 1));

  const ensureSettings = () => {
    const auth = useAuthStore();
    if (!settings.value) {
      settings.value = defaultWidgets(auth.userId);
    }
  };

  const fetchSettings = async () => {
    loading.value = true;
    try {
      const response = await api.get<UserPortalSettings>('/user-settings-get');
      settings.value = response.data;
      if (!settings.value.layout.length) {
        const auth = useAuthStore();
        settings.value = defaultWidgets(auth.userId);
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
      ensureSettings();
    } finally {
      loading.value = false;
    }
  };

  const saveSettings = async () => {
    if (!settings.value) return;
    try {
      await api.put('/user-settings-put', settings.value);
    } catch (error) {
      console.error('Failed to save settings', error);
    }
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    ensureSettings();
    if (!settings.value) return;
    settings.value.theme = newTheme;
    saveSettings();
  };

  const addWidget = (widget: PortalWidget) => {
    ensureSettings();
    settings.value?.layout.push(widget);
    saveSettings();
  };

  const updateWidgetPosition = (widgetId: string, newPosition: PortalWidget['position']) => {
    ensureSettings();
    const widget = settings.value?.layout.find((w) => w.id === widgetId);
    if (widget) {
      widget.position = { ...newPosition };
      saveSettings();
    }
  };

  const setWidgetState = (widgetId: string, state: Partial<PortalWidget>) => {
    const widget = settings.value?.layout.find((w) => w.id === widgetId);
    if (widget) {
      Object.assign(widget, state);
      saveSettings();
    }
  };

  const setAllFullscreen = () => {
    settings.value?.layout.forEach((widget) => {
      widget.fullscreen = true;
      widget.maximized = false;
      widget.minimized = false;
    });
    saveSettings();
  };

  const bringToFront = (widgetId: string) => {
    const widget = settings.value?.layout.find((w) => w.id === widgetId);
    if (widget) {
      widget.position.zIndex = maxZIndex.value + 1;
      saveSettings();
    }
  };

  return {
    settings,
    widgets,
    theme,
    loading,
    fetchSettings,
    saveSettings,
    setTheme,
    addWidget,
    updateWidgetPosition,
    setWidgetState,
    setAllFullscreen,
    bringToFront,
  };
});
