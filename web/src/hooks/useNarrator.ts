/**
 * Audio narrator using Web Speech API.
 * Phone acts as the host — announces phases by voice so players can keep eyes closed.
 */

let cachedVoice: SpeechSynthesisVoice | null = null;
let muted = false;

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const ru = voices.filter((v) => v.lang.startsWith("ru"));
  if (ru.length === 0) return null;
  cachedVoice =
    ru.find((v) => /milena|katya|alena|yuliya|google/i.test(v.name)) ??
    ru.find((v) => v.localService) ??
    ru[0];
  return cachedVoice;
}

export function setNarratorMuted(value: boolean) {
  muted = value;
  if (value) stopSpeaking();
}

export function isNarratorMuted(): boolean {
  return muted;
}

export function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (muted || !("speechSynthesis" in window)) {
      // Fallback: brief delay so phases don't snap instantly
      setTimeout(resolve, 1200);
      return;
    }

    if (!cachedVoice && window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => pickVoice();
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ru-RU";
    utterance.rate = 0.9;
    utterance.pitch = 0.95;
    utterance.volume = 1;

    const voice = pickVoice();
    if (voice) utterance.voice = voice;

    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      resolve();
    };

    const timeout = setTimeout(finish, 8000);
    utterance.onend = finish;
    utterance.onerror = finish;

    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/** Call once on first user interaction to "unlock" speech synthesis on iOS. */
export function primeNarrator() {
  if (!("speechSynthesis" in window)) return;
  // Speaking an empty utterance triggers permission/init
  const u = new SpeechSynthesisUtterance(" ");
  u.volume = 0;
  u.lang = "ru-RU";
  window.speechSynthesis.speak(u);
}
