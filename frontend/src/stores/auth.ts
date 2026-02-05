import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/api/http';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);
  const userId = ref<string | null>(null);
  const username = ref<string | null>(null);
  const initialized = ref<boolean>(false);

  const isAuthenticated = computed(() => Boolean(token.value));

  const initFromStorage = () => {
    token.value = localStorage.getItem('authToken');
    userId.value = localStorage.getItem('userId');
    username.value = localStorage.getItem('username');
    initialized.value = true;
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth-login', { email, password });
    const data = response.data as { token: string; userId: string; username: string };
    token.value = data.token;
    userId.value = data.userId;
    username.value = data.username;
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('username', data.username);
  };

  const register = async (usernameInput: string, email: string, password: string) => {
    await api.post('/auth-register', { username: usernameInput, email, password });
    await login(email, password);
  };

  const logout = () => {
    token.value = null;
    userId.value = null;
    username.value = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
  };

  return {
    token,
    userId,
    username,
    initialized,
    isAuthenticated,
    initFromStorage,
    login,
    register,
    logout,
  };
});
