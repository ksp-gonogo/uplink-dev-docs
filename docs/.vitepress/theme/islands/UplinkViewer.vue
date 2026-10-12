<script setup lang="ts">
/**
 * Reads other authors' Uplinks by link. Paste a link to an Uplink's folder; it is
 * remembered in this browser and fetched again on every visit, so a branch link
 * follows the Uplink as it changes. Everything shown is the Uplink's spec sheet
 * (`docs/spec.json`) drawn as text: no value is ever treated as markup.
 */
import { onMounted, ref } from "vue";
import { resolveUplinkLink } from "../uplinks/link";
import { loadUplink, type LoadedUplink } from "../uplinks/load";
import { readSaved, type SavedUplink, withoutSaved, withSaved, writeSaved } from "../uplinks/store";

interface Entry {
  saved: SavedUplink;
  state: "loading" | "ready" | "failed";
  loaded?: LoadedUplink;
  error?: string;
}

const input = ref("");
const problem = ref("");
const entries = ref<Entry[]>([]);

async function fetchEntry(entry: Entry): Promise<void> {
  entry.state = "loading";
  try {
    entry.loaded = await loadUplink(entry.saved.base);
    entry.state = "ready";
  } catch (error) {
    entry.error = error instanceof Error ? error.message : String(error);
    entry.state = "failed";
  }
}

function persist(): void {
  writeSaved(entries.value.map((entry) => entry.saved));
}

function add(): void {
  const link = resolveUplinkLink(input.value);
  if ("error" in link) {
    problem.value = link.error;
    return;
  }
  problem.value = "";
  const saved = withSaved(
    entries.value.map((entry) => entry.saved),
    link,
  );
  if (saved.length === entries.value.length) {
    input.value = "";
    return;
  }
  const entry = ref<Entry>({ saved: link, state: "loading" }).value;
  entries.value = [...entries.value, entry];
  persist();
  input.value = "";
  void fetchEntry(entry);
}

function remove(base: string): void {
  const remaining = withoutSaved(
    entries.value.map((entry) => entry.saved),
    base,
  );
  entries.value = entries.value.filter((entry) => remaining.some((saved) => saved.base === entry.saved.base));
  persist();
}

function size(value: { w: number; h: number } | null): string {
  return value ? `${value.w} × ${value.h}` : "–";
}

function dash(items: readonly string[]): string {
  return items.length > 0 ? items.join(", ") : "–";
}

onMounted(() => {
  entries.value = readSaved().map((saved) => ({ saved, state: "loading" as const }));
  for (const entry of entries.value) void fetchEntry(entry);
});
</script>

<template>
  <section class="uplink-viewer">
    <form class="uplink-viewer__add" @submit.prevent="add">
      <label for="uplink-link">Link to an Uplink's folder</label>
      <div class="uplink-viewer__row">
        <input
          id="uplink-link"
          v-model="input"
          type="url"
          placeholder="https://github.com/owner/repo/tree/main/uplinks/name"
          autocomplete="off"
        />
        <button type="submit">Add</button>
      </div>
      <p v-if="problem" class="uplink-viewer__problem" role="alert">{{ problem }}</p>
      <p class="uplink-viewer__hint">
        A GitHub folder link, a jsDelivr link, or the URL of a released bundle. The link is kept in this browser and read
        again each time you open the page.
      </p>
    </form>

    <p v-if="entries.length === 0" class="uplink-viewer__empty">No Uplinks added yet.</p>

    <article v-for="entry in entries" :key="entry.saved.base" class="uplink-viewer__uplink">
      <header class="uplink-viewer__head">
        <h2>{{ entry.loaded ? entry.loaded.spec.uplink.name : entry.saved.label }}</h2>
        <button type="button" :aria-label="`Remove ${entry.saved.label}`" @click="remove(entry.saved.base)">Remove</button>
      </header>
      <p class="uplink-viewer__source">{{ entry.saved.label }}</p>
      <p v-if="entry.state === 'loading'" role="status">Reading…</p>
      <p v-else-if="entry.state === 'failed'" class="uplink-viewer__problem">{{ entry.error }}</p>

      <template v-else-if="entry.loaded">
        <p>{{ entry.loaded.spec.uplink.description }}</p>
        <table>
          <tbody>
            <tr><th scope="row">Uplink id</th><td><code>{{ entry.loaded.spec.uplink.id }}</code></td></tr>
            <tr><th scope="row">Version</th><td><code>{{ entry.loaded.spec.uplink.version }}</code></td></tr>
            <tr v-if="entry.loaded.spec.uplink.wraps">
              <th scope="row">Wraps</th>
              <td>
                {{ entry.loaded.spec.uplink.wraps.name }}
                <template v-if="entry.loaded.spec.uplink.wraps.builtAgainst">{{ entry.loaded.spec.uplink.wraps.builtAgainst }}</template>
                <template v-if="entry.loaded.spec.uplink.wraps.tier">({{ entry.loaded.spec.uplink.wraps.tier }})</template>
              </td>
            </tr>
            <tr v-if="entry.loaded.manifest && entry.loaded.manifest.contractMajor !== undefined">
              <th scope="row">Built against</th>
              <td>
                contract {{ entry.loaded.manifest.contractMajor }}.{{ entry.loaded.manifest.contractMinor }}<template
                  v-if="entry.loaded.manifest.apiVersion"
                  >, extension API {{ entry.loaded.manifest.apiVersion }}</template
                >
              </td>
            </tr>
          </tbody>
        </table>

        <template v-if="entry.loaded.spec.widgets.length > 0">
          <h3>Widgets</h3>
          <table>
            <thead><tr><th>Widget</th><th>Reads</th><th>Sends</th><th>Size</th></tr></thead>
            <tbody>
              <tr v-for="widget in entry.loaded.spec.widgets" :key="widget.id">
                <td><strong>{{ widget.name }}</strong><br /><code>{{ widget.id }}</code><br />{{ widget.description }}</td>
                <td>{{ dash([...widget.channels, ...widget.optionalChannels.map((c) => `${c} (optional)`)]) }}</td>
                <td>{{ dash(widget.commands) }}</td>
                <td>{{ size(widget.defaultSize) }}<br />min {{ size(widget.minSize) }}</td>
              </tr>
            </tbody>
          </table>
        </template>

        <template v-if="entry.loaded.spec.topics.length > 0">
          <h3>Topics</h3>
          <table>
            <thead><tr><th>Topic</th><th>Payload</th><th>Delivery</th><th>Delay</th><th>Fields</th></tr></thead>
            <tbody>
              <tr v-for="topic in entry.loaded.spec.topics" :key="topic.id">
                <td><code>{{ topic.id }}</code></td>
                <td><code v-if="topic.payload">{{ topic.payload }}{{ topic.array ? "[]" : "" }}</code><template v-else>–</template></td>
                <td>{{ topic.delivery ?? "–" }}</td>
                <td>{{ topic.delay ?? "–" }}</td>
                <td>{{ dash(topic.fields.map((f) => (f.unit ? `${f.name} (${f.unit})` : f.name))) }}</td>
              </tr>
            </tbody>
          </table>
        </template>

        <template v-if="entry.loaded.spec.commands.length > 0">
          <h3>Commands</h3>
          <table>
            <thead><tr><th>Command</th><th>Args</th><th>Result</th></tr></thead>
            <tbody>
              <tr v-for="command in entry.loaded.spec.commands" :key="command.id">
                <td><code>{{ command.id }}</code></td>
                <td><code>{{ command.args }}</code></td>
                <td><code>{{ command.result }}</code></td>
              </tr>
            </tbody>
          </table>
        </template>

        <template v-if="entry.loaded.spec.augments.length + entry.loaded.spec.contributions.length > 0">
          <h3>Slots it fills</h3>
          <table>
            <thead><tr><th>Kind</th><th>Id</th><th>Into</th><th>Reads</th></tr></thead>
            <tbody>
              <tr v-for="augment in entry.loaded.spec.augments" :key="`a-${augment.id}`">
                <td>augment</td><td><code>{{ augment.id }}</code></td><td><code>{{ augment.augments }}</code></td>
                <td>{{ dash(augment.channels) }}</td>
              </tr>
              <tr v-for="contribution in entry.loaded.spec.contributions" :key="`c-${contribution.id}`">
                <td>contribution</td><td><code>{{ contribution.id }}</code></td><td><code>{{ contribution.contributes }}</code></td>
                <td>{{ dash(contribution.deps) }}</td>
              </tr>
            </tbody>
          </table>
        </template>

        <template v-if="entry.loaded.spec.errorCodes.length > 0">
          <h3>Error codes</h3>
          <table>
            <thead><tr><th>Code</th><th>Refines</th><th>Reads as</th><th>Meaning</th></tr></thead>
            <tbody>
              <tr v-for="code in entry.loaded.spec.errorCodes" :key="code.id">
                <td><code>{{ code.id }}</code></td><td>{{ code.refines ?? "–" }}</td><td>{{ code.sentence }}</td><td>{{ code.meaning }}</td>
              </tr>
            </tbody>
          </table>
        </template>

        <template v-if="entry.loaded.pictures.length > 0">
          <h3>Pictures</h3>
          <div class="uplink-viewer__pictures">
            <img
              v-for="picture in entry.loaded.pictures"
              :key="picture.name"
              :src="picture.url"
              :alt="picture.name"
              loading="lazy"
            />
          </div>
        </template>
      </template>
    </article>
  </section>
</template>

<style scoped>
.uplink-viewer__row { display: flex; gap: 8px; }
.uplink-viewer__row input { flex: 1; min-width: 0; padding: 6px 10px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg-soft); color: inherit; }
.uplink-viewer button { padding: 6px 14px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg-soft); color: inherit; cursor: pointer; }
.uplink-viewer button:focus-visible, .uplink-viewer input:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
.uplink-viewer__hint, .uplink-viewer__source, .uplink-viewer__empty { color: var(--vp-c-text-2); font-size: 0.9em; }
.uplink-viewer__problem { color: var(--vp-c-danger-1); }
.uplink-viewer__uplink { margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--vp-c-divider); }
.uplink-viewer__head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.uplink-viewer__head h2 { margin: 0; border: 0; padding: 0; }
.uplink-viewer__pictures { display: flex; flex-wrap: wrap; gap: 12px; }
.uplink-viewer__pictures img { max-width: 100%; height: auto; border: 1px solid var(--vp-c-divider); border-radius: 4px; }
</style>
