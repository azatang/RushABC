// 虚拟键盘模块 - 渲染键盘并高亮当前按键的指位
class Keyboard {
    constructor(container) {
        this.container = container;
        this.keyElements = {}; // char -> element
        this.highlightedKeys = [];
        this._build();
    }

    // 键盘布局：每个键 [显示字符, 手指]
    static get LAYOUT() {
        return [
            [
                ['`', 'pinky'], ['1', 'pinky'], ['2', 'ring'], ['3', 'middle'], ['4', 'index'],
                ['5', 'index'], ['6', 'index'], ['7', 'index'], ['8', 'middle'], ['9', 'ring'],
                ['0', 'pinky'], ['-', 'pinky'], ['=', 'pinky']
            ],
            [
                ['Q', 'pinky'], ['W', 'ring'], ['E', 'middle'], ['R', 'index'], ['T', 'index'],
                ['Y', 'index'], ['U', 'index'], ['I', 'middle'], ['O', 'ring'], ['P', 'pinky'],
                ['[', 'pinky'], [']', 'pinky']
            ],
            [
                ['A', 'pinky'], ['S', 'ring'], ['D', 'middle'], ['F', 'index'], ['G', 'index'],
                ['H', 'index'], ['J', 'index'], ['K', 'middle'], ['L', 'ring'], [';', 'pinky'],
                ["'", 'pinky']
            ],
            [
                ['Z', 'pinky'], ['X', 'ring'], ['C', 'middle'], ['V', 'index'], ['B', 'index'],
                ['N', 'index'], ['M', 'index'], [',', 'middle'], ['.', 'ring'], ['/', 'pinky']
            ],
            [
                ['Space', 'thumb']
            ]
        ];
    }

    // 处在基准键位的字母（食指/中指/无名指/小指的home键）
    static get HOME_KEYS() {
        return ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'];
    }

    // 字符 -> 手指 映射（供键盘与字幕共用）
    static fingerFor(char) {
        if (char == null) return null;
        if (!Keyboard._fingerMap) {
            const map = {};
            Keyboard.LAYOUT.forEach(row => row.forEach(([label, finger]) => {
                const key = label === 'Space' ? ' ' : label.toLowerCase();
                map[key] = finger;
            }));
            Keyboard._fingerMap = map;
        }
        return Keyboard._fingerMap[char.toLowerCase()] || null;
    }

    _build() {
        this.container.innerHTML = '';
        Keyboard.LAYOUT.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'kb-row';
            row.forEach(([label, finger]) => {
                const keyEl = document.createElement('div');
                keyEl.className = 'key';
                if (label === 'Space') {
                    keyEl.classList.add('space');
                    keyEl.textContent = '';
                } else {
                    keyEl.textContent = label;
                }
                if (Keyboard.HOME_KEYS.includes(label)) {
                    keyEl.classList.add('home-key');
                }
                keyEl.dataset.finger = finger;
                rowEl.appendChild(keyEl);

                // 用小写字母或字符作为索引
                const key = label === 'Space' ? ' ' : label.toLowerCase();
                this.keyElements[key] = keyEl;
            });
            this.container.appendChild(rowEl);
        });
    }

    // 高亮指定字符对应的按键
    highlight(char) {
        this.clear();
        if (!char) return;
        const key = char.toLowerCase();
        const el = this.keyElements[key];
        if (el) {
            el.classList.add('highlight');
            this.highlightedKeys.push(el);
        }
    }

    clear() {
        this.highlightedKeys.forEach(el => el.classList.remove('highlight'));
        this.highlightedKeys = [];
    }
}

window.Keyboard = Keyboard;
