import { dom } from './dom.js';
import { router } from './router.js'
import { ui } from './ui.js'
import { view } from './view.js'

export const app = {

    init: async () => {
        const hash = location.hash;
        const ver = router.get_module_version(hash);
        const url = `//unpkg.com/three@${ver}/build/three.module.js`;

        view.render_splash_screen(url);

        let THREE;
        try {
            THREE = await import(url);
        } catch (e) {
            view.render_module_load_error(e);
            return;
        }

        const { ShaderLib, ShaderChunk, REVISION } = THREE;
        const shader_name = router.get_shader_name(hash) || Object.keys(ShaderLib)[0];
        const info_name = router.get_info_name(hash) || 'vertex'; 

        router.redirect(ver, shader_name, info_name);
        ui.init_events(ShaderLib, ShaderChunk);
        view.init_render(ShaderLib, ShaderChunk, REVISION, shader_name, info_name);
    }

};