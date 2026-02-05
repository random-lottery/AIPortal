<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import PortalWidgetComponent from '@/components/PortalWidgetComponent.vue';
import { usePortalStore } from '@/stores/portal';
import { useAuthStore } from '@/stores/auth';
import api from '@/api/http';
import type { PortalWidget } from '@/interfaces/portal';
import { useTheme } from 'vuetify';

const portalStore = usePortalStore();
const authStore = useAuthStore();
const aiCommand = ref('');
const saving = ref(false);
const theme = useTheme();

onMounted(async () => {
  if (!portalStore.settings && authStore.isAuthenticated) {
    await portalStore.fetchSettings();
  }
});

watch(
  () => portalStore.theme,
  (newTheme) => {
    theme.global.name.value = newTheme === 'dark' ? 'dark' : 'light';
  },
  { immediate: true }
);

const sendCommand = async () => {
  if (!aiCommand.value.trim()) return;
  saving.value = true;
  try {
    const response = await api.post('/ai-agent-command', { command: aiCommand.value });
    if (response.data.updatedSettings) {
      portalStore.settings = response.data.updatedSettings;
    } else {
      await portalStore.fetchSettings();
    }
  } finally {
    saving.value = false;
    aiCommand.value = '';
  }
};

const addWelcomeWidget = () => {
  const newWidget: PortalWidget = {
    id: `widget-${Date.now()}`,
    type: 'text',
    title: 'Quick Note',
    position: { x: 80, y: 120, width: 320, height: 180, zIndex: portalStore.widgets.length + 2 },
    minimized: false,
    maximized: false,
    fullscreen: false,
    config: { content: 'Editable note from toolbar.' },
  };
  portalStore.addWidget(newWidget);
};

const toggleTheme = () => {
  portalStore.setTheme(portalStore.theme === 'dark' ? 'light' : 'dark');
};

const handleUpdatePosition = (id: string, position: PortalWidget['position']) => {
  portalStore.bringToFront(id);
  portalStore.updateWidgetPosition(id, position);
};

const handleMinimize = (id: string) => portalStore.setWidgetState(id, { minimized: true, maximized: false, fullscreen: false });
const handleMaximize = (id: string) => {
  const current = portalStore.widgets.find((w) => w.id === id);
  const basePosition = current?.position ?? { x: 0, y: 0, width: 640, height: 360, zIndex: portalStore.widgets.length + 1 };
  portalStore.setWidgetState(id, {
    maximized: true,
    minimized: false,
    fullscreen: false,
    position: {
      ...basePosition,
      x: 0,
      y: 0,
      width: window.innerWidth - 48,
      height: window.innerHeight - 160,
      zIndex: portalStore.widgets.length + 1,
    },
  });
};
const handleFullscreen = (id: string) => portalStore.setWidgetState(id, { fullscreen: true, minimized: false, maximized: false });
const handleRestore = (id: string) =>
  portalStore.setWidgetState(id, {
    minimized: false,
    maximized: false,
    fullscreen: false,
  });
</script>

<template>
  <v-container fluid class="py-6">
    <v-row class="align-center mb-4" no-gutters>
      <v-col cols="12" md="8" class="d-flex align-center gap-3">
        <div class="text-h5 font-weight-bold">AI Agent Portal</div>
        <v-chip color="primary" variant="tonal" class="text-uppercase">Realtime</v-chip>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="addWelcomeWidget">
          Add Widget
        </v-btn>
        <v-btn color="secondary" variant="tonal" prepend-icon="mdi-theme-light-dark" @click="toggleTheme">
          {{ portalStore.theme === 'dark' ? 'Light Mode' : 'Dark Mode' }}
        </v-btn>
        <v-btn color="default" variant="tonal" prepend-icon="mdi-application-import" @click="portalStore.setAllFullscreen">
          Fullscreen All
        </v-btn>
      </v-col>
      <v-col cols="12" md="4" class="d-flex justify-end">
        <v-btn color="error" variant="tonal" prepend-icon="mdi-logout" @click="authStore.logout(); $router.push('/login')">
          Logout
        </v-btn>
      </v-col>
    </v-row>

    <div class="widget-surface rounded-lg pa-4 bg-white">
      <PortalWidgetComponent
        v-for="widget in portalStore.widgets"
        :key="widget.id"
        :widget="widget"
        @update-position="handleUpdatePosition"
        @minimize="handleMinimize"
        @maximize="handleMaximize"
        @fullscreen="handleFullscreen"
        @restore="handleRestore"
        @focus="portalStore.bringToFront"
      />
    </div>

    <v-row class="mt-6" dense>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>AI Agent Command</v-card-title>
          <v-card-text class="d-flex gap-3">
            <v-text-field
              v-model="aiCommand"
              label="Enter a command e.g. 'Change theme to dark'"
              prepend-inner-icon="mdi-robot-outline"
              hide-details
              clearable
            />
            <v-btn color="primary" class="align-self-center" :loading="saving" @click="sendCommand">
              Send
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Portal Status</v-card-title>
          <v-card-text>
            <div class="text-caption text-medium-emphasis">User: {{ authStore.username || 'Unknown' }}</div>
            <div class="text-caption text-medium-emphasis">Theme: {{ portalStore.theme }}</div>
            <div class="text-caption text-medium-emphasis">Widgets: {{ portalStore.widgets.length }}</div>
            <div class="text-caption text-medium-emphasis">Realtime: via AI responses / polling</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
