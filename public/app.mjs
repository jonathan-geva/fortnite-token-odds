import './field.mjs';
import './chest.mjs';
import { BASE, chance, logMiss, threshold } from './odds.mjs';
import { number, percent, rateDescription } from './format.mjs';

const count = document.querySelector('#count');
const slider = document.querySelector('#count-range');
const hours = document.querySelector('#hours');
const pace = document.querySelector('#pace');
const chart = document.querySelector('#chart');
const graph = chart.getContext('2d');
const limit = Number(count.max);
const slideMax = Number(slider.max);

let calcRate = 1;
let total = 1000;

function redrawChart() {
  const dpi = Math.min(2.5, devicePixelRatio || 1);
  const width = Math.max(1, chart.clientWidth);
  const height = Math.max(1, chart.clientHeight);
  chart.width = Math.round(width * dpi);
  chart.height = Math.round(height * dpi);
  graph.setTransform(dpi, 0, 0, dpi, 0, 0);
  graph.font = '500 10px system-ui';

  const left = 32;
  const right = width - 7;
  const top = 12;
  const bottom = height - 21;
  const segment = total > 400_000 ? Math.ceil(total / 400_000) * 100_000 : 100_000;
  const end = segment * 4;
  const x = (chests) => left + (right - left) * chests / end;
  const y = (probability) => bottom - (bottom - top) * probability;

  for (const probability of [0, .25, .5, .75, 1]) {
    graph.strokeStyle = '#253547';
    graph.beginPath();
    graph.moveTo(left, y(probability));
    graph.lineTo(right, y(probability));
    graph.stroke();
    graph.fillStyle = '#9eb0c2';
    graph.textAlign = 'right';
    graph.fillText(`${Math.round(probability * 100)}%`, left - 5, y(probability) + 4);
  }
  const tick = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
  for (let step = 0; step <= 4; step++) {
    graph.textAlign = step === 4 ? 'right' : 'center';
    graph.fillText(tick.format(step * segment), x(step * segment), height - 4);
  }

  function trace(rate) {
    graph.beginPath();
    graph.moveTo(left, bottom);
    for (let i = 1; i <= 100; i++) {
      const n = end * i / 100;
      graph.lineTo(x(n), y(chance(n, rate)));
    }
  }

  if (calcRate > 1) {
    trace(1);
    graph.setLineDash([4, 4]);
    graph.strokeStyle = '#8497ab';
    graph.lineWidth = 1.25;
    graph.stroke();
    graph.setLineDash([]);
  }
  trace(calcRate);
  graph.lineTo(right, bottom);
  graph.closePath();
  const gradient = graph.createLinearGradient(0, top, 0, bottom);
  gradient.addColorStop(0, '#e9a84b44');
  gradient.addColorStop(1, '#e9a84b05');
  graph.fillStyle = gradient;
  graph.fill();
  trace(calcRate);
  graph.strokeStyle = '#efb45b';
  graph.lineWidth = 2;
  graph.stroke();

  const marker = x(total);
  const probability = chance(total, calcRate);
  graph.beginPath();
  graph.moveTo(marker, bottom);
  graph.lineTo(marker, Math.max(top, y(probability) - 7));
  graph.strokeStyle = '#ffce827a';
  graph.lineWidth = 1;
  graph.stroke();
  graph.beginPath();
  graph.arc(marker, y(probability), 4, 0, 2 * Math.PI);
  graph.fillStyle = '#ffdf9e';
  graph.fill();
  chart.setAttribute('aria-label', `Chance of at least one token rises with chest count. ${number.format(total)} chests at ${calcRate} times normal odds gives ${percent(probability)}.`);
}

function validNumber(input, rounded = false) {
  const value = Math.min(Number(input.max), Math.max(0, input.valueAsNumber || 0));
  return rounded ? Math.floor(value) : value;
}

function updateCount(chests, updateInput = true, updateSlider = true) {
  total = chests;
  if (updateInput) count.value = chests;
  if (updateSlider) slider.value = Math.round(slideMax * Math.log1p(chests) / Math.log1p(limit));
  slider.setAttribute('aria-valuetext', `${number.format(total)} chests`);
  document.querySelector('#calc-chance').value = percent(chance(total, calcRate));
  document.querySelector('#calc-miss').value = total === 0 ? '100%' : percent(Math.exp(total * logMiss(calcRate)));
  document.querySelector('#calc-rate-note').textContent = rateDescription(calcRate);
  document.querySelector('#chart-legend').hidden = calcRate === 1;
  for (const target of [50, 90, 99]) {
    document.querySelector(`#milestone-${target}`).textContent = number.format(threshold(target / 100, calcRate));
  }
  redrawChart();
}

function estimateChests() {
  const time = validNumber(hours);
  const speed = validNumber(pace, true);
  const chests = Math.round(time * speed);
  document.querySelector('#hours-summary').textContent = `${number.format(time)} hours × ${number.format(speed)} per hour ≈ ${number.format(chests)} chests.`;
  return chests;
}

count.addEventListener('input', () => updateCount(validNumber(count, true), false));
count.addEventListener('change', () => updateCount(validNumber(count, true)));
slider.addEventListener('input', () => {
  const chests = Math.round(Math.expm1(slider.valueAsNumber / slideMax * Math.log1p(limit)));
  updateCount(chests, true, false);
});
for (const option of document.querySelectorAll('input[name="rate"]')) {
  option.addEventListener('change', () => {
    calcRate = Number(option.value);
    updateCount(total);
  });
}
for (const button of document.querySelectorAll('[data-count]')) {
  button.addEventListener('click', () => updateCount(Number(button.dataset.count)));
}
for (const input of [hours, pace]) {
  input.addEventListener('input', estimateChests);
  input.addEventListener('change', () => {
    input.value = validNumber(input, input === pace);
    estimateChests();
  });
}
document.querySelector('#use-pace').addEventListener('click', () => updateCount(estimateChests()));
new ResizeObserver(redrawChart).observe(chart);
updateCount(total);

const toast = document.querySelector('#toast');
const share = document.querySelector('[data-share]');
let toastTimeout;
share.hidden = false;
share.addEventListener('click', async () => {
  const url = location.origin + location.pathname;
  const shareData = { title: document.title, text: `One in ${number.format(BASE)}. Try the Fortnite Pirate Token odds.`, url };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.textContent = 'Link copied.';
    toast.hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toast.hidden = true; }, 2200);
  } catch {
    window.prompt('Copy the site link', url);
  }
});
