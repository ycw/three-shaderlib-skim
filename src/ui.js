import { dom } from './dom.js'
import { view } from './view.js'
import { router } from './router.js'

export const ui = {

    init_events: (ShaderLib, ShaderChunk) => {

        window.addEventListener('hashchange', () => {
            const shader_name = router.get_shader_name(location.hash);
            const info_name = router.get_info_name(location.hash);
            view.render(ShaderLib, ShaderChunk, shader_name, info_name);
        });

        document.addEventListener('click', (ev) => {
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

            const summary_el = path.find(x => x.nodeName === 'SUMMARY');
            if (summary_el) {
                const details_el = path.find(x => x.nodeName === 'DETAILS');
                toggle_details(el);
                return;
            }

        });

        dom.el('.expand-all').addEventListener('click', (ev) => {
            dom.els('.shader-source code details').forEach(el => toggle_details(el, true));
            ev.preventDefault();
        });

        dom.el('.collapse-all').addEventListener('click', (ev) => {
            dom.els('.shader-source code details').forEach(el => toggle_details(el, false));
            ev.preventDefault();
        });
    }

};

function toggle_details(details_el, is_open) {
    details_el.toggleAttribute('open', is_open);
}