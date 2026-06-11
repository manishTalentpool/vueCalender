<template>
  <section class="home">
    <div class="home-hero">
      <p class="eyebrow">Vue 2 + Vue Cal</p>
      <h1>Schedule interviews in minutes</h1>
      <p class="lead">
        As an interviewer, block your availability on the calendar. Candidates see only open
        slots and can book a time that works for both of you.
      </p>
    </div>

    <div class="role-cards">
      <router-link to="/interviewer" class="role-card role-card--interviewer">
        <span class="role-badge">Interviewer</span>
        <h2>Set availability</h2>
        <p>
          Turn on <strong>Click to add</strong> and click a time, drag on the grid, or use the
          quick-add form. Resize, move, or delete slots on the calendar.
        </p>
        <span class="role-cta">Open calendar →</span>
      </router-link>

      <router-link to="/candidate" class="role-card role-card--candidate">
        <span class="role-badge">Candidate</span>
        <h2>Book a slot</h2>
        <p>
          Browse available interview times. Click a green slot, enter your name, and confirm
          your booking.
        </p>
        <span class="role-cta">View open slots →</span>
      </router-link>
    </div>

    <p class="home-note">
      Data is stored in your browser (localStorage) so you can try both roles in separate tabs.
    </p>
  </section>
</template>

<script>
export default {
  name: 'HomeView'
}
</script>
