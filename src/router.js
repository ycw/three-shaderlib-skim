export const Router = {

  current() {
    const [, version, shader, kind] = window.location.hash.split('/');
    return { version, shader, kind };
  },

  update(version, shader, kind) {
    window.location.hash = `/${version}/${shader}/${kind}`;
  }

};