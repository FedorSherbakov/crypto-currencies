<template>
  <div :class="$style.container">
    <slot />
  </div>
</template>

<style module>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
}
</style>
