export const router = {

    get_module_version: (hash) => {
        const re = /^#\/(?<ver>[^/]+)/;
        const m = hash.match(re);
        return m ? m.groups.ver : 'latest';
    },

    get_shader_name: (hash) => {
        const [, , name] = hash.split('/');
        return name || '';
    },

    get_info_name: (hash) => {
        const [, , , info] = hash.split('/');
        return info;
    },

    set_shader_name: (hash, shader_name) => {
        const [, ver, , info_name] = hash.split('/');
        router.redirect(ver, shader_name, info_name);
    },

    set_info_name: (hash, info_name) => {
        const [, ver, shader_name, ] = hash.split('/');
        router.redirect(ver, shader_name, info_name);
    },

    replace_shader_name: (hash, shader_name) => {
        const [, ver, , info_name] = hash.split('/');
        return `#/${ver}/${shader_name}/${info_name}`;
    },

    replace_info_name: (hash, info_name) => {
        const [, ver, shader_name,] = hash.split('/');
        return `#/${ver}/${shader_name}/${info_name}`;
    },

    redirect: (ver, shader_name, info_name) => {
        location.hash = `/${ver}/${shader_name}/${info_name}`;
    }

};
