<script setup lang="ts">
import { useData } from "vitepress";

/** Shows its content only on one channel of the site: `release` (the root) or `rc` (/rc/). */
const props = defineProps<{ is: "release" | "rc" }>();
const { theme } = useData();
</script>

<template><slot v-if="(theme.published.npmTag === 'latest' ? 'release' : 'rc') === props.is" /></template>
