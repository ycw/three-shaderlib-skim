import { dom } from './dom.js'
import { view } from './view.js'
import { router } from './router.js'
import { app } from './app.js';

export const ui = {

    init_events: (app) => {
        window.addEventListener('hashchange', (ev) => handle_hash_change(ev, app));
        document.addEventListener('click', handle_click_document);
        dom.el('.expand-all').addEventListener('click', handle_click_expand_all);
        dom.el('.collapse-all').addEventListener('click', handle_click_collapse_all);
    }

};

function toggle_details(details_el, is_open) {
    details_el.toggleAttribute('open', is_open);
}

async function handle_hash_change(ev, app) {
    const new_hash = new URL(ev.newURL).hash;
    const old_hash = new URL(ev.oldURL).hash;

    const new_ver = router.get_module_version(new_hash);
    const old_ver = router.get_module_version(old_hash);

    if (!app.state.THREE) {
        await app.load_module(new_ver);
        return;
    }

    if (new_ver !== old_ver) {
        await app.load_module(new_ver);
        return;
    }
    
    const new_shader_name = router.get_shader_name(new_hash);
    const new_info_name = router.get_info_name(new_hash);
    if (!app.validate_query(new_shader_name, new_info_name)) {
        return;
    }

    const { ShaderLib, ShaderChunk } = app.state.THREE;
    const old_shader_name = router.get_shader_name(old_hash);
    const old_info_name = router.get_info_name(old_hash);
    if (old_shader_name !== new_shader_name || old_info_name !== new_info_name) {    
        view.render_shader_dropdown(ShaderLib, new_shader_name);
        view.render_info_dropdown(new_info_name);
    }

    view.render_shader_source(ShaderLib[new_shader_name][new_info_name + 'Shader'], ShaderChunk);
    dom.els('.dropdown details').forEach(e => toggle_details(e, false));
}

function handle_click_document(ev) {
    const path = ev.composedPath();

    if (path.find(x => x.classList?.contains('end-tag'))) {
        toggle_details(path.find(x => x.nodeName === 'DETAILS'), false);
        return;
    }

    const copy_el = path.find(x => x.classList?.contains('copy'));
    if (copy_el) {
        const details = path.find(x => x.nodeName === 'DETAILS');
        const { chunk } = details.dataset;
        navigator.clipboard.writeText(ShaderChunk[chunk])
            .then(() => {
                const old = copy_el.textContent;
                copy_el.textContent = 'Copied!';
                setTimeout(() => copy_el.textContent = old, 1000);
            });
        ev.preventDefault();
        return;
    }
}

function handle_click_expand_all(ev) {
    dom.els('.shader-source code details').forEach(el => toggle_details(el, true));
    ev.preventDefault();
}

function handle_click_collapse_all(ev) {
    dom.els('.shader-source code details').forEach(el => toggle_details(el, false));
    ev.preventDefault();
}