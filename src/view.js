import { dom } from './dom.js'
import { router } from './router.js'

export const view = {

    init_render: (ShaderLib, ShaderChunk, REVISION, shader_name, info_name) => {
        dom.el('.revision').innerHTML = `r${REVISION}`;
        view.render(ShaderLib, ShaderChunk, shader_name, info_name);
        dom.el('body').classList.add('module-loaded');
    },

    render: (ShaderLib, ShaderChunk, shader_name, info_name) => {
        const hash = location.hash;

        dom.el('.shader-name').textContent = shader_name;
        dom.el('.shader-list').innerHTML = tmpl_shader_list(ShaderLib, shader_name);

        dom.el('.info-name').textContent = info_name;
        dom.el('.info-list').innerHTML = tmpl_info_list(info_name);

        const src = ShaderLib[shader_name][info_name + 'Shader'];
        const el = dom.el('.shader-source code');
        el.innerHTML = tmpl_shader_source(src, ShaderChunk);
        hljs.highlightBlock(el);
    },

    render_splash_screen: (module_url) => {
        dom.el('.splash-screen .module-url').textContent = module_url;
    },

    render_module_load_error: (err) => {
        dom.el('.splash-screen .message').textContent = err.message;
    }
};

function tmpl_shader_list(ShaderLib, shader_name) {
    return `
    ${Object.keys(ShaderLib).map(k => {
        const anchor = (k === shader_name) ? `<mark>${k}</mark>` : k;
        return `<li>
            <a href='${router.replace_shader_name(location.hash, k)}'>${anchor}</a>
        </li>`;
    }).join('')}
    `;
}

function tmpl_info_list(info_name) {
    return `
    ${['vertex', 'fragment'].map(v => {
        const anchor = (v === info_name) ? `<mark>${v}</mark>` : v;
        return `<li class='item'>
            <a href='${router.replace_info_name(location.hash, v)}'>${anchor}</a>
        </li>`;
    }).join('')}
    `;
}

function tmpl_shader_source(src, ShaderChunk, indents = '') {
    const tab_size = getComputedStyle(dom.el('html')).getPropertyValue('--tab-size');
    const lines = src.trim().split('\n');
    const html = [];
    const re = /^(?<indent>\s*)#include\s+<\s*(?<chunk>.+?)\s*>$/;
    for (const line of lines) {
        const match = line.match(re);
        if (match) {
            const { chunk, indent } = match.groups;
            const ii = indents + indent;
            const style = `margin-inline-start: ${ii.length * tab_size}ch`;
            html.push(`<details data-chunk="${chunk}">`);
            html.push(`<summary style="${style}">`);
            html.push(`<i class="slash">//</i>&lt;${chunk}&gt;`);
            html.push('<a class="copy" title="Write to clipboard">Copy</a>');
            html.push('</summary>');
            html.push('\n');
            html.push(tmpl_shader_source(ShaderChunk[chunk], ShaderChunk, ii));
            html.push('\n');
            html.push(`<a class="end-tag" style="${style}"><i class="slash">//</i>&lt;/${chunk}&gt;</a>`);
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