import { dom } from './dom.js'
import { router } from './router.js'

export const view = {

    init_render: (ShaderLib, ShaderChunk, REVISION, shader_name, info_name) => {
        dom.el('.revision').innerHTML = `r${REVISION}`;
        view.render_shader_dropdown(ShaderLib, shader_name);
        view.render_info_dropdown(info_name);
        view.render_shader_source(ShaderLib[shader_name][info_name + 'Shader'], ShaderChunk);        
    },
    
    render_shader_dropdown: (ShaderLib, shader_name) => {
        dom.el('.shader-name').textContent = shader_name;
        dom.el('.shader-list').innerHTML = tmpl_shader_list(ShaderLib, shader_name);
    },

    render_info_dropdown: (info_name) => {
        dom.el('.info-name').textContent = info_name;
        dom.el('.info-list').innerHTML = tmpl_info_list(info_name);
    },

    render_shader_source: (src, ShaderChunk) => {
        const el = dom.el('.shader-source code');
        const tab_size = getComputedStyle(dom.el('html')).getPropertyValue('--tab-size');
        el.innerHTML = tmpl_shader_source(src, ShaderChunk, tab_size);
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
        return `<li>
            <a href='${router.replace_info_name(location.hash, v)}'>${anchor}</a>
        </li>`;
    }).join('')}
    `;
}

function tmpl_shader_source(src, ShaderChunk, tab_size, tab_count = 0) {
    const lines = src.trim().split('\n');
    const html = [];
    const re = /^(?<tab>\t*)#include\s+<\s*(?<chunk>.+?)\s*>$/;
    for (const line of lines) {
        const match = line.match(re);
        if (match) {
            const { chunk, tab } = match.groups;
            const t = tab_count + tab.length;
            const style = `margin-inline-start: ${t * tab_size}ch`;
            html.push(`<details data-chunk="${chunk}">`);
            html.push(`<summary style="${style}">`);
            html.push(`<i class="slash">//</i>&lt;${chunk}&gt;`);
            html.push('<a class="copy" title="Write to clipboard">Copy</a>');
            html.push('</summary>');
            html.push('\n');
            html.push(tmpl_shader_source(ShaderChunk[chunk], ShaderChunk, tab_size, t));
            html.push('\n');
            html.push(`<a class="end-tag" style="${style}"><i class="slash">//</i>&lt;/${chunk}&gt;</a>`);
            html.push('\n');
            html.push('</details>');
        }
        else {
            html.push('\t'.repeat(tab_count));
            html.push(line.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
            html.push('\n');
        }
    }
    return html.join('');
}