import { dom } from './dom.js'
import { view } from './view.js'
import { router } from './router.js'
import { app } from './app.js';

export const ui = {

    init_events: (app) => {
        window.addEventListener('hashchange', (ev) => handle_hash_change(ev, app));
        document.addEventListener('click', (ev) => handle_click_document(ev, app));
        dom.el('.expand-all').addEventListener('click', handle_click_expand_all);
        dom.el('.collapse-all').addEventListener('click', handle_click_collapse_all);
        dom.els('.dropdown').forEach(e => {
            e.addEventListener('pointerleave', handle_pointerleave_dropdown);
            e.addEventListener('pointerenter', handle_pointerenter_dropdown);
        });
    },

    toggle_nav_dropdowns: (is_open) => {
        dom.els('nav .dropdown > details').forEach(el => toggle_details(el, is_open));
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

    app.route(new_hash);
    ui.toggle_nav_dropdowns(false);
}

function handle_click_document(ev, app) {
    const path = ev.composedPath();

    if (path.find(x => x.classList?.contains('end-tag'))) {
        handle_click_end_tag(ev, path);
        return;
    }

    const copy_el = path.find(x => x.classList?.contains('copy'));
    if (copy_el) {
        handle_click_copy(ev, path, copy_el, app);
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

function handle_click_copy(ev, path, copy_el, app) {
    const details = path.find(x => x.nodeName === 'DETAILS');
    const { chunk } = details.dataset;
    navigator.clipboard.writeText(app.state.THREE.ShaderChunk[chunk])
        .then(() => {
            const old = copy_el.textContent;
            copy_el.textContent = 'Copied!';
            setTimeout(() => copy_el.textContent = old, 1000);
        }, console.error);
    ev.preventDefault();
}

function handle_click_end_tag(ev, path) {
    toggle_details(path.find(x => x.nodeName === 'DETAILS'), false);
}

function handle_pointerenter_dropdown(ev) { 
    toggle_details(ev.target.querySelector('details'), true);
}

function handle_pointerleave_dropdown(ev) { 
    toggle_details(ev.target.querySelector('details'), false);
}