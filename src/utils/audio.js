let audioCtx = null;

export const unlockAudio = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    // Play silent buffer to unlock audio engine on iOS/Android
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
  } catch (error) {
    console.warn("Audio Context unlock failed:", error);
  }
};

export const playNotificationSound = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Siren-like loud notification sound
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    oscillator.frequency.exponentialRampToValueAtTime(
      880,
      audioCtx.currentTime + 0.5,
    ); // A5

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime); // Louder volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 1);

    // Vibrate device if supported (Android)
    if ("vibrate" in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }
  } catch (error) {
    console.warn("Audio Context failed to play:", error);
  }
};
