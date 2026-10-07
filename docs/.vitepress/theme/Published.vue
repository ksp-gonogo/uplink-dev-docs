<script setup lang="ts">
import { useData } from "vitepress";

/** One field of what an author installs today, from `reference/artifacts.json` through the site config. */
const props = defineProps<{ field: "version" | "name" | "npmTag" }>();
const { theme } = useData();
</script>

<template><span>{{ theme.published[props.field] }}</span></template>
