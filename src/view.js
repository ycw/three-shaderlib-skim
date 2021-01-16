import { dom } from './dom.js'
import { router } from './router.js'

export const view = {

    init_render: (ShaderLib, ShaderChunk, REVISION, shader_name, info_name) => {
        dom.el('.revision').innerHTML = `r${REVISION}`;
        view.render(ShaderLib, ShaderChunk, shader_name, info_name);
    },

    render: (ShaderLib, ShaderChunk, shader_name, info_name) => {
        const hash = location.hash;

        dom.el('.shader-name').textContent = shader_name;
        dom.el('.shader-name').href = router.replace_shader_name(hash, shader_name);
        dom.el('.shader-list').innerHTML = tmpl_shader_list(ShaderLib, shader_name);

        dom.el('.info-name').textContent = info_name;
        dom.el('.info-name').href = router.replace_info_name(hash, info_name);
        dom.el('.info-list').innerHTML = tmpl_info_list(info_name);

        const src = ShaderLib[shader_name][info_name + 'Shader'];
        const el = dom.el('.shader-source code');
        el.innerHTML = tmpl_shader_source(src, ShaderChunk);
        hljs.highlightBlock(el);
    }

};

function tmpl_shader_list(ShaderLib, shader_name) {
    return `
    ${Object.keys(ShaderLib).map(k => {
        const anchor = (k === shader_name) ? `<mark>${k}</mark>` : k;
        return `<li class='item' data-name='${k}'>
            <a href='${router.replace_shader_name(location.hash, k)}'>${anchor}</a>
        </li>`;
    }).join('')}
    `;
}

function tmpl_info_list(info_name) {
    return `
    ${['vertex', 'fragment'].map(v => {
        const anchor = (v === info_name) ? `<mark>${v}</mark>` : v;
        return `<li class='item' data-name='${v}'>
            <a href='${router.replace_info_name(location.hash, v)}'>${anchor}</a>
        </li>`;
    }).join('')}
    `;
}

function tmpl_shader_source(src, ShaderChunk, indents = '') {
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
            html.push(tmpl_shader_source(ShaderChunk[chunk], ShaderChunk, ii));
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