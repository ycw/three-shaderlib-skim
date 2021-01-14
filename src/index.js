const DEFAULT_URL = '//unpkg.com/three/build/three.module.js';

//
// Main
//

(async function main() {

    //// Determine threejs module url

    const pars = new URLSearchParams(new URL(document.URL).search);
    const url = pars.get('url');
    if (url === null) {
        return location.href = `${location.origin}${location.pathname}?url=${DEFAULT_URL}${location.hash}`;
    }

    //// Load threejs

    let THREE;
    try {
        THREE = await import(url);
    } catch (e) {
        return alert(`${e.message}`);
    }

    //// Reg events 

    document.addEventListener('click', (ev) => handleCopy(THREE, ev));
    window.addEventListener('hashchange', (ev) => handleRoute(THREE, ev));
    document.querySelector('.expand-all-vert').addEventListener('click', () => toggleChunks('vertex', true));
    document.querySelector('.collapse-all-vert').addEventListener('click', () => toggleChunks('vertex', false));
    document.querySelector('.expand-all-frag').addEventListener('click', () => toggleChunks('fragment', true));
    document.querySelector('.collapse-all-frag').addEventListener('click', () => toggleChunks('fragment', false));

    //// Setup hljs ( https://github.com/highlightjs/highlight.js/issues/2559 )

    const brPlugin = {
        "before:highlightBlock": ({ block }) => {
            block.innerHTML = block.innerHTML.replace(/\n/g, '').replace(/<br[ /]*>/g, '\n');
        },
        "after:highlightBlock": ({ result }) => {
            result.value = result.value.replace(/\n/g, "<br>");
        }
    };
    hljs.addPlugin(brPlugin);

    //// Render page 

    const shaderName = location.hash.substr(1);
    const shaderObject = THREE.ShaderLib[shaderName];
    if (!shaderObject) {
        const defaultShaderName = Object.keys(THREE.ShaderLib)[0];
        return location.hash = defaultShaderName;
    }
    render(THREE, shaderName);

})();

//
// Event handlers
//

function handleRoute(THREE, ev) {
    const shaderName = location.hash.substr(1);
    const shaderObject = THREE.ShaderLib[shaderName];
    if (!shaderObject) {
        const defaultShaderName = Object.keys(THREE.ShaderLib)[0];
        return location.hash = defaultShaderName;
    }
    render(THREE, shaderName);
}

function handleCopy(THREE, ev) {
    const el = ev.composedPath().find(el => el.classList?.contains('copy'));
    if (el) {
        const chunkName = el.closest('details').dataset.shaderchunk;
        const chunkContent = THREE.ShaderChunk[chunkName];
        const textToCopy = chunkContent.replace(/\t/gm, ' '.repeat(4));
        navigator.clipboard
            .writeText(textToCopy)
            .then(() => {
                const oText = el.textContent;
                el.textContent = 'copied';
                setTimeout(() => el.textContent = oText, 1500);
            });
        ev.preventDefault();
    }
}

function toggleChunks(kind, isToggle) {
    const el = document.querySelector(`.${kind}`);
    Array.from(el.querySelectorAll('details')).forEach(el => el.toggleAttribute('open', isToggle));
    el.scrollIntoView();
}

//
// Render fns
//

function render(THREE, shaderName) {
    document.body.classList.add('render');
    renderShaderList(THREE.ShaderLib, THREE.REVISION, shaderName);
    renderShader(shaderName, THREE.ShaderLib[shaderName], THREE.ShaderChunk);
    document.querySelector('.vertex').scrollIntoView();
}

function renderShaderList(ShaderLib, revision, shaderName) {
    document.querySelector('.shader-list').innerHTML = tmplShaderList(ShaderLib, revision, shaderName);
}

function renderShader(shaderName, shaderObject, ShaderChunk) {
    document.querySelector('.name').innerHTML = shaderName;
    document.querySelector('.uniforms').innerHTML = tmplUniforms(shaderObject.uniforms);
    document.querySelector('.vertex').innerHTML = tmplShaderSource(shaderObject.vertexShader, ShaderChunk);
    document.querySelector('.fragment').innerHTML = tmplShaderSource(shaderObject.fragmentShader, ShaderChunk);

    //// highlight glsl code

    Array.from(document.querySelectorAll('code.language-glsl'))
        .forEach(el => hljs.highlightBlock(el));
}

//
// Templates
//

function tmplShaderList(ShaderLib, revision, selectedShaderName) {
    return `
    <h1>ShaderLib r${revision}</h1>
    <ul>${Object.keys(ShaderLib).map(shaderName => {
        const classAttr = shaderName === selectedShaderName ? 'class="selected"' : '';
        return `<li ${classAttr}><a href='#${shaderName}'>${shaderName}</a></li>`
    }).join('')}</ul>
    `;
}

function tmplUniforms(uniforms) {
    const uniformNames = Object.keys(uniforms);
    return `<ul class='shader-uniforms'>
        ${uniformNames.map(u => `<li><a>${u}</a></li>`).join('')}
    </ul>`;
}

function tmplShaderSource(shaderSource, ShaderChunk) {
    const html = shaderSourceToHtml(shaderSource, ShaderChunk);
    return `<code class='language-glsl'>${html}</code>`;
}

//
// Shader Source -> HTML
//

function shaderSourceToHtml(shaderSource, ShaderChunk, indent = '') {
    const lines = shaderSource.trim().split('\n');
    const html = [];
    for (const [i, line] of lines.entries()) {
        const match = line.match(/^(?<indent>\s*)#include\s+<\s*(?<chunk>.+?)\s*>$/);
        if (match) {
            const { chunk, indent } = match.groups;
            html.push(`<details data-shaderchunk='${chunk}'>`);
            html.push(`<summary>${indent}// &lt;${chunk}&gt;\
<div class='actions'>\
<a class='copy' href='#' title='Write &lt;${chunk}&gt; content to clipboard'>Copy</a>\
</div></summary>`);
            html.push(`<br/>`);
            html.push(shaderSourceToHtml(ShaderChunk[chunk], ShaderChunk, indent));
            html.push('<br/>');
            html.push('</details>');
        }
        else {
            html.push(indent + line.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
            html.push('<br/>');
        }
    }

    return html.join('');
}