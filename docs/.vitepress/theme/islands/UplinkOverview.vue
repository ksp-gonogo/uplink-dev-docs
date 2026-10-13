<script setup lang="ts">
/**
 * A custom Uplink's overview: its spec sheet, as the Uplink's own folder
 * describes it, and each widget its released client registers, drawn as the
 * app draws it before the first sample arrives.
 */
import type { Entry } from "../uplinks/registry";
import UplinkWidget from "./UplinkWidget.vue";

const props = defineProps<{ entry: Entry }>();

function sizeOf(id: string, fallback: { w: number; h: number } | null | undefined): { w: number; h: number } {
  return props.entry.loaded?.spec.widgets.find((widget) => widget.id === id)?.defaultSize ?? fallback ?? { w: 6, h: 4 };
}

function size(value: { w: number; h: number } | null): string {
  return value ? `${value.w} × ${value.h}` : "–";
}

function dash(items: readonly string[]): string {
  return items.length > 0 ? items.join(", ") : "–";
}
</script>

<template>
  <div v-if="entry.loaded">
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
      <h2>Widgets</h2>
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

    <template v-if="entry.clientState !== 'none'">
      <h2>Live widgets</h2>
      <p v-if="entry.clientState === 'loading'" role="status">Loading the client…</p>
      <p v-else-if="entry.clientState === 'failed'" class="cu-problem" role="alert">{{ entry.clientError }}</p>
      <template v-else-if="entry.client">
        <p v-if="entry.client.widgets.size === 0" class="cu-hint">The client registered no widgets.</p>
        <figure v-for="[id, def] in entry.client.widgets" :key="id" class="cu-drawn">
          <figcaption><strong>{{ def.name }}</strong> <code>{{ id }}</code></figcaption>
          <UplinkWidget :host="entry.client.host" :def="def" :size="sizeOf(id, def.defaultSize)" />
        </figure>
      </template>
    </template>

    <template v-if="entry.loaded.spec.topics.length > 0">
      <h2>Topics</h2>
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
      <h2>Commands</h2>
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
      <h2>Slots it fills</h2>
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
      <h2>Error codes</h2>
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
      <h2>Pictures</h2>
      <div class="cu-pictures">
        <img
          v-for="picture in entry.loaded.pictures"
          :key="picture.name"
          :src="picture.url"
          :alt="picture.name"
          loading="lazy"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.cu-problem { color: var(--vp-c-danger-1); }
.cu-hint { color: var(--vp-c-text-2); font-size: 0.9em; }
.cu-drawn { margin: 12px 0; }
.cu-pictures { display: flex; flex-wrap: wrap; gap: 12px; }
.cu-pictures img { max-width: 100%; height: auto; border: 1px solid var(--vp-c-divider); border-radius: 4px; }
</style>
