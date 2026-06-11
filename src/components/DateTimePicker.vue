<template>
  <div class="datetime-picker-card">
    <div class="datetime-picker-card__section datetime-picker-card__section--date">
      <span class="datetime-picker-card__label">Date</span>
      <CalendarPicker :value="date" @input="$emit('update:date', $event)" />
    </div>

    <div class="datetime-picker-card__divider" aria-hidden="true" />

    <div class="datetime-picker-card__section datetime-picker-card__section--time">
      <span class="datetime-picker-card__label">Time</span>
      <TimeWheelPicker :value="time" @input="$emit('update:time', $event)" />
    </div>
  </div>
</template>

<script>
import CalendarPicker from './CalendarPicker.vue'
import TimeWheelPicker from './TimeWheelPicker.vue'

export default {
  name: 'DateTimePicker',
  components: { CalendarPicker, TimeWheelPicker },
  props: {
    date: { type: String, required: true },
    time: { type: String, required: true }
  }
}
</script>

<style scoped>
.datetime-picker-card {
  display: flex;
  align-items: stretch;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1rem 1.1rem;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);
}

.datetime-picker-card__section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.datetime-picker-card__label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.datetime-picker-card__divider {
  width: 1px;
  background: #e2e8f0;
  margin: 0 1.25rem;
  align-self: stretch;
}

@media (max-width: 640px) {
  .datetime-picker-card {
    flex-direction: column;
    align-items: center;
  }

  .datetime-picker-card__divider {
    width: 100%;
    height: 1px;
    margin: 1rem 0;
  }
}
</style>
