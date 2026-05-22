import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/e/:eventId',
      name: 'EventScreen',
      component: () => import('../views/EventScreen.vue'),
    },
  ],
});

export default router;