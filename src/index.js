(async function main() {
    const url = find_module_url();
    if (url === null) {
        return location.search = '?url=//unpkg.com/three/build/three.module.js';
    }

    const { THREE, import_err } = await import_threejs(url);
    if (import_err) {
        return alert(import_err.message);
    }

    reg_events(THREE, location);
    route(THREE, location);
})();

function find_module_url() {
    return new URLSearchParams(location.search).get('url');
}

async function import_threejs(url) {
    try {
        return { THREE: await import(url) };
    } catch (import_err) {
        return { import_err };
    }
}

function reg_events(THREE, location) {
    document.addEventListener('click', ev => maybe_click_expand_all(ev));
    document.addEventListener('click', ev => maybe_click_collapse_all(ev));
    document.addEventListener('click', ev => maybe_click_copy(THREE, ev));
    document.addEventListener('click', ev => maybe_click_include(ev));
    document.addEventListener('click', ev => maybe_click_end_tag(ev));
    window.addEventListener('hashchange', () => route(THREE, location));
}

function route(THREE, locaiton) {
    const shader_name = location.hash.substr(1);
    THREE.ShaderLib[shader_name]
        ? render(THREE, shader_name)
        : (location.hash = Object.keys(THREE.ShaderLib)[0]);
}

//
// Event handlers
//

function maybe_click_include(ev) {
    const summary = ev.composedPath().find(el => el.nodeName == 'SUMMARY');
    if (summary) {
        const details = summary.closest('details');
        toggle_include(details, !details.hasAttribute('open'));
        ev.preventDefault();
    }
}

function maybe_click_expand_all(ev) {
    ev.target.classList.contains('expand-all')
        && toggle_all_includes(ev.target.dataset.kind, true);
}

function maybe_click_collapse_all(ev) {
    ev.target.classList.contains('collapse-all')
        && toggle_all_includes(ev.target.dataset.kind, false);
}

function toggle_include(details, is_expand) {
    const summary = details.querySelector('summary');
    const i = summary.querySelector('i');
    i.textContent = is_expand ? '-' : '+';
    hljs.highlightBlock(summary);
    summary.classList.remove('hljs');
    details.toggleAttribute('open', is_expand);
}

function toggle_all_includes(kind, is_expand) {
    const el = document.querySelector(`.${kind}`);
    el.querySelectorAll('details').forEach($ => toggle_include($, is_expand));
    el.scrollIntoView();
}

function maybe_click_copy(THREE, ev) {
    const el = ev.composedPath().find(el => el.classList?.contains('copy'));
    if (el) {
        const chunk = el.closest('details').dataset.chunk;
        const text = THREE.ShaderChunk[chunk].replace(/\t/gm, ' '.repeat(4));
        navigator.clipboard.writeText(text).then(() => {
            const old = el.textContent;
            el.textContent = 'copied';
            setTimeout(() => el.textContent = old, 1500);
        });
        ev.preventDefault();
        ev.stopImmediatePropagation();
    }
}

function maybe_click_end_tag(ev) {
    const el = ev.composedPath().find(el => el.classList?.contains('end-tag'));
    if (el) {
        const details = el.closest('details');
        toggle_include(details, false);
    }
}

//
// Render fns
//

function render(THREE, shader_name) {
    document.body.classList.add('render');
    render_shader_list(THREE.ShaderLib, THREE.REVISION, shader_name);
    render_shader(shader_name, THREE.ShaderLib[shader_name], THREE.ShaderChunk);
    document.querySelector('.vertex').scrollIntoView();
}

function render_shader_list(ShaderLib, revision, shaderName) {
    document.querySelector('.shader-list').innerHTML =
        tmpl_shader_list(ShaderLib, revision, shaderName);
}

function render_shader(shaderName, shaderObject, ShaderChunk) {
    document.querySelector('.name').innerHTML = shaderName;

    document.querySelector('.uniforms').innerHTML =
        tmpl_uniforms(shaderObject.uniforms);

    document.querySelector('.vertex').innerHTML =
        tmpl_shader_source(shaderObject.vertexShader, ShaderChunk);

    document.querySelector('.fragment').innerHTML =
        tmpl_shader_source(shaderObject.fragmentShader, ShaderChunk);

    document.querySelectorAll('code.language-glsl')
        .forEach(el => hljs.highlightBlock(el));
}

//
// Templates
//

function tmpl_shader_list(ShaderLib, revision, selected) {
    return `
    <h1>ShaderLib r${revision}</h1>
    <ul>${Object.keys(ShaderLib).map(shader_name =>
        `<li><a href='#${shader_name}'>${shader_name === selected
            ? `<mark>${shader_name}</mark>`
            : shader_name
        }</a></li>`
    ).join('')}</ul>
    `;
}

function tmpl_uniforms(uniforms) {
    const uniformNames = Object.keys(uniforms);
    return `${uniformNames.map(u => `<li><a>${u}</a></li>`).join('')}`;
}

function tmpl_shader_source(shaderSource, ShaderChunk) {
    const html = shader_source_to_html(shaderSource, ShaderChunk);
    return `<pre><code class='language-glsl'>${html}</code></pre>`;
}

//
// Shader source -> html
//

function shader_source_to_html(src, ShaderChunk, indents = '') {
    const lines = src.trim().split('\n');
    const html = [];
    const re = /^(?<indent>\s*)#include\s+<\s*(?<chunk>.+?)\s*>$/;
    for (const line of lines) {
        const match = line.match(re);
        if (match) {
            const { chunk, indent } = match.groups;
            const ii = indents + indent;
            html.push(`<details data-chunk='${chunk}'>`);
            html.push(`<summary>${ii}//<i>+</i> &lt;${chunk}&gt;`);
            html.push(`<a class='copy' title='Write to clipboard'>Copy</a>`);
            html.push(`</summary>`);
            html.push('\n');
            html.push(shader_source_to_html(ShaderChunk[chunk], ShaderChunk, ii));
            html.push('\n');
            html.push(`${ii}<a class='end-tag'>//- &lt;/${chunk}&gt;</a>`);
            html.push('\n');
            html.push('</details>');
        }
        else {
            html.push(indents);
            html.push(line.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
            html.push('\n');
        }
    }
    return html.join('');
}