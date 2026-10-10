(() => {
  'use strict';
  const tracks = {
    overview: 'Dạo một vòng non sông', 'bac-bo': 'Nắng sân đình', 'tay-bac': 'Mây qua triền núi',
    'hue-trung-bo': 'Chiều bên dòng Hương', 'tay-nguyen': 'Gió trên đại ngàn', 'nam-bo': 'Êm đềm sông nước',
    'thu-do': 'Thảnh thơi ướm áo', 'trang-chu': 'Chào một ngày mới', 'kham-pha': 'Nhịp sắc áo',
    'huong-dan': 'Chậm một chút', 'gioi-thieu': 'Chuyện một nét Việt'
  };
  const storeKey = 'viet-phuc-music-v1';
  let preferences;
  try { preferences = JSON.parse(localStorage.getItem(storeKey) || '{}'); } catch { preferences = {}; }
  let enabled = preferences?.enabled !== false;
  let volume = typeof preferences?.volume === 'number' && Number.isFinite(preferences.volume) ? Math.max(0, Math.min(1, preferences.volume)) : 0.12;
  let page = 'ban-do', region = null, unlocked = false, blocked = false, failed = false;
  let audio, context, gain, source, changeTimer, version = 0, current = '', target = 'overview';
  let away = document.hidden;

  const player = document.createElement('div');
  player.className = 'music-player'; player.id = 'music-player';
  player.innerHTML = `<div class="music-pill"><button type="button" id="music-toggle" aria-pressed="false"><span aria-hidden="true">♫</span><span id="music-toggle-label">Bật nhạc</span></button><button type="button" id="music-settings" aria-label="Cài đặt nhạc nền" aria-expanded="false" aria-controls="music-panel">⋯</button></div>
    <section id="music-panel" class="music-panel" aria-label="Nhạc nền" hidden>
      <strong>Giai điệu đồng hành</strong><p id="music-track"></p><p id="music-status" role="status"></p>
      <label for="music-volume">Âm lượng <output id="music-volume-value" for="music-volume">12%</output></label>
      <input id="music-volume" type="range" min="0" max="100" step="1" value="12">
      <small>Nhạc không lời sáng tác riêng, gợi không khí vùng miền.</small>
    </section>`;
  document.body.append(player);
  const toggle = player.querySelector('#music-toggle'), label = player.querySelector('#music-toggle-label');
  const settings = player.querySelector('#music-settings'), panel = player.querySelector('#music-panel');
  const slider = player.querySelector('#music-volume');
  function save() { try { localStorage.setItem(storeKey, JSON.stringify({ enabled, volume })); } catch {} }
  function render() {
    const on = enabled && unlocked && !blocked && !failed && volume > 0;
    toggle.setAttribute('aria-pressed', String(on));
    toggle.setAttribute('aria-label', on ? 'Tắt nhạc nền' : 'Bật nhạc nền');
    label.textContent = on ? 'Nhạc: bật' : 'Bật nhạc';
    player.classList.toggle('is-playing', on && !away && Boolean(audio && !audio.paused));
    player.querySelector('#music-track').textContent = tracks[target];
    player.querySelector('#music-status').textContent = failed ? 'Chưa tải được nhạc. Bấm Bật nhạc để thử lại.' : blocked ? 'Bấm Bật nhạc để cho phép phát âm thanh.' : !enabled || volume === 0 ? 'Nhạc đang tắt.' : away ? 'Tạm dừng khi bạn rời tab.' : !unlocked ? 'Nhạc bắt đầu sau khi bạn chạm vào trang.' : 'Nhạc nhẹ theo vùng đất và trang bạn đang xem.';
    slider.value = String(Math.round(volume * 100));
    player.querySelector('#music-volume-value').textContent = slider.value + '%';
  }
  function ramp(value, seconds = 0.35) {
    if (!audio) return;
    if (gain && context) {
      const parameter = gain.gain, now = context.currentTime;
      if (parameter.cancelAndHoldAtTime) parameter.cancelAndHoldAtTime(now);
      else { const previous = parameter.value; parameter.cancelScheduledValues(now); parameter.setValueAtTime(previous, now); }
      parameter.linearRampToValueAtTime(value, now + seconds);
    } else audio.volume = value;
  }
  function ensureAudio() {
    if (audio) return;
    audio = new Audio(); audio.loop = true; audio.preload = 'none'; audio.volume = volume;
    // One player and one audio graph: changing pages cannot stack music tracks.
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (AudioEngine) {
      try {
        context = new AudioEngine(); gain = context.createGain(); gain.gain.value = 0;
        source = context.createMediaElementSource(audio); source.connect(gain); gain.connect(context.destination); audio.volume = 1;
      } catch { context?.close().catch(() => {}); context = null; gain = null; }
    }
    audio.addEventListener('playing', render);
    audio.addEventListener('error', () => { if (enabled && current === target) { failed = true; render(); } });
  }
  async function playSelected(expected) {
    if (expected !== version || !enabled || !unlocked || away || volume === 0) return;
    try {
      if (current !== target) { audio.pause(); ramp(0, 0); audio.src = '/audio/' + target + '.mp3'; current = target; }
      // Both calls start in the trusted gesture when initially unlocking audio.
      const resuming = context && context.state !== 'running' ? context.resume() : Promise.resolve();
      await Promise.all([resuming, audio.play()]);
      if (expected !== version) return;
      if (!enabled || away || volume === 0) { audio.pause(); return; }
      blocked = false; failed = false; ramp(volume, 0.8); render();
    } catch (error) {
      if (expected !== version || error.name === 'AbortError') return;
      blocked = error.name === 'NotAllowedError'; failed = !blocked; audio.pause(); render();
    }
  }
  function sync() {
    target = page === 'ban-do' ? (Object.hasOwn(tracks, region) ? region : 'overview') : (Object.hasOwn(tracks, page) ? page : 'overview');
    render();
    if (!unlocked) return;
    clearTimeout(changeTimer); const expected = ++version;
    if (!enabled || away || volume === 0) { audio?.pause(); ramp(0, 0); return; }
    ensureAudio();
    if (current && current !== target && !audio.paused) {
      ramp(0, 0.25); changeTimer = setTimeout(() => playSelected(expected), 280);
    } else playSelected(expected);
  }
  function unlock() { if (!enabled || away) return; unlocked = true; blocked = false; failed = false; ensureAudio(); sync(); }
  toggle.addEventListener('click', () => {
    if (!unlocked || !enabled || blocked || failed || volume === 0) {
      enabled = true; if (volume === 0) volume = 0.12; unlock();
    } else { enabled = false; sync(); }
    save(); render();
  });
  settings.addEventListener('click', () => {
    panel.hidden = !panel.hidden; settings.setAttribute('aria-expanded', String(!panel.hidden));
  });
  slider.addEventListener('input', () => {
    volume = Number(slider.value) / 100; save();
    if (enabled && !unlocked && volume > 0) unlock();
    else if (audio && !audio.paused && current === target && volume > 0) { ramp(volume, 0.12); render(); }
    else sync();
    render();
  });
  function userGesture(event) {
    if (!event.isTrusted || player.contains(event.target) || unlocked || !enabled) return;
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    unlock();
  }
  document.addEventListener('click', userGesture);
  document.addEventListener('keydown', userGesture);
  document.addEventListener('click', event => { if (!player.contains(event.target)) { panel.hidden = true; settings.setAttribute('aria-expanded', 'false'); } });
  player.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); event.stopPropagation(); panel.hidden = true; settings.setAttribute('aria-expanded', 'false'); settings.focus(); }
  });
  document.addEventListener('visibilitychange', () => {
    away = document.hidden; sync();
    if (away && context?.state === 'running') context.suspend().catch(() => {});
  });
  window.addEventListener('pagehide', () => { away = true; sync(); context?.suspend().catch(() => {}); });
  window.addEventListener('pageshow', () => { away = document.hidden; sync(); });
  window.VietPhucMusic = {
    setPage(next) { if (page !== next) { page = next; sync(); } },
    setRegion(next) { if (region !== next) { region = next; sync(); } },
    setDialog(dialog) { panel.hidden = true; settings.setAttribute('aria-expanded', 'false'); (dialog || document.body).append(player); player.classList.toggle('in-dialog', Boolean(dialog)); },
    getState() { return { page, region, track: target, enabled, volume, unlocked, playing: Boolean(audio && !audio.paused && !away && context?.state !== 'suspended'), contextState: context?.state, blocked, failed }; }
  };
  render();
})();
