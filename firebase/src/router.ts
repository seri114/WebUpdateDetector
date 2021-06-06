import { createWebHistory, createRouter } from "vue-router";

import Home from "@/views/Home.vue";
import Setting from "@/views/Setting.vue";
import NotFound from "@/views/NotFound.vue";
import Loading from "@/views/Loading.vue";
const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/setting",
    name: "Setting",
    component: Setting,
  },
  {
    path: "/:catchAll(.*)",
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;