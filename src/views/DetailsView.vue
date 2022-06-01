<template>
  <BaseContainer>
    <div :class="$style.header">
      <router-link :to="{ name: 'Home' }" custom v-slot="{ navigate }">
        <el-button
          :icon="ArrowLeft"
          circle
          @click="navigate"
          :class="$style.backButton"
        />
      </router-link>
      <h1>{{ coinName }} details</h1>
    </div>
    <el-card>
      <el-descriptions v-if="coinInfo != null" :column="1" border>
        <el-descriptions-item>
          <template #label> Logo </template>
          <img :src="coinInfo.imageUrl" :alt="coinInfo.fullName" width="40" />
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label> Full name </template>
          {{ coinInfo.fullName }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label> Price </template>
          <el-skeleton
            :rows="0"
            style="width: 50px"
            animated
            :loading="coinInfo.price == null"
          >
            <template #template>
              <el-skeleton-item variant="text" />
            </template>
            <template #default> {{ formatPrice(coinInfo.price) }} </template>
          </el-skeleton>
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label> Algorithm </template>
          {{ coinInfo.algorithm }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label> Proof Type </template>
          {{ coinInfo.proofType }}
        </el-descriptions-item>
      </el-descriptions>
      <PriceChart :data="coinPriceHistory" :class="$style.chart" />
    </el-card>
  </BaseContainer>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { Ref } from "vue";
import { ElLoading } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import BaseContainer from "@/components/BaseContainer.vue";
import PriceChart from "@/components/PriceChart.vue";
import {
  getCoinInfo,
  subscribeToCoinPrice,
  unsubscribeFromCoinPrice,
  getCoinPriceHistory,
} from "@/api";
import type { CoinInfoExtended } from "@/api";
import { formatPrice } from "@/utils/formatPrice";

type TableCoinInfoExtended = CoinInfoExtended & {
  price: number | null;
};

const { params } = useRoute();
const coinName = params.coinName as string;
const coinInfo: Ref<TableCoinInfoExtended | null> = ref(null);
const coinPriceHistory = ref([]);

let loadingInstance: ReturnType<typeof ElLoading.service>;

function updatePrice(price: number) {
  if (coinInfo.value == null) return;
  coinInfo.value.price = price;
}

async function loadCoinPriceHistory() {
  coinPriceHistory.value = await getCoinPriceHistory(coinName);
}

onMounted(async () => {
  const res = await getCoinInfo(coinName);
  coinInfo.value = {
    ...res,
    price: null,
  };
  loadingInstance.close();
  subscribeToCoinPrice(coinName, updatePrice);
  loadCoinPriceHistory();
});

onBeforeUnmount(() => {
  unsubscribeFromCoinPrice(coinName, updatePrice);
});

loadingInstance = ElLoading.service();
</script>

<style module>
.header {
  display: flex;
  align-items: center;
}

.backButton {
  margin-right: 10px;
}

.chart {
  margin-top: 20px;
}
</style>
