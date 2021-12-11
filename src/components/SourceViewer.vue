<script setup>
import { storeToRefs } from "pinia";
import { watch, ref } from "vue"
import useHighlightStore from "../stores/highlight"

const props = defineProps({
  glslCode: {
    type: String,
    required: true,
  },
  ShaderChunk: {
    type: Object,
    required: true
  }
});

//
// Highlight passed-in glslCode, re-highlight on glslCode | ShaderChunk changed
//

const hlStore = useHighlightStore();
const { htmlCode } = storeToRefs(hlStore);
const hl = () => hlStore.highlight(props.glslCode, props.ShaderChunk);
hl();
watch(props, hl);

//
// Toggle include content 
// 

const onPointerDown = (ev) => {
  const elIncl = ev.composedPath().find(x => x?.classList?.contains("incl"));
  elIncl?.classList.toggle("open");
};

//
// Folding
//

const elCode = ref(null);
const toggleAll = (isOpen) => {
  Array.from(elCode.value.querySelectorAll(".incl"))
    .forEach(el => el.classList.toggle("open", isOpen));
};
const foldAll = () => toggleAll(false);
const unfoldAll = () => toggleAll(true);

//
// Expose component instance members
//

defineExpose({ foldAll, unfoldAll });
</script>



<template>
  <pre class="viewer" @pointerdown="onPointerDown"><code v-html="htmlCode" class="language-glsl" ref="elCode"></code></pre>
</template>


<style scoped>
:deep(.incl) {
  cursor: pointer;
}

:deep(.incl br) {
  display: none;
}

:deep(.incl + .incl-content) {
  display: none;
  min-width: calc(100% - 2 * 0.5em);
  outline: thin dashed currentColor;
  margin-inline-end: calc(0.5em);
}

:deep(.incl.open) {
  text-decoration: line-through;
  filter: saturate(0.5);
}

:deep(.incl.open br) {
  display: unset;
}

:deep(.incl.open + .incl-content) {
  display: inline-block;
}

* {
  transition: inherit;
}
</style>