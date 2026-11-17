// 输入处理模块 - 监听键盘，向游戏派发字符/退格事件
class InputHandler {
    constructor(callbacks) {
        this.onChar = callbacks.onChar;         // (char) => void
        this.onBackspace = callbacks.onBackspace; // () => void
        this.enabled = false;
        this._handler = this._handleKeyDown.bind(this);
    }

    enable() {
        if (this.enabled) return;
        this.enabled = true;
        document.addEventListener('keydown', this._handler);
    }

    disable() {
        this.enabled = false;
        document.removeEventListener('keydown', this._handler);
    }

    _handleKeyDown(e) {
        if (!this.enabled) return;

        // 忽略带修饰键的组合（复制/粘贴等）
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        if (e.key === 'Backspace') {
            e.preventDefault();
            if (this.onBackspace) this.onBackspace();
            return;
        }

        // 只处理单个可见字符（字母、数字、标点、空格）
        if (e.key.length === 1) {
            e.preventDefault();
            if (this.onChar) this.onChar(e.key);
        }
    }
}

window.InputHandler = InputHandler;
