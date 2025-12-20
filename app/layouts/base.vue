<!-- layouts/base.vue -->
<script setup lang="ts">
import NotificationComponent from "@/components/utils/NotificationComponent.vue";
import ColorModeToggle from "~/components/utils/ColorModeToggle.vue";

const route = useRoute();

useHead(() => ({
  title: route.meta.title || "Gongboard",
}));
</script>

<template>
  <ColorModeToggle class="absolute top-6 left-6 z-50" />
  <slot></slot>
  <NotificationComponent />
</template>