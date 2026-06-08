/**
 * 大屏音效反馈系统
 * 使用 Web Audio API 生成简单音效，无需外部音频文件
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/** 播放短促的提示音 */
function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // 浏览器可能不支持或用户未交互
  }
}

/** 播放音阶组合 */
function playArpeggio(notes: number[], duration: number, type: OscillatorType = 'sine', volume = 0.12) {
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, duration, type, volume), i * 80);
  });
}

/** 签到成功音效 */
export function playCheckinSound() {
  playArpeggio([523, 659, 784], 0.15, 'sine', 0.12);
}

/** 破冰点亮音效 */
export function playLitUpSound() {
  playArpeggio([660, 880, 1100], 0.2, 'triangle', 0.1);
}

/** 抽奖滚动音效 */
export function playLotteryRollSound() {
  playTone(440, 0.08, 'square', 0.05);
}

/** 抽奖中奖音效 */
export function playWinSound() {
  playArpeggio([523, 659, 784, 1047], 0.25, 'sine', 0.15);
}

/** 摇一摇开始音效 */
export function playShakeStartSound() {
  playTone(330, 0.3, 'sawtooth', 0.08);
}

/** 摇一摇结束音效 */
export function playShakeEndSound() {
  playArpeggio([523, 659, 784, 1047, 784], 0.2, 'triangle', 0.12);
}

/** 场景切换音效 */
export function playSceneSwitchSound() {
  playTone(600, 0.1, 'sine', 0.08);
  setTimeout(() => playTone(800, 0.1, 'sine', 0.08), 50);
}

/** 活动结束音效 */
export function playEventEndSound() {
  playArpeggio([523, 392, 330, 262], 0.3, 'sine', 0.12);
}