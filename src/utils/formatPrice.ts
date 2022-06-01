export function formatPrice(price: number) {
  return price > 1 ? price.toFixed(3) : price.toPrecision(3);
}
