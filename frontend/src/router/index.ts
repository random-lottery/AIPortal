import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '@/views/Dashboard.vue';
import Login from '@/views/Login.vue';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: Login },
  ],
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  if (!auth.initialized) {
    auth.initFromStorage();
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'login' });
    return;
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    next({ name: 'dashboard' });
    return;
  }

  next();
});

export default router;
