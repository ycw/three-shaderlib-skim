export const dom = {

    el: (sel, ctx = document) => {
        return ctx.querySelector(sel);
    },

    els: (sel, ctx = document) => {
        return ctx.querySelectorAll(sel);
    }

};