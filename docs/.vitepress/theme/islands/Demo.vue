<script setup lang="ts">
/**
 * One example: its live render and the file that produces it, as one block.
 * Wide enough, the two sit side by side; narrower, they are two tabs.
 *
 * The render runs in a frame of its own (see `DemoStage.vue`) that fills the
 * preview pane: never shorter than its content or `MIN_HEIGHT`, and as tall as
 * the code beside it when that is taller. The frame loads once the block nears
 * the viewport and the page's frame queue gives it a turn. Until the frame
 * reports its first render, the pane shows a loading indicator; a frame that
 * errors or outlasts its turn shows a plain note instead.
 *
 * Served as static HTML, before any script runs, the block is the render's
 * screenshot (taken by `check-demos.mjs` from the same frame), described by
 * `label`, above the code, so a reader with no scripts and a search engine
 * see what the example shows and the code that shows it.
 */
import { withBase } from "vitepress";
import { computed, onBeforeUnmount, onMounted, ref, useSlots } from "vue";
import { takeTurn } from "./frameQueue";

const props = defineProps<{ id: string; file?: string; label?: string }>();
const slots = useSlots();

const MIN_HEIGHT = 200;
/** How far outside the viewport a block starts loading its frame. */
const LOAD_AHEAD = "800px 0px";
/** How long a frame that never reports holds its turn. */
const TURN_LIMIT_MS = 30_000;
/** The block's own width at which the render and the code fit side by side. */
const WIDE = 720;
const TABS = [
  { key: "preview", label: "Preview" },
  { key: "code", label: "Code" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const root = ref<HTMLElement | null>(null);
const frame = ref<HTMLIFrameElement | null>(null);
const tabButtons = ref<HTMLButtonElement[]>([]);
const wide = ref(false);
const tab = ref<Tab>("preview");
const height = ref(0);
const loading = ref(false);
const status = ref<"pending" | "ready" | "failed">("pending");
const mounted = ref(false);

const hasCode = computed(() => slots.default !== undefined);
const tabbed = computed(() => hasCode.value && mounted.value && !wide.value);
const shot = computed(() => withBase(`/demo-shots/${props.id}.png`));
const described = computed(() => props.label ?? (props.file ? `The render of ${props.file}` : "The rendered example"));
const src = computed(() => (loading.value ? withBase(`/demo?id=${encodeURIComponent(props.id)}`) : undefined));
const uid = computed(() => `demo-${props.id}`);

function shown(key: Tab): boolean {
  return !tabbed.value || tab.value === key;
}

function panelAttrs(key: Tab): Record<string, string> {
  if (!tabbed.value) return {};
  return { role: "tabpanel", "aria-labelledby": `${uid.value}-tab-${key}` };
}

function onTabKey(event: KeyboardEvent): void {
  const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
  if (!keys.includes(event.key)) return;
  event.preventDefault();
  const at = TABS.findIndex((t) => t.key === tab.value);
  const last = TABS.length - 1;
  const next =
    event.key === "Home" ? 0 : event.key === "End" ? last : (at + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
  tab.value = TABS[next].key;
  tabButtons.value[next]?.focus();
}

let release: (() => void) | undefined;
let unmounted = false;
let turnTimer: ReturnType<typeof setTimeout> | undefined;

function endTurn(): void {
  clearTimeout(turnTimer);
  release?.();
}

function fail(): void {
  if (status.value === "pending") status.value = "failed";
  endTurn();
}

async function load(): Promise<void> {
  release = await takeTurn();
  if (unmounted) {
    endTurn();
    return;
  }
  turnTimer = setTimeout(fail, TURN_LIMIT_MS);
  loading.value = true;
}

function onMessage(event: MessageEvent): void {
  if (event.source !== frame.value?.contentWindow) return;
  if (event.data?.type !== "gonogo-demo") return;
  height.value = event.data.height;
  status.value = "ready";
  endTurn();
}

let observer: ResizeObserver | undefined;
let nearby: IntersectionObserver | undefined;

onMounted(() => {
  mounted.value = true;
  window.addEventListener("message", onMessage);
  if (!root.value) return;
  observer = new ResizeObserver(([entry]) => {
    wide.value = entry.contentRect.width >= WIDE;
  });
  observer.observe(root.value);
  nearby = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      nearby?.disconnect();
      void load();
    },
    { rootMargin: LOAD_AHEAD },
  );
  nearby.observe(root.value);
});

onBeforeUnmount(() => {
  window.removeEventListener("message", onMessage);
  observer?.disconnect();
  nearby?.disconnect();
  unmounted = true;
  endTurn();
});
</script>

<template>
  <figure ref="root" class="demo" :class="{ 'demo--split': hasCode && wide }">
    <div v-if="tabbed" role="tablist" aria-label="Example" class="demo__tabs">
      <button
        v-for="t in TABS"
        :id="`${uid}-tab-${t.key}`"
        :key="t.key"
        ref="tabButtons"
        type="button"
        role="tab"
        class="demo__tab"
        :aria-selected="tab === t.key"
        :aria-controls="`${uid}-panel-${t.key}`"
        :tabindex="tab === t.key ? 0 : -1"
        @click="tab = t.key"
        @keydown="onTabKey"
      >
        {{ t.label }}
      </button>
    </div>
    <div class="demo__panels">
      <div v-show="shown('preview')" :id="`${uid}-panel-preview`" class="demo__preview" v-bind="panelAttrs('preview')">
        <img v-if="!mounted" class="demo__shot" :src="shot" :alt="described" loading="lazy" />
        <iframe
          v-if="mounted"
          ref="frame"
          class="demo__frame"
          :src="src"
          :title="label ?? (file ? `Live example of ${file}` : 'Live example')"
          :style="{ minHeight: `${Math.max(MIN_HEIGHT, height)}px` }"
          @error="fail"
        />
        <div v-if="mounted && status !== 'ready'" class="demo__status" role="status">
          <template v-if="status === 'pending'">
            <span class="demo__spinner" aria-hidden="true" />
            <span class="demo__status-label">Loading example</span>
          </template>
          <p v-else class="demo__failed">This example failed to load.</p>
        </div>
      </div>
      <div v-if="hasCode" v-show="shown('code')" :id="`${uid}-panel-code`" class="demo__code" v-bind="panelAttrs('code')">
        <p v-if="file" class="demo__file">{{ file }}</p>
        <slot />
      </div>
    </div>
  </figure>
</template>

<style scoped>
.demo {
  margin: 16px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg-alt);
}

.demo__tabs {
  display: flex;
  border-bottom: 1px solid var(--vp-c-divider);
}

.demo__tab {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  border-bottom: 2px solid transparent;
}

.demo__tab[aria-selected="true"] {
  color: var(--vp-c-text-1);
  border-bottom-color: var(--vp-c-brand-1);
}

.demo__tab:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: -2px;
}

.demo--split .demo__panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.demo--split .demo__code {
  border-left: 1px solid var(--vp-c-divider);
}

/* Until the frame paints, the pane shows the same near-black the app's surface is drawn in. */
.demo__preview {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--vp-c-bg);
}

.demo__shot {
  display: block;
  max-width: 100%;
  height: auto;
}

.demo__frame {
  display: block;
  flex: 1;
  width: 100%;
  border: 0;
}

.demo__status {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--vp-c-bg);
  pointer-events: none;
}

.demo__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-text-2);
  border-radius: 50%;
}

/* Heard by a screen reader always, seen only where the spinner cannot turn. */
.demo__status-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: no-preference) {
  .demo__spinner {
    animation: demo-spin 0.9s linear infinite;
  }
}

@media (prefers-reduced-motion: reduce) {
  .demo__status-label {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    clip-path: none;
    font-size: 13px;
    color: var(--vp-c-text-2);
  }
}

@keyframes demo-spin {
  to {
    transform: rotate(360deg);
  }
}

.demo__failed {
  margin: 0;
  padding: 16px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.demo__file {
  margin: 0;
  padding: 8px 16px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
}

.demo__code :deep(div[class*="language-"]) {
  margin: 0;
  border-radius: 0;
}
</style>
