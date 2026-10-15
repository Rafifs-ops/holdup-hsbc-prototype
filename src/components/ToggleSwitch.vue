<script setup>
/**
 * Saklar on/off yang dipakai baris pengaturan. Native button + role="switch"
 * supaya bisa dioperasikan lewat keyboard dan dibacakan screen reader.
 */
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <button
    type="button"
    role="switch"
    class="switch"
    :class="{ 'switch--on': modelValue }"
    :aria-checked="modelValue ? 'true' : 'false'"
    :aria-label="label || undefined"
    :disabled="disabled"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="switch__thumb" aria-hidden="true" />
  </button>
</template>

<style scoped>
.switch {
  position: relative;
  width: 50px;
  height: 30px;
  flex: none;
  padding: 0;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-pill);
  background: #dfe1e5;
  transition: background-color var(--dur-fast) var(--ease),
    border-color var(--dur-fast) var(--ease);
}

.switch--on {
  background: var(--brand);
  border-color: var(--brand);
}

.switch:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.switch__thumb {
  position: absolute;
  top: 50%;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transform: translateY(-50%);
  transition: left var(--dur-fast) var(--ease);
}

.switch--on .switch__thumb {
  left: 25px;
}
</style>
