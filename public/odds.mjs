export const BASE = 137_500;
export const FIELD_WIDTH = 550;
export const FIELD_HEIGHT = 250;

export const logMiss = (rate = 1) => Math.log1p(-rate / BASE);
export const chance = (chests, rate = 1) => chests === 0 ? 0 : -Math.expm1(chests * logMiss(rate));
export const threshold = (target, rate = 1) => Math.ceil(Math.log1p(-target) / logMiss(rate));

export function firstDrop(random, rate = 1) {
  return Math.floor(Math.log1p(-random) / logMiss(rate)) + 1;
}

export function zoomWindows(x, y) {
  return [[FIELD_WIDTH, FIELD_HEIGHT], [110, 50], [22, 10], [11, 5]].map(([width, height]) => ({
    x: Math.floor(x / width) * width,
    y: Math.floor(y / height) * height,
    width,
    height,
  }));
}
