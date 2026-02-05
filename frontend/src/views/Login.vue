<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const mode = ref<'login' | 'register'>('login');

const form = reactive({
  email: '',
  password: '',
  username: '',
});

const submit = async () => {
  if (!form.email || !form.password || (mode.value === 'register' && !form.username)) return;
  loading.value = true;
  try {
    if (mode.value === 'login') {
      await authStore.login(form.email, form.password);
    } else {
      await authStore.register(form.username, form.email, form.password);
    }
    router.push('/');
  } catch (error: any) {
    console.error('Auth error', error);
    alert(error?.response?.data?.message || 'Authentication failed');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card width="420" class="pa-6">
      <v-card-title class="text-h5 text-center">
        {{ mode === 'login' ? 'Login to AI Agent Portal' : 'Create your account' }}
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-text-field
            v-if="mode === 'register'"
            v-model="form.username"
            label="Username"
            prepend-inner-icon="mdi-account"
            required
          />
          <v-text-field
            v-model="form.email"
            label="Email"
            type="email"
            prepend-inner-icon="mdi-email"
            required
          />
          <v-text-field
            v-model="form.password"
            label="Password"
            type="password"
            prepend-inner-icon="mdi-lock"
            required
          />
          <v-btn
            block
            color="primary"
            class="mt-4"
            :loading="loading"
            type="submit"
          >
            {{ mode === 'login' ? 'Login' : 'Register & Login' }}
          </v-btn>
        </v-form>
        <div class="text-center mt-4">
          <v-btn variant="text" @click="mode = mode === 'login' ? 'register' : 'login'">
            {{ mode === 'login' ? 'Need an account? Register' : 'Have an account? Login' }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>
