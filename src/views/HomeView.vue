<template>
  <BaseContainer>
    <h1>Top crypto currencies</h1>
    <el-card>
      <el-table v-loading="isLoading" :data="coinsData" style="width: 100%">
        <el-table-column label="Coin" v-slot="{ row }">
          <div :class="$style.colName">
            <img :src="row.imageUrl" :alt="row.fullName" />
            {{ row.fullName }}
          </div>
        </el-table-column>
        <el-table-column label="Price" v-slot="{ row }">
          <el-skeleton
            :rows="0"
            style="width: 50px"
            animated
            :loading="row.price == null"
          >
            <template #template>
              <el-skeleton-item variant="text" />
            </template>
            <template #default> {{ formatPrice(row.price) }} </template>
          </el-skeleton>
        </el-table-column>
        <el-table-column>
          <template #default="{ row }">
            <router-link
              :to="{ name: 'Details', params: { coinName: row.name } }"
              custom
              v-slot="{ navigate }"
            >
              <el-button size="small" @click="navigate">Details</el-button>
            </router-link>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </BaseContainer>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import type { Ref } from "vue";
import BaseContainer from "@/components/BaseContainer.vue";
import {
  getTopCoins,
  subscribeToCoinPrice,
  unsubscribeFromCoinPrice,
} from "@/api";
import type { CoinInfo, CoinPriceSubscriber } from "@/api";
import { formatPrice } from "@/utils/formatPrice";

type TableCoinInfo = CoinInfo & {
  price: number | null;
};

const isLoading = ref(true);
const coinsData: Ref<TableCoinInfo[]> = ref([]);
const priceSubscribers: Map<string, CoinPriceSubscriber> = new Map();

onMounted(async () => {
  coinsData.value = (await getTopCoins()).map((coinInfo) => ({
    ...coinInfo,
    price: null,
  }));

  isLoading.value = false;

  coinsData.value.forEach((coinInfo) => {
    const subscriber: CoinPriceSubscriber = (price) => {
      coinInfo.price = price;
    };

    priceSubscribers.set(coinInfo.name, subscriber);
    subscribeToCoinPrice(coinInfo.name, subscriber);
  });
});

onBeforeUnmount(() => {
  coinsData.value.forEach((coinInfo) => {
    const subscriber = priceSubscribers.get(coinInfo.name);
    if (subscriber) {
      unsubscribeFromCoinPrice(coinInfo.name, subscriber);
      priceSubscribers.delete(coinInfo.name);
    }
  });
});
</script>

<style module>
.colName {
  display: flex;
  align-items: center;
}

.colName > img {
  width: 20px;
  margin-right: 10px;
}
</style>
