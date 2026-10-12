<script setup lang="ts">
/**
 * One widget of a loaded Uplink client, drawn by the viewer's host against a
 * stream that has delivered nothing, at the size its spec sheet gives.
 */
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { ViewerHost } from "../uplinks/client";

const props = defineProps<{
  host: ViewerHost;
  def: unknown;
  size: { w: number; h: number };
}>();

const container = ref<HTMLElement | null>(null);
const failure = ref("");
let unmount: (() => void) | undefined;

onMounted(() => {
  if (!container.value) return;
  try {
    unmount = props.host.mountWidget(container.value, props.def, props.size);
  } catch (error) {
    failure.value = error instanceof Error ? error.message : String(error);
  }
});

onBeforeUnmount(() => unmount?.());
</script>

<template>
  <div class="uplink-widget">
    <p v-if="failure" class="uplink-widget__problem" role="alert">{{ failure }}</p>
    <div ref="container" class="uplink-widget__stage"></div>
  </div>
</template>

<style scoped>
.uplink-widget__stage { overflow: auto; }
.uplink-widget__problem { color: var(--vp-c-danger-1); }
</style>
