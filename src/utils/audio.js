let ctx = null;
const buffers = {};
/** Coalesce parallel loadBuffer(url) so preload + first play never decode the same file twice. */
const _bufferLoadPromises = {};
let unlocked = false;

let _sfxMuted = false;
let _musicMuted = false;

function getContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

function unlock() {
  if (unlocked) return;
  const c = getContext();
  if (c.state === "suspended") c.resume();
  unlocked = true;
  if (_bgmEl && _bgmEl.paused && !_musicMuted) {
    _bgmEl.play().catch(() => {});
  }
}

window.addEventListener("click", unlock, { once: true });
window.addEventListener("keydown", unlock, { once: true });

async function loadBuffer(url) {
  if (buffers[url]) return buffers[url];
  if (_bufferLoadPromises[url]) return _bufferLoadPromises[url];

  const p = (async () => {
    try {
      const c = getContext();
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      const buf = await c.decodeAudioData(arr);
      buffers[url] = buf;
      return buf;
    } finally {
      delete _bufferLoadPromises[url];
    }
  })();
  _bufferLoadPromises[url] = p;
  return p;
}

export async function preload(urls) {
  await Promise.all(urls.map((u) => loadBuffer(u)));
}

export function play(url, volume = 1) {
  if (_sfxMuted) return;
  const c = getContext();
  if (c.state === "suspended") c.resume();
  const buf = buffers[url];
  if (!buf) {
    const el = new Audio(url);
    el.volume = volume;
    el.play().catch(() => {});
    loadBuffer(url).catch(() => {});
    return;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const gain = c.createGain();
  gain.gain.value = volume;
  src.connect(gain).connect(c.destination);
  src.start(0);
}

/**
 * Play a one-shot; invoke `onEnded` when playback finishes (Web Audio or HTMLAudio fallback).
 * When SFX are muted, delays `onEnded` by the decoded buffer duration (or `fallbackDurationSec`) so chained beats still line up.
 * @param {number} [fallbackDurationSec] used if buffer missing when muted
 */
export function playWithOnEnded(url, volume, onEnded, fallbackDurationSec = 3.5) {
  const done = () => {
    try {
      onEnded?.();
    } catch (_) {
      /* ignore */
    }
  };
  if (_sfxMuted) {
    const buf = buffers[url];
    const ms = buf ? buf.duration * 1000 : fallbackDurationSec * 1000;
    setTimeout(done, ms);
    return;
  }
  const c = getContext();
  if (c.state === "suspended") c.resume();
  const buf = buffers[url];
  if (!buf) {
    const el = new Audio(url);
    el.volume = volume;
    el.onended = done;
    el.play().catch(done);
    loadBuffer(url).catch(() => {});
    return;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  src.onended = done;
  const gain = c.createGain();
  gain.gain.value = volume;
  src.connect(gain).connect(c.destination);
  src.start(0);
}

// --- Engine loop (in-game SFX loop, respects SFX mute) ---
let _loopEl = null;
let _loopUrl = null;
let _loopVol = 0.2;

export function startLoop(url, volume = 0.2) {
  stopLoop();
  _loopUrl = url;
  _loopVol = volume;
  if (_sfxMuted) return;
  _loopEl = new Audio(url);
  _loopEl.loop = true;
  _loopEl.volume = volume;
  _loopEl.play().catch(() => {});
}

export function stopLoop() {
  if (_loopEl) {
    _loopEl.pause();
    _loopEl.currentTime = 0;
    _loopEl = null;
  }
  _loopUrl = null;
}

/** Long one-shot bed (HTMLAudio) so it can be cut cleanly — e.g. DS finale before explosion SFX. */
let _finaleBedEl = null;

export function playFinaleBed(url, volume = 0.5) {
  stopFinaleBed();
  if (_sfxMuted) return;
  _finaleBedEl = new Audio(url);
  _finaleBedEl.volume = volume;
  _finaleBedEl.play().catch(() => {});
}

export function stopFinaleBed() {
  if (_finaleBedEl) {
    _finaleBedEl.pause();
    _finaleBedEl.currentTime = 0;
    _finaleBedEl = null;
  }
}

// --- Background music (always looping, independent of engine loop) ---
let _bgmEl = null;
let _bgmVol = 0.1;

export function startBgm(url, volume = 0.1) {
  if (_bgmEl) {
    _bgmEl.pause();
    _bgmEl = null;
  }
  _bgmVol = volume;
  _bgmEl = new Audio(url);
  _bgmEl.loop = true;
  _bgmEl.volume = _musicMuted ? 0 : volume;
  _bgmEl.play().catch(() => {});
}

export function pauseBgm() {
  if (_bgmEl && !_bgmEl.paused) _bgmEl.pause();
}

export function resumeBgm() {
  if (_bgmEl && _bgmEl.paused && !_musicMuted) _bgmEl.play().catch(() => {});
}

// --- Mute toggles ---
export function isSfxMuted() {
  return _sfxMuted;
}

export function toggleSfxMute() {
  _sfxMuted = !_sfxMuted;
  if (_sfxMuted) {
    stopFinaleBed();
    if (_loopEl) {
      _loopEl.pause();
      _loopEl.currentTime = 0;
      _loopEl = null;
    }
  } else if (_loopUrl) {
    _loopEl = new Audio(_loopUrl);
    _loopEl.loop = true;
    _loopEl.volume = _loopVol;
    _loopEl.play().catch(() => {});
  }
  return _sfxMuted;
}

export function isMusicMuted() {
  return _musicMuted;
}

export function toggleMusicMute() {
  _musicMuted = !_musicMuted;
  if (_bgmEl) {
    _bgmEl.volume = _musicMuted ? 0 : _bgmVol;
  }
  return _musicMuted;
}
