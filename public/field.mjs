import { FIELD_WIDTH, FIELD_HEIGHT, zoomWindows } from './odds.mjs';

const field = document.querySelector('#field');
const context = field.getContext('2d');
const zoomIn = document.querySelector('#zoom-in');
const zoomOut = document.querySelector('#zoom-out');
const stepLabel = document.querySelector('#field-step');
const countLabel = document.querySelector('#field-count');
const dimensions = document.querySelector('#field-dimensions');
const note = document.querySelector('#field-note');
const labels = ['Full field', 'One sector', 'One cluster', 'One gold cell'];
const colors = ['#223347', '#263c50', '#2b4257', '#31495d', '#354e64'];

let winner = { x: 410, y: 128 };
let windows = zoomWindows(winner.x, winner.y);
let level = 0;

function draw() {
  const view = windows[level];
  const next = windows[level + 1];
  const cssWidth = Math.max(1, field.clientWidth);
  const cssHeight = Math.max(1, field.clientHeight);
  const dpi = Math.min(2.5, window.devicePixelRatio || 1);
  const scale = Math.max(dpi, view.width / cssWidth, view.height / cssHeight);
  const width = Math.ceil(cssWidth * scale);
  const height = Math.ceil(cssHeight * scale);
  field.width = width;
  field.height = height;
  const cell = Math.min(width / view.width, height / view.height);
  const offsetX = (width - cell * view.width) / 2;
  const offsetY = (height - cell * view.height) / 2;

  context.fillStyle = '#0e1926';
  context.fillRect(0, 0, width, height);
  const gap = cell >= 5 * scale ? Math.min(cell * .12, 2.6 * scale) : 0;
  for (let row = 0; row < view.height; row++) {
    const y = view.y + row;
    for (let col = 0; col < view.width; col++) {
      const x = view.x + col;
      const pattern = (x * 73856093 ^ y * 19349663) >>> 0;
      context.fillStyle = x === winner.x && y === winner.y ? '#ffd289' : colors[pattern % colors.length];
      const left = Math.round(offsetX + col * cell);
      const top = Math.round(offsetY + row * cell);
      const right = Math.round(offsetX + (col + 1) * cell - gap);
      const bottom = Math.round(offsetY + (row + 1) * cell - gap);
      if (right > left && bottom > top) context.fillRect(left, top, right - left, bottom - top);
    }
  }

  if (next) {
    const x = offsetX + (next.x - view.x) * cell;
    const y = offsetY + (next.y - view.y) * cell;
    const boxWidth = next.width * cell;
    const boxHeight = next.height * cell;
    context.fillStyle = '#060b13a3';
    context.fillRect(0, 0, width, y);
    context.fillRect(0, y + boxHeight, width, height - y - boxHeight);
    context.fillRect(0, y, x, boxHeight);
    context.fillRect(x + boxWidth, y, width - x - boxWidth, boxHeight);
    context.lineWidth = 1.5 * scale;
    context.strokeStyle = '#f4bd64';
    context.strokeRect(x + scale, y + scale, boxWidth - 2 * scale, boxHeight - 2 * scale);
  }
}

function update() {
  const area = windows[level];
  const last = level === windows.length - 1;
  stepLabel.textContent = labels[level].toUpperCase();
  countLabel.textContent = (area.width * area.height).toLocaleString('en-US');
  dimensions.textContent = `${area.width} × ${area.height} CELLS`;
  zoomOut.disabled = level === 0;
  zoomIn.disabled = last;
  note.textContent = last
    ? `There it is. Column ${winner.x + 1}, row ${winner.y + 1} in the original grid.`
    : `The outline contains the winner. ${3 - level} more ${level === 2 ? 'zoom' : 'zooms'} to the close-up.`;
  field.setAttribute('aria-label', `${labels[level]}. ${dimensions.textContent}. ${note.textContent}`);
  draw();
}

zoomIn.addEventListener('click', () => {
  level++;
  update();
  if (zoomIn.disabled) zoomOut.focus({ preventScroll: true });
});
zoomOut.addEventListener('click', () => {
  level--;
  update();
  if (zoomOut.disabled) zoomIn.focus({ preventScroll: true });
});
document.querySelector('#shuffle').addEventListener('click', () => {
  winner = {
    x: Math.floor(Math.random() * FIELD_WIDTH),
    y: Math.floor(Math.random() * FIELD_HEIGHT),
  };
  windows = zoomWindows(winner.x, winner.y);
  level = 0;
  update();
  note.textContent = 'Shuffled. The outline shows where to zoom.';
});

new ResizeObserver(draw).observe(field);
update();
