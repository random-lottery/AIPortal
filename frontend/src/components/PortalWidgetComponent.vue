<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import type { PortalWidget } from '@/interfaces/portal';

const props = defineProps<{
  widget: PortalWidget;
}>();

const emit = defineEmits<{
  (e: 'update-position', id: string, position: PortalWidget['position']): void;
  (e: 'minimize', id: string): void;
  (e: 'maximize', id: string): void;
  (e: 'fullscreen', id: string): void;
  (e: 'restore', id: string): void;
  (e: 'focus', id: string): void;
}>();

const isDragging = ref(false);
const isResizing = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

const widgetStyle = computed<Record<string, string | number>>(() => {
  if (props.widget.fullscreen) {
    return {
      position: 'absolute',
      inset: '0',
      zIndex: props.widget.position.zIndex,
    };
  }
  if (props.widget.maximized) {
    return {
      position: 'absolute',
      left: '0px',
      top: '0px',
      width: '100%',
      height: '100%',
      zIndex: props.widget.position.zIndex,
    };
  }
  return {
    position: 'absolute',
    left: `${props.widget.position.x}px`,
    top: `${props.widget.position.y}px`,
    width: `${props.widget.position.width}px`,
    height: `${props.widget.position.height}px`,
    zIndex: props.widget.position.zIndex,
  } as Record<string, string | number>;
});

const startDrag = (event: PointerEvent) => {
  if (props.widget.maximized || props.widget.fullscreen || props.widget.minimized) return;
  emit('focus', props.widget.id);
  isDragging.value = true;
  dragOffset.value = {
    x: event.clientX - props.widget.position.x,
    y: event.clientY - props.widget.position.y,
  };
  window.addEventListener('pointermove', onDrag);
  window.addEventListener('pointerup', stopDrag);
};

const onDrag = (event: PointerEvent) => {
  if (!isDragging.value) return;
  const newPosition = {
    ...props.widget.position,
    x: event.clientX - dragOffset.value.x,
    y: event.clientY - dragOffset.value.y,
  };
  emit('update-position', props.widget.id, newPosition);
};

const stopDrag = () => {
  isDragging.value = false;
  window.removeEventListener('pointermove', onDrag);
  window.removeEventListener('pointerup', stopDrag);
};

const startResize = (event: PointerEvent) => {
  if (props.widget.maximized || props.widget.fullscreen || props.widget.minimized) return;
  emit('focus', props.widget.id);
  isResizing.value = true;
  dragOffset.value = {
    x: event.clientX,
    y: event.clientY,
  };
  window.addEventListener('pointermove', onResize);
  window.addEventListener('pointerup', stopResize);
};

const onResize = (event: PointerEvent) => {
  if (!isResizing.value) return;
  const deltaX = event.clientX - dragOffset.value.x;
  const deltaY = event.clientY - dragOffset.value.y;
  const newPosition = {
    ...props.widget.position,
    width: Math.max(240, props.widget.position.width + deltaX),
    height: Math.max(160, props.widget.position.height + deltaY),
  };
  dragOffset.value = { x: event.clientX, y: event.clientY };
  emit('update-position', props.widget.id, newPosition);
};

const stopResize = () => {
  isResizing.value = false;
  window.removeEventListener('pointermove', onResize);
  window.removeEventListener('pointerup', stopResize);
};

onBeforeUnmount(() => {
  stopDrag();
  stopResize();
});

const contentText = computed(() => props.widget.config?.content || 'No content');
</script>

<template>
  <v-card :style="widgetStyle" class="elevation-6 d-flex flex-column">
    <v-sheet
      color="primary"
      class="d-flex align-center px-3 py-2 text-white"
      style="cursor: move"
      @pointerdown.prevent="startDrag"
    >
      <span class="font-weight-medium">{{ widget.title }}</span>
      <v-spacer />
      <v-btn size="small" icon variant="text" @click="emit('minimize', widget.id)">
        <v-icon>mdi-window-minimize</v-icon>
      </v-btn>
      <v-btn size="small" icon variant="text" @click="emit('maximize', widget.id)">
        <v-icon>mdi-window-maximize</v-icon>
      </v-btn>
      <v-btn size="small" icon variant="text" @click="emit('fullscreen', widget.id)">
        <v-icon>mdi-fullscreen</v-icon>
      </v-btn>
      <v-btn
        v-if="widget.minimized || widget.maximized || widget.fullscreen"
        size="small"
        icon
        variant="text"
        @click="emit('restore', widget.id)"
      >
        <v-icon>mdi-window-restore</v-icon>
      </v-btn>
    </v-sheet>

    <div v-if="widget.minimized" class="pa-4 text-medium-emphasis">
      Minimized
    </div>
    <div v-else class="flex-grow-1 overflow-auto pa-4">
      <div v-if="widget.type === 'text'">
        {{ contentText }}
      </div>
      <div v-else-if="widget.type === 'chart'">
        <p class="text-medium-emphasis">
          Chart widget (placeholder). Data URL: {{ widget.config?.dataUrl || 'N/A' }}
        </p>
      </div>
      <div v-else-if="widget.type === 'weather'">
        <p class="text-medium-emphasis">
          Weather for {{ widget.config?.location || 'Unknown' }} (placeholder)
        </p>
      </div>
      <div v-else>
        <p class="text-medium-emphasis">Custom content placeholder.</p>
      </div>
    </div>

    <div
      class="resize-handle"
      title="Drag to resize"
      @pointerdown.prevent="startResize"
    />
  </v-card>
</template>

<style scoped>
.resize-handle {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.15);
  cursor: se-resize;
}
</style>
