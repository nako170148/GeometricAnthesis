// hands.js
// 手検出（MediaPipe Hands）との橋渡しを行うスタブ。
// Raspberry Pi のセットアップ後に実装を差し替える予定。

class HandTracker {
  constructor() {
    this.isReady = false;
    this.cursor = { x: 0, y: 0, isGrabbing: false };
  }

  async init() {
    // TODO: MediaPipe Hands の初期化処理を実装
    this.isReady = true;
  }

  updateFromMouse(mouseX, mouseY, mouseIsPressed) {
    // PC 作業中はマウスカーソルを手カーソルの代わりにする
    this.cursor.x = mouseX;
    this.cursor.y = mouseY;
    this.cursor.isGrabbing = mouseIsPressed;
  }

  getCursor() {
    return { ...this.cursor };
  }
}

export const handTracker = new HandTracker();
