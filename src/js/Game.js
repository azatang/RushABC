// 游戏核心模块 - 协调词汇、输入、计时、统计与渲染
class Game {
    constructor(dom) {
        this.dom = dom;              // 相关 DOM 元素集合
        this.duration = 300;         // 每局 5 分钟
        this.stats = new Statistics();
        this.keyboard = new Keyboard(dom.keyboard);
        this.battle = dom.battle ? new Battle(dom.battle) : null;
        this.timer = new Timer(
            this.duration,
            (remaining, elapsed) => this._onTick(remaining, elapsed),
            () => this.end()
        );
        this.input = new InputHandler({
            onChar: (c) => this._onChar(c),
            onBackspace: () => this._onBackspace()
        });

        this.mode = 'chinese';
        this.difficulty = 'easy';
        this.gameMode = 'practice';  // 'practice' | 'battle'
        this.queue = [];             // 本局词汇队列
        this.index = 0;              // 当前词汇序号
        this.target = '';            // 当前目标字符串（拼音或单词）
        this.typed = '';             // 当前已输入内容
        this.isRunning = false;
        this.onEnd = null;           // 结束回调（由 main.js 设置）

        // 玩家阵亡 -> 提前结束本局
        if (this.battle) {
            this.battle.onPlayerDead = () => {
                if (this.isRunning) this.end(true);
            };
        }
    }

    // 从词汇库取出并打乱生成队列
    _buildQueue() {
        const source = this.mode === 'chinese'
            ? window.CHINESE_VOCAB[this.difficulty]
            : window.ENGLISH_VOCAB[this.difficulty];

        const pool = source.map(item => ({
            display: item.word,
            target: (this.mode === 'chinese' ? item.pinyin : item.word).toLowerCase(),
            hint: this.mode === 'chinese' ? item.word : `${item.word} (${item.zh})`
        }));

        // Fisher–Yates 洗牌
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        this.queue = pool;
    }

    start(mode, difficulty, gameMode) {
        this.mode = mode;
        this.difficulty = difficulty;
        this.gameMode = gameMode || 'practice';
        this.stats.reset();
        this._buildQueue();
        this.index = 0;
        this.isRunning = true;

        if (this.gameMode === 'battle' && this.battle) {
            this.battle.reset(difficulty);
            this.battle.start();
        }

        this._loadWord();
        this._renderStats(this.duration, 0);
        this.timer.reset();
        this.timer.start();
        this.input.enable();
    }

    _loadWord() {
        if (this.index >= this.queue.length) {
            // 词汇用完则重新洗牌续上，保证 5 分钟内不断词
            this._buildQueue();
            this.index = 0;
        }
        const item = this.queue[this.index];
        this.target = item.target;
        this.typed = '';
        this.dom.wordHint.textContent = item.hint;
        this._renderChars();
        this._renderProgress();
    }

    _onChar(char) {
        if (!this.isRunning) return;
        const pos = this.typed.length;
        const expected = this.target[pos];
        const battling = this.gameMode === 'battle' && this.battle;

        if (char === expected) {
            this.typed += char;
            this.stats.recordCorrect();
            if (battling) this.battle.onCorrectChar();
            this._renderChars();

            if (this.typed.length === this.target.length) {
                // 完成一个词
                this.stats.recordWordComplete();
                if (battling) this.battle.onWordComplete();
                this.index++;
                this._flashComplete();
                setTimeout(() => {
                    if (this.isRunning) this._loadWord();
                }, 150);
            }
        } else {
            // 输入错误：记录但不前进
            this.stats.recordWrong();
            if (battling) this.battle.onError();
            this._renderChars(true);
        }
        this._renderStats(this.timer.remaining, this.timer.getElapsed());
    }

    _onBackspace() {
        if (!this.isRunning) return;
        if (this.typed.length > 0) {
            this.typed = this.typed.slice(0, -1);
            this._renderChars();
        }
    }

    // 渲染当前词的每个字符状态
    _renderChars(errorFlash = false) {
        const row = this.dom.charRow;
        row.innerHTML = '';
        for (let i = 0; i < this.target.length; i++) {
            const span = document.createElement('span');
            const ch = this.target[i];
            span.className = 'character';
            span.textContent = ch === ' ' ? '\u00A0' : ch;
            if (ch === ' ') span.classList.add('space');

            // 按手指配色，与键盘一致
            const finger = Keyboard.fingerFor(ch);
            if (finger) span.dataset.finger = finger;

            if (i < this.typed.length) {
                span.classList.add('correct');
            } else if (i === this.typed.length) {
                span.classList.add(errorFlash ? 'error' : 'current');
            } else {
                span.classList.add('pending');
            }
            row.appendChild(span);
        }
        // 高亮键盘上下一个待按键位
        const nextChar = this.target[this.typed.length];
        this.keyboard.highlight(nextChar);
    }

    _flashComplete() {
        this.dom.charRow.querySelectorAll('.character').forEach(el => {
            el.classList.remove('current', 'pending', 'error');
            el.classList.add('correct');
        });
    }

    _renderProgress() {
        const total = this.queue.length;
        const done = this.stats.completedWords;
        this.dom.progressLabel.textContent = `词汇进度: ${done} 个已完成`;
        const pct = total > 0 ? Math.min(100, (this.index / total) * 100) : 0;
        this.dom.progressFill.style.width = pct + '%';
        this.dom.statProgress.textContent = `${done}`;
    }

    _renderStats(remaining, elapsed) {
        this.dom.statTime.textContent = Timer.format(Math.max(0, remaining));
        this.dom.statAccuracy.textContent = this.stats.getAccuracy() + '%';
        this.dom.statSpeed.textContent = this.stats.getSpeed(elapsed);
        this.dom.statProgress.textContent = this.stats.completedWords;

        // 最后 30 秒闪烁提醒
        if (remaining <= 30) {
            this.dom.statTime.classList.add('flash');
        } else {
            this.dom.statTime.classList.remove('flash');
        }
    }

    _onTick(remaining, elapsed) {
        this._renderStats(remaining, elapsed);
    }

    end(playerDied = false) {
        this.isRunning = false;
        this.timer.stop();
        this.input.disable();
        this.keyboard.clear();
        this.dom.statTime.classList.remove('flash');
        const summary = this.stats.getSummary(this.timer.getElapsed());
        summary.gameMode = this.gameMode;
        summary.playerDied = playerDied;
        if (this.gameMode === 'battle' && this.battle) {
            const r = this.battle.getResult();
            summary.kills = r.kills;
            summary.maxCombo = r.maxCombo;
            summary.score = r.score;
        }
        if (this.onEnd) this.onEnd(summary);
    }

    // 主动退出（返回菜单）
    abort() {
        this.isRunning = false;
        this.timer.stop();
        this.input.disable();
        this.keyboard.clear();
        this.dom.statTime.classList.remove('flash');
        if (this.battle) this.battle.gen = (this.battle.gen || 0) + 1;
    }
}

window.Game = Game;
