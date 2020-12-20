const DEFAULT_URL = '//unpkg.com/three@0.123.0/build/three.module.js';

//
// Main
//

(async function main() {
    initAppState();
    bootApp();
})();



function initAppState() {
    fillUrl();

    document.querySelector('.url-form').addEventListener('submit', (e) => {
        e.preventDefault();
        bootApp();
    });

    window.addEventListener('popstate', (e) => {
        fillUrl();
        bootApp();
    });

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



function fillUrl() {
    const pars = new URLSearchParams(new URL(document.URL).search);
    const url = pars.get('url') || DEFAULT_URL;
    document.querySelector('.url-input').value = url;
}



async function bootApp() {
    toggleUrlControls(false);
    const url = document.querySelector('.url-input').value;
    let THREE;
    try {
        THREE = await import(url);
    } catch (e) {
        alert(`${e.message}`);
        toggleUrlControls(true);
        return;
    }
    history.pushState(null, '', `?url=${url}`); // bookmarkable
    renderHtml(THREE);
    toggleUrlControls(true);
}



function toggleUrlControls(isToggle) {
    document.querySelector('.url-input').disabled = !isToggle;
    document.querySelector('.url-submit').disabled = !isToggle;
}



function renderHtml(THREE) {
    document.querySelector('.shader-list').innerHTML =
        tmplShaderList(THREE.ShaderLib, THREE.REVISION);

    document.querySelector('.shader-sections').innerHTML =
        tmplShaderSections(THREE.ShaderLib, THREE.ShaderChunk);

    Array.from(document.querySelectorAll('code.language-glsl'))
        .forEach(el => hljs.highlightBlock(el));
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
    const vertexShaderSource = sanitizeShaderSource(shader.vertexShader, ShaderChunk);
    const fragmentShaderSource = sanitizeShaderSource(shader.fragmentShader, ShaderChunk);

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

function sanitizeShaderSource(shaderSource, ShaderChunk, indent = '') {
    const lines = shaderSource.trim().split('\n');
    const html = [];
    for (const [i, line] of lines.entries()) {
        const match = line.match(/^(?<indent>\s*)#include\s+<\s*(?<chunk>.+?)\s*>$/);
        if (match) {
            const { chunk, indent } = match.groups;
            html.push(`<details><summary>${indent}// &lt;${chunk}&gt;</summary>`);
            html.push('<br/>');
            html.push(sanitizeShaderSource(ShaderChunk[chunk], ShaderChunk, indent));
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