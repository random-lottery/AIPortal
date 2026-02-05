<template>
  <v-app>
    <v-app-bar flat color="primary">
      <v-app-bar-nav-icon />
      <v-toolbar-title class="text-white">AI Agent Portal</v-toolbar-title>
      <v-spacer />
      <v-btn variant="text" to="/" class="text-white">Dashboard</v-btn>
    </v-app-bar>
    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>
