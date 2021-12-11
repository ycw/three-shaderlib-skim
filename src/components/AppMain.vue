<script setup>
import SourceViewer from "./SourceViewer.vue"
import Widgets from "./Widgets.vue"
import useMainStore from "../stores/main"
import { ref, computed } from "vue"
import { storeToRefs } from "pinia"
import { useRoute } from "vue-router"

const mainStore = useMainStore();
const { glslCode, semver, pkg, loadState, shader, kind, loadError } = storeToRefs(mainStore);

// 
// Sync states with route
//

const route = useRoute();
shader.value = route.params.shader || "";
kind.value = route.params.kind || "vertex";
semver.value = route.params.semver;

//
// Handle package import
//

const isLoading = computed(() => loadState.value === "pending");
const isLoadOk = computed(() => loadState.value === "fulfilled");
const isLoadErr = computed(() => loadState.value === "rejected");

// 
// Compute shaders list and ShaderChunk 
//

const ShaderChunk = computed(() => pkg.value?.ShaderChunk);
const shaders = computed(() => pkg.value ? Object.keys(pkg.value.ShaderLib) : []);

//
// Theming
//

const mqList = matchMedia("(prefers-color-scheme: dark)");
const dark = ref(mqList.matches);
mqList.addEventListener("change", ({ matches }) => dark.value = matches);

//
// Folding
//

const viewer = ref(null);
const onFoldAll = () => viewer.value.foldAll();
const onUnfoldAll = () => viewer.value.unfoldAll();
</script>



<template>
  <main class="host" :class="{ dark }">
    <Widgets class="widgets" @switch-theme="dark =!dark"/>
    <nav>
      <ul>
        <li v-if="!isLoading">
          <input v-model.lazy="semver" placeholder="latest" title="semver" />
        </li>
        <li v-if="isLoadOk">
          <select v-model="shader" title="shader name">
            <option v-for="s in shaders">{{ s }}</option>
          </select>
        </li>
        <li v-if="isLoadOk">
          <select v-model="kind" title="shader kind">
            <option>vertex</option>
            <option>fragment</option>
          </select>
        </li>
        <li v-if="isLoadOk">
          <button @click="onUnfoldAll" title="unfold all #include">unfold All</button>
          <button @click="onFoldAll" title="fold all #include">fold All</button>
        </li>
      </ul>
    </nav>
    <SourceViewer ref="viewer" :="{ glslCode, ShaderChunk }" v-if="ShaderChunk" />
    <pre v-if="isLoading" class="msg">loading</pre>
    <pre v-if="isLoadErr" class="msg">{{ loadError }}</pre>
  </main>
</template>



<style scoped>
@import "../assets/AppMain.css";
</style>