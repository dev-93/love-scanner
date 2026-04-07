<template>
  <router-view />
</template>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #111;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

@font-face {
  font-family: 'Inter';
  src: url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
