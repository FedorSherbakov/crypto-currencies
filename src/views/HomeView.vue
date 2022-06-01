<template>
  <BaseContainer>
    <h1>Top crypto currencies</h1>
    <el-card>
      <el-table :data="data" style="width: 100%">
        <el-table-column prop="FROMSYMBOL" label="Token" />
        <el-table-column prop="PRICE" label="Price" />
      </el-table>
    </el-card>
  </BaseContainer>
</template>

<script setup lang="ts">
import { ref } from "vue";
import BaseContainer from "@/components/BaseContainer.vue";

const data = ref([
  {
    MARKET: "Coinbase",
    FROMSYMBOL: "BTC",
    TOSYMBOL: "USD",
    PRICE: 32090.67,
    VOLUME24HOUR: 24204.9969752,
  },
]);
</script>

<style scoped></style>
