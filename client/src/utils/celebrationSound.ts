/**
 * Plays a sad descending "wah-wah" tone using the Web Audio API.
 * Classic game-show fail sound — no external audio files needed.
 */
export function playSadSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const startTime = ctx.currentTime;

    // Descending "wah wah wah wahhh" notes (Bb4 → A4 → Ab4 → G4)
    const notes = [466.16, 440.0, 415.3, 392.0];
    const noteDuration = 0.3;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Use triangle wave for a softer, mournful tone
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime + i * noteDuration);

      // Slight vibrato on the last note for extra sadness
      if (i === notes.length - 1) {
        osc.frequency.setValueAtTime(freq, startTime + i * noteDuration);
        // Slow vibrato wobble
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(5, startTime); // 5 Hz wobble
        lfoGain.gain.setValueAtTime(8, startTime);  // ±8 Hz depth
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(startTime + i * noteDuration);
        lfo.stop(startTime + i * noteDuration + noteDuration * 1.5);
      }

      // Volume envelope — each note slightly quieter, last note lingers
      const duration = i === notes.length - 1 ? noteDuration * 1.5 : noteDuration;
      gain.gain.setValueAtTime(0, startTime + i * noteDuration);
      gain.gain.linearRampToValueAtTime(0.25 - i * 0.03, startTime + i * noteDuration + 0.04);
      gain.gain.linearRampToValueAtTime(0, startTime + i * noteDuration + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + i * noteDuration);
      osc.stop(startTime + i * noteDuration + duration);
    });

    setTimeout(() => ctx.close(), 2500);
  } catch {
    // Silently ignore if Web Audio API is unavailable
  }
}

/**
 * Plays an hourglass "time's up" sound — quick ticking followed by a deep gong.
 * Evokes urgency + finality. No external audio files required.
 */
export function playTimesUpSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const t = ctx.currentTime;

    // ── Part 1: Quick ticking (5 ticks accelerating) ──
    const tickTimes = [0, 0.14, 0.26, 0.35, 0.42];
    tickTimes.forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, t + offset);
      gain.gain.setValueAtTime(0, t + offset);
      gain.gain.linearRampToValueAtTime(0.18, t + offset + 0.008);
      gain.gain.linearRampToValueAtTime(0, t + offset + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.06);
    });

    // ── Part 2: Deep gong / bong at the end ──
    const gongStart = t + 0.55;
    const gong = ctx.createOscillator();
    const gongGain = ctx.createGain();
    gong.type = "sine";
    gong.frequency.setValueAtTime(220, gongStart); // A3 — deep tone
    gong.frequency.exponentialRampToValueAtTime(180, gongStart + 0.8); // slight pitch drop
    gongGain.gain.setValueAtTime(0, gongStart);
    gongGain.gain.linearRampToValueAtTime(0.3, gongStart + 0.03);
    gongGain.gain.exponentialRampToValueAtTime(0.001, gongStart + 1.2);
    gong.connect(gongGain);
    gongGain.connect(ctx.destination);
    gong.start(gongStart);
    gong.stop(gongStart + 1.2);

    // Subtle overtone for richness
    const overtone = ctx.createOscillator();
    const overtoneGain = ctx.createGain();
    overtone.type = "triangle";
    overtone.frequency.setValueAtTime(440, gongStart);
    overtone.frequency.exponentialRampToValueAtTime(360, gongStart + 0.8);
    overtoneGain.gain.setValueAtTime(0, gongStart);
    overtoneGain.gain.linearRampToValueAtTime(0.1, gongStart + 0.03);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, gongStart + 0.9);
    overtone.connect(overtoneGain);
    overtoneGain.connect(ctx.destination);
    overtone.start(gongStart);
    overtone.stop(gongStart + 0.9);

    setTimeout(() => ctx.close(), 2500);
  } catch {
    // Silently ignore if Web Audio API is unavailable
  }
}

/**
 * Plays a short celebratory chime using the Web Audio API.
 * No external audio files required — fully synthesised.
 */
export function playCelebrationSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Notes for a happy ascending chime (C5 → E5 → G5 → C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const noteDuration = 0.15; // seconds per note
    const startTime = ctx.currentTime;

    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, startTime + i * noteDuration);

      // Fade in and out for each note
      gainNode.gain.setValueAtTime(0, startTime + i * noteDuration);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + i * noteDuration + 0.03);
      gainNode.gain.linearRampToValueAtTime(0, startTime + i * noteDuration + noteDuration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime + i * noteDuration);
      oscillator.stop(startTime + i * noteDuration + noteDuration);
    });

    // Add a sparkle overlay (higher pitch shimmer)
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = "triangle";
    shimmer.frequency.setValueAtTime(2093, startTime + 0.45);
    shimmerGain.gain.setValueAtTime(0, startTime + 0.45);
    shimmerGain.gain.linearRampToValueAtTime(0.15, startTime + 0.48);
    shimmerGain.gain.linearRampToValueAtTime(0, startTime + 0.7);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmer.start(startTime + 0.45);
    shimmer.stop(startTime + 0.7);

    // Close context after sound finishes
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // Silently ignore if Web Audio API is unavailable
  }
}
