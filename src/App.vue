<template>
  <div id="app-shell">
    <header class="app-header">
      <router-link to="/" class="brand">
        <span class="brand-icon">◷</span>
        Interview Scheduler
      </router-link>
      <nav class="app-nav">
        <router-link to="/interviewer">Interviewer</router-link>
        <router-link to="/candidate">Candidate</router-link>
      </nav>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>
