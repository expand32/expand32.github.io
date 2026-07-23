// Expand32 Sounds — landing intro video (scenes + cinematic audio)
const ACC_CYAN = '#4fc3e8', ACC_GOLD = '#d7a94a';
const FONT = "'Space Grotesk', 'Segoe UI', sans-serif";
const TRACK_SRC = 'assets/Demo 1 The strange one - By Expand32 sounds.mp3';
const TRACK_NAME = 'Demo 1 The strange one - By Expand32 sounds';

// ── The 3 motion helpers ──
const M = {
  in: (p, a, b) => clamp((p - a) / (b - a), 0, 1),
  fadeUp: (p, a, b) => {
    const t = Easing.easeOutCubic(clamp((p - a) / (b - a), 0, 1));
    return { opacity: t, transform: `translateY(${(1 - t) * 26}px)` };
  },
  // scene-level opacity: 0 at progress 0 and 1 (frame-match contract)
  wrap: (p) => Math.min(Easing.easeOutQuad(M.in(p, 0.015, 0.075)), 1 - Easing.easeInQuad(M.in(p, 0.93, 0.985))),
};

// ── Persistent stage backdrop; g = index + progress is continuous across scene cuts ──
function Backdrop({ g }) {
  const dx = Math.sin(g * 0.9) * 46, dy = Math.cos(g * 0.7) * 34;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#06080e' }}>
      <div style={{ position: 'absolute', inset: -220, transform: `translate(${dx}px,${dy}px)`,
        background: 'radial-gradient(760px 520px at 30% 28%, rgba(79,195,232,0.10), transparent 70%), radial-gradient(880px 620px at 74% 72%, rgba(215,169,74,0.09), transparent 70%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.055) 1.2px, transparent 1.8px)',
        backgroundSize: '46px 46px', backgroundPosition: `${g * 14}px ${g * 7}px` }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(1300px 760px at 50% 44%, transparent 55%, rgba(0,0,0,0.6))' }} />
    </div>
  );
}

// ── Audio engine (WebAudio cinematic score + speech VO) ──
const VO = [
  'Expand32 Sounds. A new sonic geometry.',
  'Expand32. Seventy mathematical engines, fused per note into a single voice.',
  'Tree F D N Reverb. The graphic is the reverb.',
  'Prime Lineage. A delay grown from a family tree.',
  'Prime Verb. Fractal reflections. Pristine space.',
  'The F X bundle is available now, for the price of one plugin. The synth comes free with it, releasing in August.',
  'Thank you for listening. You can continue below.',
];
const CHORDS = [
  [69.3, 103.8, 164.8], [55, 110, 164.8], [61.7, 92.5, 146.8],
  [92.5, 138.6, 185], [82.4, 123.5, 164.8], [69.3, 103.8, 138.6],
];
const AC = { ctx: null, enabled: false, voice: false, lastScene: -1, vol: 0.9, pingT: 0,
  state: { playing: false, idx: 0, abs: 0 } };

function audioInit() {
  if (AC.ctx) { AC.ctx.resume(); return; }
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain(); master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp); comp.connect(ctx.destination);
  const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 620; filt.Q.value = 0.7;
  const padGain = ctx.createGain(); padGain.gain.value = 0.15;
  filt.connect(padGain); padGain.connect(master);
  AC.padOsc = CHORDS[0].map((f, i) => {
    const o = ctx.createOscillator(); o.type = i ? 'sawtooth' : 'triangle'; o.frequency.value = f;
    const g = ctx.createGain(); g.gain.value = i ? 0.22 : 0.5;
    o.connect(g); g.connect(filt); o.start();
    return o;
  });
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
  const lfoG = ctx.createGain(); lfoG.gain.value = 260;
  lfo.connect(lfoG); lfoG.connect(filt.frequency); lfo.start();
  const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  Object.assign(AC, { ctx, master, noiseBuf: nb });
}
function retune(i) {
  const ch = CHORDS[i % CHORDS.length];
  AC.padOsc.forEach((o, k) => o.frequency.setTargetAtTime(ch[k], AC.ctx.currentTime, 0.6));
}
function whoosh() {
  const c = AC.ctx, t = c.currentTime;
  const src = c.createBufferSource(); src.buffer = AC.noiseBuf;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(200, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 0.9);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
  src.connect(bp); bp.connect(g); g.connect(AC.master);
  src.start(); src.stop(t + 1.4);
}
function ping() {
  const c = AC.ctx, t = c.currentTime;
  const ch = CHORDS[Math.max(0, AC.lastScene) % CHORDS.length];
  const f = ch[Math.floor(Math.random() * ch.length)] * (Math.random() < 0.5 ? 4 : 8);
  const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.045, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
  o.connect(g); g.connect(AC.master);
  o.start(); o.stop(t + 2);
}
function speak(idx) {
  if (!AC.voice || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(VO[idx % VO.length]);
  u.rate = 0.98; u.pitch = 0.9;
  const vs = speechSynthesis.getVoices().filter(v => v.lang && v.lang.startsWith('en'));
  const pref = vs.find(v => /Daniel|UK English Male|US English|David/i.test(v.name)) || vs[0];
  if (pref) u.voice = pref;
  speechSynthesis.speak(u);
}
function audioTick() {
  const s = AC.state;
  const root = document.querySelector('[data-om-exportable-video-with-duration-secs]');
  if (root) root.setAttribute('data-screen-label', 't=' + s.abs.toFixed(1) + 's · scene ' + (s.idx + 1));
  const a = AC.track;
  if (a) {
    a.volume = AC.vol;
    if (s.playing) {
      if (Math.abs(a.currentTime - s.abs) > 0.4) { try { a.currentTime = s.abs; } catch (e) {} }
      if (a.paused) a.play().then(() => AC.onBlock && AC.onBlock(false)).catch(() => AC.onBlock && AC.onBlock(true));
    } else if (!a.paused) { a.pause(); }
  }
  if (!AC.ctx) return;
  const on = AC.enabled && s.playing;
  AC.master.gain.setTargetAtTime(on ? AC.vol : 0, AC.ctx.currentTime, 0.25);
  if (s.idx !== AC.lastScene) {
    const first = AC.lastScene === -1;
    AC.lastScene = s.idx;
    retune(s.idx);
    if (on && !first) whoosh();
    if (s.playing) speak(s.idx);
  }
  if (!s.playing && 'speechSynthesis' in window && speechSynthesis.speaking) speechSynthesis.cancel();
  if (on) { AC.pingT += 1; if (AC.pingT % 10 === 0) ping(); }
}

// Null renderer: mirrors the live scene clock into AC.state for the audio scheduler.
function AudioSync() {
  const tl = useTimeline(); const sc = useScene();
  AC.state = { playing: tl.playing || tl.extPlaying === true, idx: sc.index, abs: tl.time };
  return null;
}

// ── Now-playing widget ──
function EqBars({ t, active, h = 26 }) {
  const ws = [3.1, 4.3, 2.6, 3.7];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: h, marginLeft: 6 }}>
      {ws.map((w, i) => {
        const v = active ? 0.3 + 0.7 * Math.abs(Math.sin(t * w + i * 1.7)) : 0.18;
        return <div key={i} style={{ width: 5, height: Math.max(3, h * v), background: ACC_CYAN, borderRadius: 2 }} />;
      })}
    </div>
  );
}
function NowPlayingCard({ t, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px 12px 12px',
      background: 'rgba(8,11,18,0.8)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14,
      boxShadow: '0 12px 40px rgba(0,0,0,0.45)' }}>
      <img src="assets/logo.png" alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 9, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontFamily: FONT, fontSize: 12, letterSpacing: 2.5, color: ACC_CYAN, fontWeight: 500 }}>NOW PLAYING</div>
        <div style={{ fontFamily: FONT, fontSize: 18, color: '#f3f5f9', fontWeight: 600, whiteSpace: 'nowrap' }}>{TRACK_NAME}</div>
        <div style={{ fontFamily: FONT, fontSize: 12.5, color: '#8a93a8' }}>made with Expand32 tools</div>
      </div>
      <EqBars t={t} active={active} />
    </div>
  );
}
function NowPlaying() {
  const tl = useTimeline();
  return (
    <div style={{ position: 'absolute', right: 40, bottom: 34 }}>
      <NowPlayingCard t={tl.time} active={tl.playing || tl.extPlaying === true} />
    </div>
  );
}

// ── Scenes ──
function Opening() {
  const { progress: p, index } = useScene();
  const o = M.wrap(p);
  const scale = 1.06 + 0.09 * p;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Backdrop g={index + p} />
      <AudioSync />
      <div style={{ position: 'absolute', inset: 0, opacity: o }}>
        <img src="assets/logo.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', transform: `scale(${scale})`, transformOrigin: '50% 40%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,8,14,0.25), transparent 30%, transparent 55%, rgba(6,8,14,0.92))' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
          <div style={{ ...M.fadeUp(p, 0.18, 0.32), fontFamily: FONT, fontSize: 22, letterSpacing: 6, color: ACC_CYAN, fontWeight: 500 }}>EXPAND32 SOUNDS</div>
          <div style={{ ...M.fadeUp(p, 0.28, 0.44), fontFamily: FONT, fontSize: 44, fontWeight: 700, color: '#f3f5f9' }}>Instruments and effects born from living mathematics</div>
          <div style={{ ...M.fadeUp(p, 0.4, 0.56), fontFamily: FONT, fontSize: 24, color: '#9aa2b4' }}>One synthesizer · Three FX plugins</div>
        </div>
      </div>
      <NowPlaying />
    </div>
  );
}

function ProductScene() {
  const ctx = useScene();
  const { scene, progress: p, index } = ctx;
  const o = M.wrap(p);
  const acc = scene.accent || ACC_CYAN;
  const imgLeft = scene.side === 'l';
  const ks = 1 + 0.05 * p;
  const feats = scene.feats || [];
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Backdrop g={index + p} />
      <AudioSync />
      <div style={{ position: 'absolute', inset: 0, opacity: o, display: 'flex',
        flexDirection: imgLeft ? 'row' : 'row-reverse', alignItems: 'center', gap: 90, padding: '90px 110px' }}>
        <div style={{ flex: '0 0 900px', height: 820, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ transform: `scale(${ks}) translateX(${(imgLeft ? 1 : -1) * (1 - p) * 24}px)`,
            borderRadius: 10, overflow: 'hidden', border: `1px solid ${acc}44`,
            boxShadow: `0 30px 90px rgba(0,0,0,0.6), 0 0 120px ${acc}22`, maxWidth: '100%', maxHeight: '100%' }}>
            <img src={scene.img} alt="" style={{ display: 'block', maxWidth: 900, maxHeight: 820, objectFit: 'contain' }} />
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ ...M.fadeUp(p, 0.04, 0.12), fontFamily: FONT, fontSize: 21, letterSpacing: 5, color: acc, fontWeight: 500 }}>{scene.kicker}</div>
          <div style={{ ...M.fadeUp(p, 0.07, 0.16), fontFamily: FONT, fontSize: 78, fontWeight: 700, color: '#f3f5f9', lineHeight: 1.02, textWrap: 'balance' }}>{scene.title}</div>
          <div style={{ ...M.fadeUp(p, 0.1, 0.2), fontFamily: FONT, fontSize: 31, color: '#aeb5c6', lineHeight: 1.35, textWrap: 'pretty' }}>{scene.tag}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 10 }}>
            {feats.map((f, i) => (
              <div key={i} style={{ ...M.fadeUp(p, 0.16 + i * 0.08, 0.24 + i * 0.08), display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 34, height: 3, background: acc, flexShrink: 0 }} />
                <div style={{ fontFamily: FONT, fontSize: 24, color: '#dde1ea' }}>{f}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <NowPlaying />
    </div>
  );
}

function Outro() {
  const { progress: p, index } = useScene();
  const o = M.wrap(p);
  const thumbs = ['assets/tree-fdn.png', 'assets/prime-lineage.png', 'assets/prime-verb.png', 'assets/synth.png'];
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Backdrop g={index + p} />
      <AudioSync />
      <div style={{ position: 'absolute', inset: 0, opacity: o, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 30, textAlign: 'center', padding: '0 160px' }}>
        <div style={{ ...M.fadeUp(p, 0.05, 0.16), fontFamily: FONT, fontSize: 22, letterSpacing: 6, color: ACC_GOLD, fontWeight: 500 }}>LAUNCH OFFER</div>
        <div style={{ ...M.fadeUp(p, 0.1, 0.24), fontFamily: FONT, fontSize: 86, fontWeight: 700, color: '#f3f5f9', lineHeight: 1.05 }}>3 FX plugins. The price of one.</div>
        <div style={{ ...M.fadeUp(p, 0.18, 0.32), fontFamily: FONT, fontSize: 31, color: '#aeb5c6', maxWidth: 1100, textWrap: 'balance' }}>The 3 FX plugins are available now — and the Expand32 Synth comes free with the bundle when it releases in August</div>
        <div style={{ display: 'flex', gap: 26, marginTop: 18 }}>
          {thumbs.map((src, i) => (
            <div key={i} style={{ ...M.fadeUp(p, 0.3 + i * 0.08, 0.42 + i * 0.08), width: 250, height: 170,
              borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.14)', background: '#0a0d15',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            </div>
          ))}
        </div>
        <div style={{ ...M.fadeUp(p, 0.56, 0.7), fontFamily: FONT, fontSize: 27, color: ACC_GOLD, marginTop: 12 }}>expand32.github.io&nbsp;&nbsp;·&nbsp;&nbsp;audio demos below</div>
      </div>
      <NowPlaying />
    </div>
  );
}

// Final hold: the corner player grows to center stage while the track finishes.
function FinalScene() {
  const sc = useScene();
  const { progress: p, index } = sc;
  const tl = useTimeline();
  const active = tl.playing || tl.extPlaying === true;
  const k = Easing.easeInOutCubic(M.in(p, 0.02, 0.14));
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Backdrop g={index + p} />
      <AudioSync />
      <div style={{ position: 'absolute', right: 40, bottom: 34,
        transform: `translate(${-660 * k}px, ${-500 * k}px) scale(${1 + 1.4 * k})`, transformOrigin: 'center' }}>
        <NowPlayingCard t={tl.time} active={active} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 720, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 10, opacity: M.in(p, 0.16, 0.28) }}>
        <div style={{ fontFamily: FONT, fontSize: 34, fontWeight: 600, color: '#f3f5f9' }}>You can continue below</div>
        <div style={{ fontFamily: FONT, fontSize: 40, color: ACC_GOLD,
          transform: `translateY(${Math.abs(Math.sin(sc.localTime * 2.2)) * 12}px)` }}>↓</div>
      </div>
    </div>
  );
}

// ── Root component ──
function Expand32Intro(props) {
  const showControls = props.showControls == null ? true : String(props.showControls) !== 'false';
  AC.vol = props.scoreVolume != null && isFinite(+props.scoreVolume) ? clamp(+props.scoreVolume, 0, 1) : 0.9;
  const [snd, setSnd] = React.useState(false); // (score engine dormant — user track is the soundtrack)
  const [vox, setVox] = React.useState(false);
  const [blocked, setBlocked] = React.useState(false);
  const trackRef = React.useRef(null);
  React.useEffect(() => {
    AC.track = trackRef.current;
    AC.onBlock = (b) => setBlocked((prev) => (prev === b ? prev : b));
    const kick = () => {
      const a = AC.track;
      if (!a) return;
      // Unlock the element with the user gesture: play now, pause right away
      // if the timeline is not running — later play() calls then succeed.
      if (a.paused) a.play().then(() => {
        if (!AC.state.playing) a.pause();
        AC.onBlock && AC.onBlock(false);
      }).catch(() => {});
    };
    window.addEventListener('pointerdown', kick);
    window.addEventListener('keydown', kick);
    return () => { window.removeEventListener('pointerdown', kick); window.removeEventListener('keydown', kick); AC.track = null; AC.onBlock = null; };
  }, []);
  React.useEffect(() => {
    if ('speechSynthesis' in window) speechSynthesis.getVoices();
    const iv = setInterval(audioTick, 160);
    return () => { clearInterval(iv); if ('speechSynthesis' in window) speechSynthesis.cancel(); if (AC.ctx) AC.master.gain.value = 0; };
  }, []);
  const btn = (active, label, onClick) => (
    <button onClick={onClick} style={{
      fontFamily: FONT, fontSize: 12, letterSpacing: 1, padding: '6px 14px', cursor: 'pointer',
      borderRadius: 999, border: `1px solid ${active ? ACC_CYAN : 'rgba(255,255,255,0.18)'}`,
      background: active ? 'rgba(79,195,232,0.16)' : 'rgba(12,15,22,0.85)',
      color: active ? ACC_CYAN : '#9aa2b4' }}>{label}</button>
  );
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <SceneStage width={1920} height={1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#06080e">
        {{ Opening, Synth: ProductScene, TreeFDN: ProductScene, PrimeLineage: ProductScene, PrimeVerb: ProductScene, Outro, NowPlaying: FinalScene }}
      </SceneStage>
      <audio ref={trackRef} src={TRACK_SRC} preload="auto" />
      {blocked && (
        <div data-omelette-chrome="true" style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 30,
          fontFamily: FONT, fontSize: 13, letterSpacing: 0.5, color: '#f3f5f9', background: 'rgba(12,15,22,0.9)',
          border: '1px solid rgba(79,195,232,0.5)', borderRadius: 999, padding: '8px 18px' }}>♪ Click anywhere to enable sound</div>
      )}
      {showControls && (
        <div data-omelette-chrome="true" style={{ position: 'absolute', left: 14, bottom: 56, zIndex: 20, display: 'flex', gap: 8 }}>
          {btn(vox, vox ? '\ud83c\udf99 Voice: on' : '\ud83c\udf99 Voice: off', () => { const n = !vox; setVox(n); AC.voice = n; if (n) { if ('speechSynthesis' in window) speechSynthesis.getVoices(); } else if ('speechSynthesis' in window) speechSynthesis.cancel(); })}
        </div>
      )}
    </div>
  );
}
window.Expand32Intro = Expand32Intro;
