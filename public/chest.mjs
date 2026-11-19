import { chance, firstDrop } from './odds.mjs';
import { number, percent, rateDescription } from './format.mjs';

const stage = document.querySelector('#chest-stage');
const status = document.querySelector('#sim-status');
const rate = document.querySelector('#sim-rate');
const opening = document.querySelector('#open-one');
const batch = document.querySelector('#open-batch');
const skip = document.querySelector('#open-until');
const reset = document.querySelector('#sim-reset');
const label = document.querySelector('#open-label');
const sound = document.querySelector('#sound');
const reveal = document.querySelector('#reveal');
const revealText = reveal.querySelector('.reveal-text');
const revealArt = reveal.querySelector('.reveal-art');
const preview = document.querySelector('#preview');
const watchClip = document.querySelector('#watch-clip');
const sparks = document.querySelector('#sparks');
const replay = document.querySelector('#replay');
const gameplay = document.querySelector('#gameplay');
const replayLabel = document.querySelector('#replay-label');
const gameplayLabel = document.querySelector('#gameplay-label');
const slot = document.querySelector('#video-slot');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const videoId = 'yLUouHjJyLQ';
const clipStart = 442;
const watchUrl = `https://www.youtube.com/watch?v=${videoId}&t=${clipStart}s`;

let audio;
let soundEnabled = false;
let task;
let busy = false;
let opened;
let winner;
let won;
let returnFocus;
let pendingWin;
let revealMode;

function playTones(notes) {
  if (!soundEnabled || audio?.state !== 'running') return;
  const start = audio.currentTime;
  for (const [pitch, delay, duration, volume, wave = 'sine'] of notes) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const time = start + delay;
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(pitch, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + .045);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(time);
    oscillator.stop(time + duration + .025);
  }
}

const chargeSound = [[110, 0, .31, .07, 'triangle'], [164.8, .28, .38, .04], [220, .63, .4, .045, 'triangle']];
const openSound = [[79, 0, .23, .13, 'triangle'], [392, .025, .38, .045], [587.33, .09, .46, .04]];
const rewardSound = [[110, 0, 1.2, .13, 'triangle'], [440, .12, .9, .065], [554.37, .24, 1.05, .06], [659.25, .38, 1.14, .066], [880, .54, 1.05, .055], [1318.5, .82, 1.3, .031]];

sound.addEventListener('click', async () => {
  if (!soundEnabled) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audio ??= new AudioContext();
      await audio.resume();
    } catch {
      sound.textContent = 'Sound unavailable';
      sound.disabled = true;
      return;
    }
  }
  soundEnabled = !soundEnabled;
  sound.setAttribute('aria-pressed', String(soundEnabled));
  sound.textContent = soundEnabled ? 'Sound on' : 'Sound off';
  if (soundEnabled) playTones([[440, 0, .26, .05]]);
});

function updateTally() {
  const probability = chance(opened, Number(rate.value));
  document.querySelector('#sim-count').value = number.format(opened);
  document.querySelector('#sim-meter').value = probability;
  document.querySelector('#sim-chance').textContent = percent(probability);
  document.querySelector('#sim-rate-note').textContent = rateDescription(Number(rate.value));
  for (const button of [opening, batch, skip]) {
    button.setAttribute('aria-disabled', String(busy || won));
  }
  label.textContent = busy ? 'Opening…' : won ? 'Token found' : 'Open chest';
}

function beginRun(message = 'The chest is ready.') {
  clearTimeout(task);
  pendingWin = undefined;
  busy = false;
  won = false;
  opened = 0;
  winner = firstDrop(Math.random(), Number(rate.value));
  stage.dataset.state = 'ready';
  status.textContent = message;
  updateTally();
}

function openChests(amount, trigger) {
  if (busy || won) return;
  busy = true;
  const wait = reducedMotion.matches ? 380 : amount === 1 ? 1150 : 660;
  stage.style.setProperty('--open-time', `${wait}ms`);
  stage.dataset.state = 'opening';
  status.textContent = amount === 1 ? 'Opening chest…' : 'Rolling chests…';
  if (amount === 1) playTones(chargeSound);
  updateTally();
  task = setTimeout(() => {
    const rolled = Math.min(amount, winner - opened);
    opened += rolled;
    won = opened === winner;
    stage.dataset.state = won ? 'win' : 'open';
    status.textContent = won
      ? `Token found on chest ${number.format(opened)}.`
      : rolled === 1 ? 'No Pirate Shop token.' : `No token in ${number.format(rolled)} chests.`;
    busy = false;
    updateTally();
    playTones(openSound);
    if (won) {
      task = setTimeout(() => {
        if (reveal.open) pendingWin = trigger;
        else showReveal(false, trigger);
      }, reducedMotion.matches ? 0 : 360);
    }
  }, wait);
}

function clearVideo() {
  slot.hidden = true;
  slot.replaceChildren();
}

function playAnimation() {
  clearVideo();
  document.querySelector('#reveal-mode').textContent = revealMode;
  replayLabel.textContent = 'Replay reveal';
  gameplayLabel.textContent = 'Watch the in-game drop';
  const particles = document.createDocumentFragment();
  for (let i = 0; i < 48; i++) {
    const spark = document.createElement('i');
    spark.style.setProperty('--angle', `${i * 7.5 + Math.random() * 5}deg`);
    spark.style.setProperty('--distance', `${60 + Math.random() * 130}px`);
    spark.style.setProperty('--length', `${3 + Math.random() * 7}px`);
    spark.style.setProperty('--delay', `${.22 + Math.random() * .48}s`);
    particles.append(spark);
  }
  sparks.replaceChildren(particles);
  for (const element of [...revealArt.children, revealText]) {
    if (element === sparks) continue;
    element.style.animation = 'none';
    void element.offsetWidth;
    element.style.animation = '';
  }
  playTones(rewardSound);
}

function showReveal(guaranteed, trigger, footage = false) {
  returnFocus = trigger;
  revealMode = guaranteed ? 'GUARANTEED PREVIEW' : 'SIMULATED DROP';
  document.querySelector('#reveal-note').textContent = guaranteed
    ? 'Guaranteed preview. No real in-game item is awarded.'
    : `Chest ${number.format(opened)} in this run. No real in-game item is awarded.`;
  reveal.showModal();
  if (footage) showGameplay();
  else playAnimation();
}

opening.addEventListener('click', () => openChests(1, opening));
batch.addEventListener('click', () => openChests(1000, batch));
skip.addEventListener('click', () => openChests(Infinity, skip));
reset.addEventListener('click', () => beginRun('New run. The chest is ready.'));
rate.addEventListener('change', () => beginRun('Rate changed. A new run has started.'));
function showGameplay() {
  document.querySelector('#reveal-mode').textContent = 'IN-GAME FOOTAGE';
  replayLabel.textContent = 'Replay in-game clip';
  gameplayLabel.textContent = 'Play fan reveal';
  const frame = document.createElement('iframe');
  frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?start=${clipStart}&end=470&autoplay=1&rel=0`;
  frame.title = 'Lachlan’s squad finds Pirate Shop Access in Fortnite';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  const link = document.createElement('a');
  link.href = watchUrl;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'Original gameplay by Lachlan on YouTube ↗';
  slot.replaceChildren(frame, link);
  slot.hidden = false;
}

preview.addEventListener('click', () => showReveal(true, preview));
watchClip.addEventListener('click', () => showReveal(true, watchClip, true));
replay.addEventListener('click', () => {
  if (slot.hidden) playAnimation();
  else showGameplay();
});
gameplay.addEventListener('click', () => {
  if (slot.hidden) showGameplay();
  else playAnimation();
});
document.querySelector('#close-reveal').addEventListener('click', () => reveal.close());
reveal.addEventListener('close', () => {
  clearVideo();
  if (pendingWin) {
    const trigger = pendingWin;
    pendingWin = undefined;
    showReveal(false, trigger);
    return;
  }
  returnFocus?.focus({ preventScroll: true });
});

beginRun();
