// キー/マウス/ホイール集中管理。
// 毎フレーム update() でフレームイベント（consumeMouseDelta/consumeWheel/edge）をクリアする。
export class InputManager {
  constructor(domElement) {
    this.el = domElement || document;
    this.keys = new Map();         // code -> true
    this.keysDown = new Map();     // code -> true（このフレームに押された）
    this.keysUp = new Map();       // code -> true（このフレームに離された）
    this.buttons = new Map();      // 0=left / 2=right / 1=middle
    this.buttonsDown = new Map();
    this.buttonsUp = new Map();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheelDY = 0;

    this._onKey = this._onKey.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onContextMenu = (e) => e.preventDefault();

    window.addEventListener('keydown', this._onKey);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('wheel', this._onWheel, { passive: true });
    window.addEventListener('contextmenu', this._onContextMenu);
  }

  _onKey(e) {
    if (!this.keys.get(e.code)) this.keysDown.set(e.code, true);
    this.keys.set(e.code, true);
  }
  _onKeyUp(e) {
    this.keys.set(e.code, false);
    this.keysUp.set(e.code, true);
  }
  _onMouseMove(e) {
    this.mouseDX += e.movementX || 0;
    this.mouseDY += e.movementY || 0;
  }
  _onMouseDown(e) {
    if (!this.buttons.get(e.button)) this.buttonsDown.set(e.button, true);
    this.buttons.set(e.button, true);
  }
  _onMouseUp(e) {
    this.buttons.set(e.button, false);
    this.buttonsUp.set(e.button, true);
  }
  _onWheel(e) {
    this.wheelDY += e.deltaY || 0;
  }

  isKey(code) { return !!this.keys.get(code); }
  isKeyDownEdge(code) { return !!this.keysDown.get(code); }
  isKeyUpEdge(code) { return !!this.keysUp.get(code); }
  isButton(n) { return !!this.buttons.get(n); }
  isButtonDownEdge(n) { return !!this.buttonsDown.get(n); }
  isButtonUpEdge(n) { return !!this.buttonsUp.get(n); }

  consumeMouseDelta() {
    const r = { dx: this.mouseDX, dy: this.mouseDY };
    this.mouseDX = 0;
    this.mouseDY = 0;
    return r;
  }
  consumeWheel() {
    const r = this.wheelDY;
    this.wheelDY = 0;
    return r;
  }

  // フレーム終端で edge をクリア（mouse delta/wheel はその都度 consume される想定）
  update() {
    this.keysDown.clear();
    this.keysUp.clear();
    this.buttonsDown.clear();
    this.buttonsUp.clear();
  }

  destroy() {
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('contextmenu', this._onContextMenu);
  }
}
