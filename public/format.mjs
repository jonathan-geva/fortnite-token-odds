import { BASE } from './odds.mjs';

export const number = new Intl.NumberFormat('en-US');

export function percent(probability) {
  if (probability > 0.99999999) return '>99.999999%';
  const value = probability * 100;
  if (value > 0 && value < 0.000001) return '<0.000001%';
  const digits = value < 0.01 || value >= 99.999 ? 6 : 3;
  return `${value.toLocaleString('en-US', { maximumFractionDigits: digits })}%`;
}

export function rateDescription(rate) {
  const denominator = BASE / rate;
  const approx = Number.isInteger(denominator) ? '' : '≈ ';
  return `${approx}1 in ${number.format(Math.round(denominator))} per eligible chest`;
}
