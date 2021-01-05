const DEFAULT_URL = '//unpkg.com/three/build/three.module.js';

//
// Main
//

(function main() {
    initAppState();
    bootApp();
})();



function initAppState() {

    // ---- hljs ----
    // https://github.com/highlightjs/highlight.js/issues/2559

    const brPlugin = {
        "before:highlightBlock": ({ block }) => {
            block.innerHTML = block.innerHTML.replace(/\n/g, '').replace(/<br[ /]*>/g, '\n');
        },
        "after:highlightBlock": ({ result }) => {
            result.value = result.value.replace(/\n/g, "<br>");
        }
    };
    hljs.addPlugin(brPlugin);
}



async function bootApp() {
    const pars = new URLSearchParams(new URL(document.URL).search);
    const url = pars.get('url'); 
    if (url === null) { // re-direct
        location.href = `${location.origin}${location.pathname}?url=${DEFAULT_URL}`; 
        return;
    }
    let THREE;
    try {
        THREE = await import(url);
    } catch (e) {
        return alert(`${e.message}`);
    }
    renderHtml(THREE);
    registerUIEvents(THREE);
}



function renderHtml(THREE) {
    document.querySelector('.shader-list').innerHTML =
        tmplShaderList(THREE.ShaderLib, THREE.REVISION);

    document.querySelector('.shader-sections').innerHTML =
        tmplShaderSections(THREE.ShaderLib, THREE.ShaderChunk);

    Array.from(document.querySelectorAll('code.language-glsl'))
        .forEach(el => hljs.highlightBlock(el));
}



function registerUIEvents(THREE) {
    document.addEventListener('click', (ev) => handleCopy(THREE, ev));
}



//
// Handler - write shaderchunk content to clipboard
//



function handleCopy(THREE, ev) {
    const el = findCopyEl(ev.composedPath());
    if (el) {
        const chunkName = el.closest('details').dataset.shaderchunk;
        const chunkContent = THREE.ShaderChunk[chunkName];
        navigator.clipboard
            .writeText(makeCopyText(chunkContent))
            .then(() => onClipboardWriteFulfill(el));
        ev.preventDefault();
    }
}

function findCopyEl(evPath) {
    return evPath.find(el => el.classList?.contains('copy'));
}

function makeCopyText(text) {
    return text.replace(/\t/gm, ' '.repeat(4));
}

function onClipboardWriteFulfill(el) {
    const oText = el.textContent;
    el.textContent = 'copied';
    setTimeout(() => el.textContent = oText, 1500);
}



//
// Templates
//



function tmplShaderList(ShaderLib, revision) {
    return `<div>
        <h2>ShaderLib r${revision}</h2>
        <ul>
            ${Object.keys(ShaderLib).map(shaderName =>
        `<li><a href='#${shaderName}'>${shaderName}</a></li>`
    ).join('')}
        </ul>
    </div>`;
}



function tmplShaderSections(ShaderLib, ShaderChunk) {
    return `${Object.entries(ShaderLib).map(([name, shader]) =>
        tmplShaderSection(name, shader, ShaderChunk)
    ).join('')}`;
}



function tmplShaderSection(shaderName, shader, ShaderChunk) {
    const uniformNames = Object.keys(shader.uniforms);
    const vertexShaderSource = shaderSourceToHtml(shader.vertexShader, ShaderChunk);
    const fragmentShaderSource = shaderSourceToHtml(shader.fragmentShader, ShaderChunk);

    return `<div class='shader-section' id='${shaderName}'>
        <h3 class='shader-section-head'>${shaderName}</h3>
        
        <details>
            <summary class='shader-section-subhead'>uniforms</summary>
            <ul class='shader-uniforms'>
                ${uniformNames.map(u => `<li><a>${u}</a></li>`).join('')}
            </ul>
        </details>

        <h4 class='shader-section-subhead'>vert</h4>
        <code class='language-glsl'>${vertexShaderSource}</code>
        
        <h4 class='shader-section-subhead'>frag</h4>
        <code class='language-glsl'>${fragmentShaderSource}</code>
    </div>`;
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
<a class='copy' href='#' title='write &lt;${chunk}&gt; content to clipboard'>Copy</a>\
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