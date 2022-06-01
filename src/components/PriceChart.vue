<template>
  <Line :chart-options="options" :chart-data="chartData" :height="200" />
</template>

<script setup lang="ts">
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { computed } from "vue";
import format from "date-fns/format";

interface PriceEntry {
  x: number;
  y: number;
}

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale
);

const props = defineProps<{
  data: PriceEntry[];
}>();

const options = {
  plugins: {
    legend: {
      display: false,
    },
  },
};

const chartData = computed(() => ({
  datasets: [
    {
      data: props.data.map((entry) => ({
        x: format(new Date(entry.x), "yyyy-MM-dd"),
        y: entry.y,
      })),
    },
  ],
}));
</script>

<style scoped></style>
