<script setup lang="ts">
/**
 * The page behind the "Custom Uplinks" sidebar section. The address, in the
 * hash, picks what it shows: the form and the list, an Uplink's overview, or
 * one of its docs files. An address naming an Uplink this browser has not added
 * offers to add it. Everything is read by the browser straight from the
 * Uplink's folder; nothing is sent anywhere.
 */
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { hrefOf } from "../uplinks/address";
import { resolveUplinkLink } from "../uplinks/link";
import { renderMarkdown } from "../uplinks/markdown";
import { add, ensureLoaded, find, reload, remove, start, state } from "../uplinks/registry";
import { routeHash } from "../uplinks/route";
import UplinkOverview from "./UplinkOverview.vue";

const input = ref("");
const problem = ref("");
const heading = ref<HTMLElement | null>(null);

const route = computed(() => state.route);
const entry = computed(() => (route.value.kind === "home" ? undefined : find(route.value.base)));
const offered = computed(() => (route.value.kind === "home" || entry.value ? null : resolveUplinkLink(route.value.base)));

const doc = computed(() => {
  const current = route.value;
  if (current.kind !== "doc") return undefined;
  return entry.value?.loaded?.docs.find((file) => file.path === current.path);
});

const rendered = computed(() => {
  const loaded = entry.value?.loaded;
  const file = doc.value;
  if (!loaded || !file || route.value.kind !== "doc") return "";
  const base = route.value.base;
  return renderMarkdown(file.text, {
    fileUrl: file.url,
    root: loaded.root,
    docs: loaded.docs,
    hrefFor: (path) => hrefOf({ kind: "doc", base, path }),
  });
});

const title = computed(() => {
  if (route.value.kind === "home") return "Custom Uplinks";
  const name = entry.value?.saved.name ?? entry.value?.saved.label;
  if (!entry.value) return offered.value && "label" in offered.value ? offered.value.label : "Custom Uplink";
  return route.value.kind === "doc" ? `${name}: ${doc.value?.title ?? route.value.path}` : (name ?? "");
});

function go(hash: string): void {
  location.hash = hash;
}

function submit(): void {
  const link = resolveUplinkLink(input.value);
  if ("error" in link) {
    problem.value = link.error;
    return;
  }
  problem.value = "";
  input.value = "";
  add(link);
  go(routeHash({ kind: "overview", base: link.base }));
}

function addOffered(): void {
  if (offered.value && "base" in offered.value) add(offered.value);
}

function removeEntry(base: string): void {
  remove(base);
  if (route.value.kind !== "home" && route.value.base === base) go("#/");
}

/** Reads whatever the address needs: every Uplink for the list, the named one otherwise. */
function load(): void {
  if (route.value.kind === "home") {
    for (const item of state.entries) void ensureLoaded(item);
  } else if (entry.value) {
    void ensureLoaded(entry.value);
  }
}

onMounted(() => {
  start();
  load();
});

watch(
  () => [routeHash(state.route), state.entries.length],
  async (now, before) => {
    load();
    if (now[0] !== before[0]) {
      await nextTick();
      heading.value?.focus();
    }
  },
);

watch(title, (value) => {
  document.title = `${value} | Gonogo Uplink Docs`;
});

function status(item: (typeof state.entries)[number]): string {
  if (item.state === "failed") return "Could not be read";
  if (item.state === "loading") return "Reading";
  if (item.state === "ready") return item.clientState === "failed" ? "Read, client not run" : "Read";
  return "Not read yet";
}
</script>

<template>
  <div class="cu vp-doc">
    <template v-if="!state.started">
      <h1>Custom Uplinks</h1>
      <p role="status">Loading…</p>
    </template>

    <template v-else-if="route.kind === 'home'">
      <h1 ref="heading" tabindex="-1">Custom Uplinks</h1>
      <p>
        Paste a link to an Uplink's folder to read what it publishes, accepts and draws. It is listed under Custom Uplinks in
        the sidebar, with its overview and its docs files, and stays there in this browser. The page is static: the Uplink is
        read straight from its folder, and nothing is sent to a server.
      </p>
      <form class="cu-add" @submit.prevent="submit">
        <label for="uplink-link">Link to an Uplink's folder</label>
        <div class="cu-row">
          <input
            id="uplink-link"
            v-model="input"
            type="url"
            placeholder="https://github.com/owner/repo/tree/main/uplinks/name"
            autocomplete="off"
            :aria-describedby="problem ? 'uplink-problem uplink-hint' : 'uplink-hint'"
          />
          <button type="submit">Add</button>
        </div>
        <p v-if="problem" id="uplink-problem" class="cu-problem" role="alert">{{ problem }}</p>
        <p id="uplink-hint" class="cu-hint">
          A GitHub folder link, a jsDelivr link, or the URL of a released bundle. A source folder shows its README; a release
          shows its spec sheet and draws its widgets.
        </p>
      </form>

      <p v-if="state.entries.length === 0" class="cu-hint">No Uplinks added yet.</p>
      <ul v-else class="cu-list">
        <li v-for="item in state.entries" :key="item.saved.base" class="cu-item">
          <div>
            <a :href="hrefOf({ kind: 'overview', base: item.saved.base })">{{ item.saved.name ?? item.saved.label }}</a>
            <p class="cu-hint">{{ item.saved.label }}</p>
            <p class="cu-hint" :class="{ 'cu-problem': item.state === 'failed' }">{{ status(item) }}</p>
          </div>
          <button type="button" :aria-label="`Remove ${item.saved.name ?? item.saved.label}`" @click="removeEntry(item.saved.base)">
            Remove
          </button>
        </li>
      </ul>
    </template>

    <template v-else-if="!entry">
      <h1 ref="heading" tabindex="-1">Add this Uplink?</h1>
      <template v-if="offered && 'base' in offered">
        <p>This address opens the Uplink in <code>{{ offered.label }}</code>, which is not in the list in this browser.</p>
        <p class="cu-hint">Adding it reads that folder from the browser and keeps the link here. Nothing is sent to a server.</p>
        <button type="button" class="cu-primary" @click="addOffered">Add to Custom Uplinks</button>
      </template>
      <template v-else>
        <p class="cu-problem" role="alert">{{ offered && "error" in offered ? offered.error : "" }}</p>
        <p><a :href="hrefOf({ kind: 'home' })">Add an Uplink by its folder link</a></p>
      </template>
    </template>

    <template v-else>
      <p class="cu-crumb">
        <a :href="hrefOf({ kind: 'home' })">Custom Uplinks</a>
        <template v-if="route.kind === 'doc'">
          /
          <a :href="hrefOf({ kind: 'overview', base: route.base })">{{ entry.saved.name ?? entry.saved.label }}</a>
        </template>
      </p>
      <header class="cu-head">
        <h1 ref="heading" tabindex="-1">{{ route.kind === "doc" ? (doc?.title ?? route.path) : (entry.saved.name ?? entry.saved.label) }}</h1>
        <div class="cu-actions">
          <button v-if="entry.state === 'failed'" type="button" @click="reload(entry)">Try again</button>
          <button type="button" :aria-label="`Remove ${entry.saved.name ?? entry.saved.label}`" @click="removeEntry(entry.saved.base)">
            Remove
          </button>
        </div>
      </header>
      <p class="cu-hint">{{ entry.saved.label }}</p>

      <p v-if="entry.state === 'idle' || entry.state === 'loading'" role="status">Reading…</p>
      <template v-else-if="entry.state === 'failed'">
        <p class="cu-problem" role="alert">{{ entry.error }}</p>
        <p class="cu-hint">The Uplink stays listed. Fix the folder or the link and try again.</p>
      </template>

      <template v-else-if="route.kind === 'doc'">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="doc" class="cu-doc" v-html="rendered"></div>
        <p v-else class="cu-problem" role="alert">
          This Uplink's folder has no <code>{{ route.path }}</code>. A released version carries its bundle, manifest and
          spec sheet; the README sits in the source folder.
        </p>
      </template>

      <UplinkOverview v-else :entry="entry" />
    </template>
  </div>
</template>

<style scoped>
.cu-row { display: flex; gap: 8px; }
.cu-row input { flex: 1; min-width: 0; padding: 6px 10px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg-soft); color: inherit; }
.cu button { padding: 6px 14px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg-soft); color: inherit; cursor: pointer; }
.cu button:hover { border-color: var(--vp-c-brand-1); }
.cu .cu-primary { background: var(--vp-c-brand-3); border-color: var(--vp-c-brand-3); color: var(--vp-c-white); }
.cu button:focus-visible, .cu input:focus-visible, .cu a:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
.cu-hint { color: var(--vp-c-text-2); font-size: 0.9em; margin: 4px 0; }
.cu-problem { color: var(--vp-c-danger-1); }
.cu-list { list-style: none; padding: 0; }
.cu-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 12px 0; border-top: 1px solid var(--vp-c-divider); }
.cu-crumb { margin: 0 0 4px; font-size: 0.9em; color: var(--vp-c-text-2); }
.cu-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.cu-head h1 { margin: 0; }
.cu-actions { display: flex; gap: 8px; }
.cu-doc :deep(img) { max-width: 100%; height: auto; }
</style>
