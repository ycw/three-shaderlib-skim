import { defineStore } from "pinia"
import { computed, ref } from "vue"
import usePrismStore from "./prism"

export default defineStore("highlight", () => {
  const htmlCode = ref("");

  const { Prism } = usePrismStore();
  const highlight = (glslCode, ShaderChunk) => {
    htmlCode.value = _hl(Prism, glslCode, ShaderChunk);
  };

  // 
  // Expose ( TODO, https://github.com/vuejs/vue-next/pull/5048 )
  //

  return {
    highlight,
    htmlCode: computed(() => htmlCode.value)
  };
});



function _hl(Prism, glsl, ShaderChunk, indent = '') {
  const html = Prism.highlight(glsl, Prism.languages.glsl, 'glsl');
  const rows = html.split('\n');
  const result = [];
  const dummy = document.createElement('div');
  for (const row of rows) {
    dummy.innerHTML = row;
    const incl = dummy.querySelector('[class*=macro]>[class*=string]');
    if (incl) {
      const ind = `${indent}${row.match(/^\t{0,}/)?.[0] || ''}`;
      const glsl = ShaderChunk[incl.textContent.replace(/[><]/g, '')]
        .split('\n').map(row => `${ind}${row}`).join('\n');
      incl.parentElement.classList.add('incl');
      incl.parentElement.append(document.createElement('br'));
      const el = document.createElement('span');
      el.classList.add('incl-content');
      el.innerHTML = _hl(Prism, glsl, ShaderChunk, ind);
      dummy.append(el);
      result.push(dummy.innerHTML);
    }
    else {
      result.push(row);
    }
  }
  return result.join('\n');
}