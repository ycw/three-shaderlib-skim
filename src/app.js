import { Router } from './router.js'

const codeMap = new Map(); // Map<`shader.kind`, parsedhtmlcode>
let THREE = null;



export const App = {
  template: document.querySelector('#tmpl-body'),
  data() {
    return {
      booted: false,
      bootedVersion: '',
      booting: {
        version: '',
        shader: '',
        kind: ''
      },
      kinds: ['vertex', 'fragment'],
      shaders: [],
      version: '',
      kind: '',
      shader: '',
      code: '',
      themes: ['light', 'dark'],
      theme: 'light',
    }
  },
  async mounted() {
    if (matchMedia('(prefers-color-scheme: dark)').matches) this.theme = 'dark';
    window.onhashchange = async () => await reboot(this);
    await reboot(this);
  },
  methods: {
    onshader() {
      Router.update(this.version, this.shader, this.kind);
    },
    onkind() {
      Router.update(this.version, this.shader, this.kind);
    },
    async onversion() {
      Router.update(this.version, this.shader, this.kind);
    },
    oncode(e) {
      toggleFold(e.target);
    },
    onunfold() {
      foldAll(false);
    },
    onfold() {
      foldAll(true);
    }
  }
};



async function reboot(vm) {

  if (vm.booting.version) return;

  const r = Router.current();

  r.version = r.version || 'latest';
  r.shader = r.shader || '';
  r.kind = r.kind || '';

  // ---- when ( states outsync route )
  if (r.version !== vm.version || r.shader !== vm.shader || r.kind !== vm.kind) {
    vm.version = r.version;
    vm.shader = r.shader;
    vm.kind = r.kind;
    Router.update(r.version, r.shader, r.kind);
  }

  vm.booting.version = r.version;
  vm.booting.shader = r.shader;
  vm.booting.kind = r.kind;
  vm.booted = false;
  vm.bootedVersion = '';

  // ---- handle /version part
  let success;
  if (r.version === vm.bootedVersion) {
    success = true;
  } else {
    codeMap.clear();
    vm.code = '';
    try {
      THREE = await import(`https://cdn.skypack.dev/three@${vm.booting.version}/build/three.module.js?min`);
      success = true;
    } catch (e) {
      console.error(e);
      alert(`Failed to load "npm/three@${r.version}" from skypack CDN`);
      success = false;
    }
  }

  if (success) {
    vm.shaders = Object.keys(THREE.ShaderLib);
    vm.version = vm.bootedVersion = vm.booting.version;
    vm.shader = vm.shaders.find(x => x === vm.booting.shader) ? vm.booting.shader : vm.shaders[0];
    vm.kind = vm.kinds.find(x => x === vm.booting.kind) ? vm.booting.kind : vm.kinds[0];

    // ---- handle '/sahder/kind' part
    if (r.shader !== vm.shader || r.kind !== vm.kind) {
      Router.update(vm.version, vm.shader, vm.kind);
    } else {
      codeMap.clear();
      vm.code = hl(vm.shader, vm.kind);
      vm.$refs['pre-code'].scrollTop = 0;
    }
  }

  // ---- reset
  vm.booting.version = '';
  vm.booting.shader = '';
  vm.booting.kind = '';
  vm.booted = true;
}



function foldAll(isFold = false) {
  const el = document.querySelector('#pre-code code');
  for (const e of el.querySelectorAll('[class*=incl]')) {
    e.classList.toggle('open', !isFold);
  }
}



function toggleFold(el) {
  if (el.classList.contains('incl')) {
    el.classList.toggle('open');
  } else if (el.parentElement?.classList.contains('incl')) {
    el.parentElement.classList.toggle('open');
  }
}


function hl(shader, kind) {
  const key = `${shader}.${kind}`;
  if (codeMap.has(key)) {
    return codeMap.get(key);
  }
  const code = _hl(THREE.ShaderLib[shader][`${kind}Shader`]);
  codeMap.set(key, code);
  return code;
}

function _hl(glsl, indent = '') {
  const html = Prism.highlight(glsl, Prism.languages.glsl, 'glsl');
  const rows = html.split('\n');
  const result = [];
  const dummy = document.createElement('div');
  for (const row of rows) {
    dummy.innerHTML = row;
    const incl = dummy.querySelector('[class*=macro]>[class*=string]');
    if (incl) {
      const ind = `${indent}${row.match(/^\t{0,}/)?.[0] || ''}`;
      const glsl = THREE.ShaderChunk[incl.textContent.replace(/[><]/g, '')]
        .split('\n').map(row => `${ind}${row}`).join('\n');
      incl.parentElement.classList.add('incl');
      incl.parentElement.append(document.createElement('br'));
      const el = document.createElement('span');
      el.classList.add('incl-content');
      el.innerHTML = _hl(glsl, ind);
      dummy.append(el);
      result.push(dummy.innerHTML);
    }
    else {
      result.push(row);
    }
  }
  return result.join('\n');
}
