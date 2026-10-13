<script setup lang="ts">
/**
 * The sidebar's "Custom Uplinks" section: each Uplink added in this browser,
 * with its overview and its docs files beneath it. It appears on every page that
 * has a sidebar once there is one to list, and reads the name and docs files
 * saved on the last visit, so it needs no network. On the Uplinks page the
 * heading is the page's own sidebar group, and the section opens with the link
 * back to the form.
 */
import { useRoute } from "vitepress";
import { onMounted, watch } from "vue";
import { hrefOf, PAGE } from "../uplinks/address";
import { start, state } from "../uplinks/registry";
import { routeHash } from "../uplinks/route";

const site = useRoute();

onMounted(start);
watch(
  () => [site.path, site.hash],
  () => state.started && start(),
);

const onPage = () => site.path.replace(/\.html$/, "").endsWith(PAGE);

function current(route: Parameters<typeof routeHash>[0]): "page" | undefined {
  return onPage() && routeHash(state.route) === routeHash(route) ? "page" : undefined;
}
</script>

<template>
  <nav v-if="state.entries.length > 0 || onPage()" class="cu-nav" :class="{ 'cu-nav--on-page': onPage() }" aria-label="Custom Uplinks">
    <p v-if="!onPage()" class="cu-nav__title">Custom Uplinks</p>
    <ul class="cu-nav__list">
      <li v-if="onPage()">
        <a class="cu-nav__name" :href="hrefOf({ kind: 'home' })" :aria-current="current({ kind: 'home' })">Add an Uplink</a>
      </li>
      <li v-for="entry in state.entries" :key="entry.saved.base" class="cu-nav__uplink">
        <a
          class="cu-nav__name"
          :href="hrefOf({ kind: 'overview', base: entry.saved.base })"
          :aria-current="current({ kind: 'overview', base: entry.saved.base })"
        >
          {{ entry.saved.name ?? entry.saved.label }}
          <span v-if="entry.state === 'failed'" class="cu-nav__failed" title="This Uplink could not be read">
            <span aria-hidden="true">!</span><span class="cu-nav__sr"> could not be read</span>
          </span>
        </a>
        <ul v-if="entry.saved.docs?.length" class="cu-nav__docs">
          <li v-for="doc in entry.saved.docs" :key="doc.path">
            <a
              :href="hrefOf({ kind: 'doc', base: entry.saved.base, path: doc.path })"
              :aria-current="current({ kind: 'doc', base: entry.saved.base, path: doc.path })"
              >{{ doc.title }}</a
            >
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.cu-nav { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--vp-c-divider); }
.cu-nav--on-page { margin-top: 0; padding-top: 0; border-top: 0; }
.cu-nav__title { margin: 0 0 8px; font-size: 14px; font-weight: 700; color: var(--vp-c-text-1); }
.cu-nav ul { margin: 0; padding: 0; list-style: none; }
.cu-nav a { display: block; padding: 4px 0; font-size: 14px; line-height: 20px; color: var(--vp-c-text-2); text-decoration: none; transition: color 0.25s; }
.cu-nav a:hover { color: var(--vp-c-text-1); }
.cu-nav a[aria-current="page"] { color: var(--vp-c-brand-1); font-weight: 600; }
.cu-nav a:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; border-radius: 2px; }
.cu-nav__name { font-weight: 500; }
.cu-nav__docs { padding-left: 14px; border-left: 1px solid var(--vp-c-divider); margin-left: 2px; }
.cu-nav__failed { margin-left: 4px; color: var(--vp-c-danger-1); font-weight: 700; }
.cu-nav__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
