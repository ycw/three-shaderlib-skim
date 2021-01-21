export const router = {

    get_module_version: (hash) => {
        const re = /^#\/(?<ver>[^/]+)/;
        const m = hash.match(re);
        return m ? m.groups.ver : 'latest';
    },

    get_shader_name: (hash) => {
        const [, , shader_name] = hash.split('/');
        return shader_name;
    },

    get_info_name: (hash) => {
        const [, , , info_name] = hash.split('/');
        return info_name;
    },

    set_shader_name: (hash, shader_name) => {
        const ver = router.get_module_version(hash);
        const info_name = router.get_info_name(hash);
        router.redirect(ver, shader_name, info_name);
    },

    set_info_name: (hash, info_name) => {
        const ver = router.get_module_version(hash);
        const shader_name = router.get_shader_name(hash);
        router.redirect(ver, shader_name, info_name);
    },

    replace_shader_name: (hash, shader_name) => {
        const ver = router.get_module_version(hash);
        const info_name = router.get_info_name(hash);
        return `#/${ver}/${shader_name}/${info_name}`;
    },

    replace_info_name: (hash, info_name) => {
        const ver = router.get_module_version(hash);
        const shader_name = router.get_shader_name(hash);
        return `#/${ver}/${shader_name}/${info_name}`;
    },

    redirect: (ver, shader_name, info_name) => {
        location.hash = `/${ver}/${shader_name}/${info_name}`;
    }

};