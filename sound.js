// sound.js
// サウンド制御のスタブ。展示環境での実装時に差し替える。

class SoundController {
  constructor() {
    this.isMuted = false;
    this.buffers = new Map();
  }

  async load(name, url) {
    // TODO: Web Audio API で音源をロード
    this.buffers.set(name, url);
  }

  play(name, options = {}) {
    if (this.isMuted) return;
    // TODO: 実際の再生処理
    console.log(`[sound] play ${name}`, options);
  }

  stop(name) {
    // TODO: 再生停止処理
    console.log(`[sound] stop ${name}`);
  }

  toggleMute(force) {
    this.isMuted = typeof force === "boolean" ? force : !this.isMuted;
  }
}

export const soundController = new SoundController();
