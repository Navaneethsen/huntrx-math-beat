// Zero-latency Web Audio API Sound Effects + Continuous Calm Ambient Music Loops

export type MusicTrackId = 'menu' | 'dojo' | 'stage' | 'rush' | 'fever' | 'victory';

interface TrackMeta {
  src: string;
  volume: number;
  labelEn: string;
  labelNl: string;
}

export const MUSIC_TRACKS: Record<MusicTrackId, TrackMeta> = {
  menu: {
    src: '/audio/bgm-menu.mp3?v=soft3',
    volume: 0.22,
    labelEn: 'Soda Pop (Mellow)',
    labelNl: 'Soda Pop (Zacht)',
  },
  dojo: {
    src: '/audio/bgm-dojo.mp3?v=soft3',
    volume: 0.18,
    labelEn: 'Soda Pop (Lo-Fi)',
    labelNl: 'Soda Pop (Lo-Fi)',
  },
  stage: {
    src: '/audio/bgm-stage.mp3?v=soft3',
    volume: 0.22,
    labelEn: 'Soda Pop (Stage)',
    labelNl: 'Soda Pop (Stage)',
  },
  rush: {
    src: '/audio/bgm-rush.mp3?v=soft3',
    volume: 0.24,
    labelEn: 'Soda Pop (Beat)',
    labelNl: 'Soda Pop (Beat)',
  },
  fever: {
    src: '/audio/bgm-fever.mp3?v=soft3',
    volume: 0.26,
    labelEn: '✨ Golden Fever',
    labelNl: '✨ Gouden Fever',
  },
  victory: {
    src: '/audio/bgm-victory.mp3?v=soft3',
    volume: 0.30,
    labelEn: '🏆 Golden Encore',
    labelNl: '🏆 Gouden Encore',
  },
};

class KPopSoundEngine {
  private ctx: AudioContext | null = null;
  public sfxEnabled = true;
  public beatEnabled = false;
  private currentTrack: MusicTrackId = 'menu';
  private isDucked = false;
  private audioElements: Partial<Record<MusicTrackId, HTMLAudioElement>> = {};
  private unlockHandler: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const win = window as unknown as { __kpopSoundEngine?: KPopSoundEngine };
      if (win.__kpopSoundEngine) {
        win.__kpopSoundEngine.dispose();
      }
      win.__kpopSoundEngine = this;
      this.bindGestureUnlock();
    }
  }

  private bindGestureUnlock() {
    if (typeof window === 'undefined' || this.unlockHandler) return;

    this.unlockHandler = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (this.beatEnabled && this.sfxEnabled) {
        const currentAudio = this.audioElements[this.currentTrack];
        if (!currentAudio || currentAudio.paused) {
          this.startBeatLoop();
        }
      }
    };

    window.addEventListener('pointerdown', this.unlockHandler, { passive: true });
    window.addEventListener('touchstart', this.unlockHandler, { passive: true });
    window.addEventListener('click', this.unlockHandler, { passive: true });
    window.addEventListener('keydown', this.unlockHandler, { passive: true });
  }

  private getOrCreateAudio(track: MusicTrackId): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    let audio = this.audioElements[track];
    if (!audio) {
      const meta = MUSIC_TRACKS[track];
      audio = new Audio(meta.src);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = this.computeVolume(track);
      this.audioElements[track] = audio;
    }
    return audio;
  }

  private computeVolume(track: MusicTrackId): number {
    const base = MUSIC_TRACKS[track].volume;
    const duckFactor = this.isDucked ? 0.35 : 1;
    return Math.max(0, Math.min(1, base * duckFactor));
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getCurrentTrack(): MusicTrackId {
    return this.currentTrack;
  }

  public setMusicTrack(track: MusicTrackId) {
    const prevTrack = this.currentTrack;
    this.currentTrack = track;

    if (!this.beatEnabled || !this.sfxEnabled) {
      this.stopBeatLoop();
      return;
    }

    const currentAudio = this.audioElements[track];
    if (prevTrack === track && currentAudio && !currentAudio.paused) {
      currentAudio.volume = this.computeVolume(track);
      return;
    }

    this.startBeatLoop();
  }

  public setDucked(ducked: boolean) {
    this.isDucked = ducked;
    const activeAudio = this.audioElements[this.currentTrack];
    if (activeAudio) {
      activeAudio.volume = this.computeVolume(this.currentTrack);
    }
  }

  public toggleBeat(enable?: boolean): boolean {
    this.beatEnabled = enable !== undefined ? enable : !this.beatEnabled;
    if (this.beatEnabled && this.sfxEnabled) {
      this.startBeatLoop();
    } else {
      this.stopBeatLoop();
    }
    return this.beatEnabled;
  }

  private startBeatLoop() {
    if (!this.beatEnabled || !this.sfxEnabled) return;

    // Pause all other tracks so two tracks never overlap
    (Object.keys(this.audioElements) as MusicTrackId[]).forEach((t) => {
      if (t !== this.currentTrack) {
        const other = this.audioElements[t];
        if (other && !other.paused) {
          other.pause();
          other.currentTime = 0;
        }
      }
    });

    const audio = this.getOrCreateAudio(this.currentTrack);
    if (!audio) return;

    audio.loop = true;
    audio.volume = this.computeVolume(this.currentTrack);
    if (audio.paused) {
      audio.play().catch(() => {
        // Browser autoplay policy blocked before first user interaction;
        // bindGestureUnlock() will start playback on the next tap/click.
      });
    }
  }

  public stopBeatLoop() {
    (Object.keys(this.audioElements) as MusicTrackId[]).forEach((t) => {
      const audio = this.audioElements[t];
      if (audio && !audio.paused) {
        audio.pause();
      }
    });
  }

  public dispose() {
    this.stopBeatLoop();
    if (typeof window !== 'undefined' && this.unlockHandler) {
      window.removeEventListener('pointerdown', this.unlockHandler);
      window.removeEventListener('touchstart', this.unlockHandler);
      window.removeEventListener('click', this.unlockHandler);
      window.removeEventListener('keydown', this.unlockHandler);
      this.unlockHandler = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }

  public playTap() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.045);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.055);
  }

  public playCorrect(streak = 1) {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Bright K-Pop idol chime that climbs in pitch with streak!
    const baseNotes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const pitchShift = Math.min(streak - 1, 6) * 0.05;
    const mult = 1 + pitchShift;

    baseNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 3 ? 'triangle' : 'sine';
      const startTime = ctx.currentTime + idx * 0.055;
      osc.frequency.setValueAtTime(freq * mult, startTime);

      gain.gain.setValueAtTime(0.14, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.29);
    });
  }

  public playGentleMiss() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Soft, gentle bubble-boop so a wrong tap is never harsh or scary
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.19);
  }

  public playHint() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [587.33, 880, 1174.66]; // D5, A5, D6 magical sparkle
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const startTime = ctx.currentTime + idx * 0.06;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.24);
    });
  }

  public playVictoryFanfare() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // "Golden" Honmoon chord arpeggio!
    const chord = [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const start = ctx.currentTime + idx * 0.07;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.56);
    });
  }
}

export const soundEngine = new KPopSoundEngine();
