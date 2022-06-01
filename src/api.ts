import axios from "axios";
import { debounce } from "lodash";
const HTTP_URI = "https://min-api.cryptocompare.com/data";
const BASE_MEDIA_URI = "https://www.cryptocompare.com";
const API_KEY = import.meta.env.VITE_CRYPTOCOMPARE_API_KEY;

type APICoinInfo = {
  FullName: string;
  ImageUrl: string;
  Name: string;
};

export type CoinInfo = {
  fullName: string;
  imageUrl: string;
  name: string;
};

export type CoinInfoExtended = CoinInfo & {
  algorithm: string;
  proofType: string;
};

export type CoinPriceSubscriber = (newPrice: number) => void;

const client = axios.create({
  baseURL: HTTP_URI,
  headers: {
    Authorization: `Apikey ${API_KEY}`,
  },
});

const COIN_PRICES_POOLING_INTERVAL = 1000;
let isCoinPricesPoolingActive = false;
let coinPricesPoolingTimeoutID: ReturnType<typeof setTimeout>;
const coinPriceHandlers: Map<string, CoinPriceSubscriber[]> = new Map();
let coinPricesPoolingController: AbortController;

function getAbsoluteMediaURI(relativeURI: string) {
  return new URL(relativeURI, BASE_MEDIA_URI).href;
}

async function updateCoinPrices() {
  const res = await client.get("price", {
    params: {
      fsym: "USD",
      tsyms: Array.from(coinPriceHandlers.keys()).join(),
    },
    signal: coinPricesPoolingController.signal,
  });

  Object.entries(res.data as { [key: string]: number }).forEach(
    ([coin, reversedPrice]) => {
      const subscribers = coinPriceHandlers.get(coin) || [];
      const price = 1 / reversedPrice;

      subscribers.forEach((fn) => fn(price));
    }
  );
}

function loopCoinPricesUpdater() {
  if (!isCoinPricesPoolingActive) return;

  updateCoinPrices()
    .then(() => {
      if (!isCoinPricesPoolingActive) return;
      coinPricesPoolingTimeoutID = setTimeout(() => {
        loopCoinPricesUpdater();
      }, COIN_PRICES_POOLING_INTERVAL);
    })
    .catch((err) => {
      if (!axios.isCancel(err)) throw err;
    });
}

function startCoinPricesPooling() {
  if (isCoinPricesPoolingActive) return;

  coinPricesPoolingController = new AbortController();
  isCoinPricesPoolingActive = true;
  loopCoinPricesUpdater();
}

const startCoinPricesPoolingDebounced = debounce(startCoinPricesPooling, 10);

function stopCoinPricesPooling() {
  isCoinPricesPoolingActive = false;
  clearTimeout(coinPricesPoolingTimeoutID);
  coinPricesPoolingController.abort();
}

export function subscribeToCoinPrice(coin: string, cb: CoinPriceSubscriber) {
  const subscribers = coinPriceHandlers.get(coin) || [];
  coinPriceHandlers.set(coin, [...subscribers, cb]);

  if (!isCoinPricesPoolingActive) {
    // use debounce to wait for other subscriptions
    startCoinPricesPoolingDebounced();
  }
}

export function unsubscribeFromCoinPrice(
  coin: string,
  cb: CoinPriceSubscriber
) {
  const subscribers = coinPriceHandlers.get(coin) || [];
  const newSubscribers = subscribers.filter((x) => x !== cb);
  if (newSubscribers.length) {
    coinPriceHandlers.set(coin, newSubscribers);
  } else {
    coinPriceHandlers.delete(coin);
  }

  if (Array.from(coinPriceHandlers.keys()).length === 0) {
    stopCoinPricesPooling();
  }
}

export async function getTopCoins(): Promise<CoinInfo[]> {
  const res = await client.get("top/totalvol", {
    params: {
      tsym: "USD",
      limit: 10,
    },
  });

  return res.data.Data.map(({ CoinInfo }: { CoinInfo: APICoinInfo }) => ({
    name: CoinInfo.Name,
    fullName: CoinInfo.FullName,
    imageUrl: getAbsoluteMediaURI(CoinInfo.ImageUrl),
  }));
}

export async function getCoinInfo(coin: string): Promise<CoinInfoExtended> {
  const res = await client.get("coin/generalinfo", {
    params: {
      fsyms: coin,
      tsym: "USD",
    },
  });

  const coinInfo = res.data.Data[0].CoinInfo;

  return {
    name: coin,
    algorithm: coinInfo.Algorithm,
    fullName: coinInfo.FullName,
    imageUrl: getAbsoluteMediaURI(coinInfo.ImageUrl),
    proofType: coinInfo.ProofType,
  };
}
