<script setup>
import { computed, ref } from 'vue'
import { formatNumberInput } from '@/utils/format'

/**
 * Rupiah amount input. Formats with thousand separators while typing and uses
 * a numeric keypad on mobile.
 */
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  label: { type: String, default: '' },
  inputId: { type: String, required: true },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  placeholder: { type: String, default: '0' },
  autofocus: { type: Boolean, default: false },
  size: { type: String, default: 'large' }, // large | regular
})

const emit = defineEmits(['update:modelValue', 'submit'])

const inputEl = ref(null)

const displayValue = computed(() => (props.modelValue > 0 ? formatNumberInput(props.modelValue) : ''))
const errorId = computed(() => `${props.inputId}-error`)
const hintId = computed(() => `${props.inputId}-hint`)

function onInput(event) {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 12)
  emit('update:modelValue', digits ? Number(digits) : 0)
}

function onKeydown(event) {
  if (event.key === 'Enter') emit('submit')
}
</script>

<template>
  <div class="amount-field">
    <label class="field-label" :for="inputId">{{ label }}</label>
    <div class="amount-field__wrap">
      <span class="amount-field__prefix" aria-hidden="true">Rp</span>
      <input
        :id="inputId"
        ref="inputEl"
        class="control control--amount amount-field__input"
        :class="{ 'amount-field__input--regular': size === 'regular' }"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        enterkeyhint="done"
        :value="displayValue"
        :placeholder="placeholder"
        :aria-invalid="error ? 'true' : 'false'"
        :aria-describedby="error ? errorId : hint ? hintId : undefined"
        :data-autofocus="autofocus ? '' : undefined"
        @input="onInput"
        @keydown="onKeydown"
      >
    </div>
    <p v-if="error" :id="errorId" class="field-error" role="alert">
      <span aria-hidden="true">•</span>{{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="field-hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.amount-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.amount-field__wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.amount-field__prefix {
  position: absolute;
  left: 14px;
  font-size: 17px;
  font-weight: 650;
  color: var(--ink-3);
  pointer-events: none;
}

.amount-field__input {
  padding-left: 44px;
}

.amount-field__input--regular {
  font-size: 16px;
  font-weight: 600;
}
</style>
