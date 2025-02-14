<script setup lang="ts">
import Books from './components/Books.vue'
import Toast from './components/Toast.vue'
</script>

<template>
  <div class="container">
    <Books />
    <Toast />
  </div>
</template>

<style>
.container {
  width: 100%;
  height: 100vh;
  padding: 20px;
}
</style>
