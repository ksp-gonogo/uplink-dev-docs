<script setup lang="ts">
/**
 * The inside of one example's frame: mounts the example named by the page's
 * `?id=` and reports the render's own height to the page that framed it, once
 * as soon as the mount settles, whether or not it succeeded, and again on
 * every resize. Each example runs in a frame of its own because the app's
 * registries are page-wide, and an extension registered for one example must
 * not appear in another.
 *
 * A mount that throws is reported the same way and draws a plain failure note,
 * so the page's loading indicator never outlives the frame.
 *
 * The host fills the frame, so the app's background covers it edge to edge
 * whatever height the page gives the frame, and the render sits in its middle.
 */
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { MountedDemo } from "./mount";

const host = ref<HTMLElement | null>(null);
const missing = ref<string | null>(null);
const failed = ref(false);
let mounted: MountedDemo | undefined;
let observer: ResizeObserver | undefined;

function report(id: string): void {
  if (window.parent === window) return;
  const measured = mounted?.content ?? host.value;
  const height = measured ? Math.ceil(measured.getBoundingClientRect().height) : 0;
  window.parent.postMessage({ type: "gonogo-demo", id, height }, window.location.origin);
}

onMounted(async () => {
  const id = new URLSearchParams(window.location.search).get("id") ?? "";
  try {
    const { mountDemo } = await import("./mount");
    if (!host.value) return;
    mounted = await mountDemo(id, host.value);
  } catch (error) {
    console.error(error);
    failed.value = true;
  } finally {
    report(id);
  }
  if (failed.value) return;
  if (!mounted) {
    missing.value = id;
    return;
  }
  observer = new ResizeObserver(() => report(id));
  observer.observe(mounted.content);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  mounted?.unmount();
});
</script>

<template>
  <main class="demo-stage">
    <div v-show="missing === null && !failed" ref="host" class="demo-stage__host" />
    <p v-if="missing !== null" class="demo-stage__missing">
      No example is wired for <code>{{ missing }}</code>.
    </p>
    <p v-if="failed" class="demo-stage__missing">This example failed to load.</p>
  </main>
</template>

<style scoped>
.demo-stage {
  display: flex;
  min-height: 100vh;
}

/* Outer rules outrank the shadow root's `:host`, so these hold over the app's own. */
.demo-stage__host {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.demo-stage__missing {
  margin: auto;
  padding: 16px;
  color: var(--vp-c-text-2);
}
</style>
