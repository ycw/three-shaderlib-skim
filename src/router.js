import { createRouter, createWebHashHistory } from "vue-router"
import AppMain from "./components/AppMain.vue"

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", redirect: "/latest", replace: true },
    { path: "/:semver", component: AppMain },
    { path: "/:semver/:shader/:kind", component: AppMain, name: "view" },
    { path: "/:p(.*)", redirect: "/latest", replace: true }
  ]
});

router.beforeEach((route) => {
  if (route.name === "view") {
    const { semver, shader, kind } = route.params;
    document.title = `[${semver}] ${shader}.${kind}`;
  } else {
    document.title = "three-shaderlib-skim";
  }
});

export default router;