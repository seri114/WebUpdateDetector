<template>
  <Header />
  <router-view />
</template>

<script lang="ts">
import { defineComponent, reactive, computed } from "vue";
import { useHead } from '@vueuse/head'
import Header from "@/components/Header.vue";

export default defineComponent({
  name: "App",
  setup() {
    const siteData = reactive({
      title: `Numa Crawler`,
      description: `Web crawler`,
    })

    useHead({
      // Can be static or computed
      title: computed(() => siteData.title),
      meta: [
        {
          name: `description`,
          content: computed(() => siteData.description),
        },
      ],
    })
  },
  components: {
    Header
  },
});
</script>

<style>
/* @import "https://cdn.jsdelivr.net/npm/water.css@2/out/dark.min.css"; */

</style>
