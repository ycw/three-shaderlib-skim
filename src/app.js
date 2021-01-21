import { dom } from './dom.js';
import { router } from './router.js'
import { ui } from './ui.js'
import { view } from './view.js'

export const app = {

    state: {
        THREE: null,
    },

    init: async () => {
        ui.init_events(app);
        await app.load_module(router.get_module_version(location.hash));
    },

    load_module: async (ver) => {
        const url = `https://unpkg.com/three@${ver}/build/three.module.js`;
        view.render_splash_screen(url);
        dom.el('body').classList.remove('module-loaded');

        let new_THREE;
        try {
            new_THREE = await import(url);
        } catch (e) {
            view.render_module_load_error(e);
            return;
        }

        app.state.THREE = new_THREE;
        dom.el('body').classList.add('module-loaded');
        app.route(location.hash);
    },

    route: (hash) => {
        const shader_name = router.get_shader_name(hash) || app.default_shader_name;
        const info_name = router.get_info_name(hash) || app.default_info_name;
        if (app.validate_query(shader_name, info_name)) {
            const { ShaderLib, ShaderChunk, REVISION } = app.state.THREE;
            view.init_render(ShaderLib, ShaderChunk, REVISION, shader_name, info_name);
            router.redirect(router.get_module_version(hash), shader_name, info_name);
        }
    },

    validate_query: (shader_name, info_name) => {
        const errors = [];

        if (!app.state.THREE) {
            errors.push('Threejs is not loaded');
        }

        if (!Object.prototype.hasOwnProperty.call(app.state.THREE.ShaderLib, shader_name)) {
            errors.push(`Shader("${shader_name}") is not in ShaderLib`);
        }

        if (!(['vertex', 'fragment'].find(x => x === info_name))) {
            errors.push(`Info("${info_name}") is not "vertex" nor "fragment"`);
        }

        if (errors.length) {
            dom.el('body').classList.remove('valid-query');
            alert(`Errors:\n${errors.map(e => `- ${e}`).join('\n')}`);
            return false;
        }

        dom.el('body').classList.add('valid-query');
        return true;
    },

    get default_shader_name() {
        return Object.keys(app.state.THREE.ShaderLib)[0];
    },

    get default_info_name() {
        return 'vertex';
    }
};