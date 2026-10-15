<script setup>
import { computed } from 'vue'

/**
 * Inline SVG icon set — no icon library dependency.
 * All icons live on a 24x24 grid and inherit `currentColor`.
 */
const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  strokeWidth: { type: [Number, String], default: 1.7 },
})

const ICONS = {
  home: '<path d="M3.5 10.6 12 3.4l8.5 7.2V19a1.6 1.6 0 0 1-1.6 1.6h-4V15h-5.8v5.6H5.1A1.6 1.6 0 0 1 3.5 19z"/>',
  activity: '<path d="M4 6.5h16M4 12h16M4 17.5h10"/>',
  shield:
    '<path d="M12 3.2 19 6v6.1c0 3.9-2.8 6.9-7 8.7-4.2-1.8-7-4.8-7-8.7V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  grid: '<rect x="3.6" y="3.6" width="7.2" height="7.2" rx="2.2"/><rect x="13.2" y="3.6" width="7.2" height="7.2" rx="2.2"/><rect x="3.6" y="13.2" width="7.2" height="7.2" rx="2.2"/><rect x="13.2" y="13.2" width="7.2" height="7.2" rx="2.2"/>',
  bell: '<path d="M6.6 9.6a5.4 5.4 0 0 1 10.8 0c0 4.2 1.6 5.4 1.6 5.4H5s1.6-1.2 1.6-5.4z"/><path d="M10.2 18.4a2.1 2.1 0 0 0 3.6 0"/>',
  eye: '<path d="M2.6 12S6.4 5.6 12 5.6 21.4 12 21.4 12 17.6 18.4 12 18.4 2.6 12 2.6 12z"/><circle cx="12" cy="12" r="2.9"/>',
  eyeOff:
    '<path d="M4 4.4 20 20.4"/><path d="M10.2 6.1a9.9 9.9 0 0 1 1.8-.2c5.6 0 9.4 6.1 9.4 6.1a17.4 17.4 0 0 1-3.4 4"/><path d="M6.3 8.3A17 17 0 0 0 2.6 12s3.8 6.2 9.4 6.2c1 0 1.9-.2 2.7-.5"/>',
  arrowRight: '<path d="M4.8 12h14.4"/><path d="m13.2 6 6 6-6 6"/>',
  arrowLeft: '<path d="M19.2 12H4.8"/><path d="m10.8 6-6 6 6 6"/>',
  chevronRight: '<path d="m9.5 6 6 6-6 6"/>',
  plus: '<path d="M12 5.2v13.6M5.2 12h13.6"/>',
  minus: '<path d="M5.2 12h13.6"/>',
  check: '<path d="m5.2 12.6 4.6 4.6L18.8 7"/>',
  close: '<path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8"/>',
  alert: '<path d="M12 4.6 21 19.6H3z"/><path d="M12 10v4.2"/><path d="M12 17h.01"/>',
  alertTriangle: '<path d="M12 4.6 21 19.6H3z"/><path d="M12 10v4.2"/><path d="M12 17h.01"/>',
  alertCircle: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.8v5"/><path d="M12 16h.01"/>',
  checkCircle: '<circle cx="12" cy="12" r="8.4"/><path d="m8.4 12.2 2.5 2.5 4.7-5.1"/>',
  info: '<circle cx="12" cy="12" r="8.4"/><path d="M12 11v5.2"/><path d="M12 7.9h.01"/>',
  wallet:
    '<path d="M4 7.6A2.6 2.6 0 0 1 6.6 5h11.2A2.2 2.2 0 0 1 20 7.2v9.6a2.2 2.2 0 0 1-2.2 2.2H6.6A2.6 2.6 0 0 1 4 16.4z"/><path d="M4 8.2h16"/><path d="M15.4 13.6h1.6"/>',
  receipt:
    '<path d="M6.2 3.6h11.6v16.8l-2.9-1.9-2.9 1.9-2.9-1.9-2.9 1.9z"/><path d="M9.2 8.4h5.6M9.2 12h5.6"/>',
  target: '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1"/>',
  umbrella: '<path d="M12 4.2a8 8 0 0 1 8 7.9H4a8 8 0 0 1 8-7.9z"/><path d="M12 12.1v5.4a2 2 0 0 0 4 0"/>',
  send: '<path d="M21 3.4 3.2 10.6l7 2.6 2.6 7z"/><path d="m10.4 13.4 3.4-3.4"/>',
  card: '<rect x="2.8" y="5.2" width="18.4" height="13.6" rx="2.6"/><path d="M2.8 10h18.4"/><path d="M6.6 14.4h3.2"/>',
  bolt: '<path d="M13.4 3 5.6 13.4h5.2l-1 7.6 8-10.6h-5.3z"/>',
  lock: '<rect x="5.6" y="10.6" width="12.8" height="9" rx="2.2"/><path d="M9 10.6V8.2a3 3 0 0 1 6 0v2.4"/>',
  refresh:
    '<path d="M4.4 12a7.6 7.6 0 0 1 13-5.4l2 1.9"/><path d="M19.6 12a7.6 7.6 0 0 1-13 5.4l-2-1.9"/><path d="M19.8 4.6v4h-4"/><path d="M4.2 19.4v-4h4"/>',
  coffee:
    '<path d="M5 7.6h11v6.2a4.2 4.2 0 0 1-4.2 4.2H9.2A4.2 4.2 0 0 1 5 13.8z"/><path d="M16 9h1.8a2.6 2.6 0 0 1 0 5.2H16"/><path d="M4.4 20.4h13.2"/>',
  cart: '<path d="M4 5h2.2l2.4 9.6h9.2L20 8.2H7.2"/><circle cx="9.6" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/>',
  film: '<rect x="3.4" y="4.4" width="17.2" height="15.2" rx="2.4"/><path d="M3.4 9.2h17.2M3.4 14.8h17.2M9 4.4v15.2M15 4.4v15.2"/>',
  car: '<path d="M4.6 16.4h14.8v-3.6l-1.9-4.4H6.5l-1.9 4.4z"/><path d="M7 16.4v2M17 16.4v2"/><path d="M7.6 12.6h8.8"/>',
  briefcase:
    '<rect x="3.6" y="7.6" width="16.8" height="11.4" rx="2.2"/><path d="M9 7.6V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.6"/><path d="M3.6 12.6h16.8"/>',
  user: '<circle cx="12" cy="8.4" r="3.6"/><path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0"/>',
  settings:
    '<circle cx="12" cy="12" r="2.9"/><path d="M12 3.4v2.2M12 18.4v2.2M4.7 7.6l1.9 1.1M17.4 15.3l1.9 1.1M4.7 16.4l1.9-1.1M17.4 8.7l1.9-1.1"/>',
  flag: '<path d="M6 3.6v16.8"/><path d="M6 4.6h11.4l-1.8 3.6 1.8 3.6H6z"/>',
  sparkle:
    '<path d="M12 4.2l1.6 4.2 4.2 1.6-4.2 1.6L12 15.8l-1.6-4.2L6.2 10l4.2-1.6z"/><path d="M18.4 16.2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  search: '<circle cx="11" cy="11" r="6.4"/><path d="m16 16 4 4"/>',
}

const inner = computed(() => ICONS[props.name] || ICONS.info)
</script>

<template>
  <svg
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="inner"
  />
</template>

<style scoped>
.app-icon {
  display: block;
  flex: none;
}
</style>
