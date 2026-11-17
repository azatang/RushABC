// 战斗模块 - 打字打怪玩法：攻击动画、怪物管理、血量与连击
class Battle {
    // 怪物图鉴（逐只增强）
    static get MONSTERS() {
        return [
            { name: '史莱姆', emoji: '🟢', hp: 30,  reward: 50,  proj: '💧' },
            { name: '青蛙王', emoji: '🐸', hp: 45,  reward: 80,  proj: '💚' },
            { name: '小蝙蝠', emoji: '🦇', hp: 55,  reward: 100, proj: '🌫️' },
            { name: '骷髅兵', emoji: '💀', hp: 70,  reward: 130, proj: '🦴' },
            { name: '毒蜘蛛', emoji: '🕷️', hp: 85,  reward: 160, proj: '🕸️' },
            { name: '森林狼', emoji: '🐺', hp: 100, reward: 190, proj: '🌑' },
            { name: '绿巨蛇', emoji: '🐍', hp: 115, reward: 220, proj: '💜' },
            { name: '丧尸王', emoji: '🧟', hp: 130, reward: 260, proj: '☠️' },
            { name: '石巨人', emoji: '🗿', hp: 150, reward: 300, proj: '🪨' },
            { name: '小火龙', emoji: '🐲', hp: 170, reward: 350, proj: '🔥' },
            { name: '独角兽', emoji: '🦄', hp: 190, reward: 400, proj: '🌈' },
            { name: '大魔王', emoji: '👹', hp: 220, reward: 480, proj: '⚡' },
            { name: '幽灵王', emoji: '👻', hp: 250, reward: 560, proj: '🌀' },
            { name: '远古巨龙', emoji: '🐉', hp: 320, reward: 800, proj: '☄️' },
        ];
    }

    // 难度对怪物血量的缩放
    static get DIFF_SCALE() {
        return { easy: 0.8, medium: 1.0, hard: 1.3 };
    }

    constructor(dom) {
        this.dom = dom; // 战斗相关 DOM 集合
        this.onPlayerDead = null;   // 玩家阵亡回调
        this.hpScale = 1;
        this.reset('medium');
    }

    reset(difficulty) {
        this.hpScale = Battle.DIFF_SCALE[difficulty] || 1;
        this.playerMaxHp = 100;
        this.playerHp = 100;
        this.monIdx = 0;
        this.combo = 1;
        this.maxCombo = 1;
        this.kills = 0;
        this.score = 0;
        this.dead = false;
        this.gen = (this.gen || 0) + 1; // 代际令牌：使上一局的延时回调失效
    }

    start() {
        this._loadMonster(0);
        this._updatePlayerHp();
        this.dom.combo.textContent = 'x1';
        this.dom.kills.textContent = '0';
        this.dom.score.textContent = '0';
    }

    _monsterAt(idx) {
        return Battle.MONSTERS[idx % Battle.MONSTERS.length];
    }

    _loadMonster(idx) {
        const m = this._monsterAt(idx);
        const cycle = Math.floor(idx / Battle.MONSTERS.length); // 循环轮数额外加成
        this.monMaxHp = Math.round(m.hp * this.hpScale * (1 + cycle * 0.4));
        this.monHp = this.monMaxHp;

        this.dom.monName.textContent = m.name;
        this.dom.monFigure.textContent = m.emoji;
        this._updateMonHp();

        const mc = this.dom.monFigure;
        mc.classList.remove('die', 'hurt', 'atk');
        void mc.offsetWidth;
        mc.classList.add('enter');
        setTimeout(() => mc.classList.remove('enter'), 550);

        this._showBanner(m.emoji + ' ' + m.name);
    }

    _showBanner(text) {
        const scene = this.dom.scene;
        scene.querySelectorAll('.btl-banner').forEach(b => b.remove());
        const b = document.createElement('div');
        b.className = 'btl-banner';
        b.innerHTML = `<div class="btl-banner-sub">— 敌人出现 —</div><div class="btl-banner-name">${text}</div>`;
        scene.appendChild(b);
        setTimeout(() => b.remove(), 1600);
    }

    // 正确输入一个字符：发射小弹攻击
    onCorrectChar() {
        if (this.dead) return;
        const gen = this.gen;
        const dmg = Math.max(1, Math.floor((3 + this.combo) * (0.8 + Math.random() * 0.4)));
        this.score += 2 * this.combo;
        this._fireProjectile(false);
        setTimeout(() => { if (gen === this.gen) this._damageMonster(dmg, false); }, 300);
    }

    // 完成一个词：连击+1，发射大招
    onWordComplete() {
        if (this.dead) return;
        const gen = this.gen;
        this.combo = Math.min(20, this.combo + 1);
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        const dmg = Math.max(1, Math.floor((10 + this.combo * 3) * (0.85 + Math.random() * 0.3)));
        this.score += 15 * this.combo;

        this._playerAttackAnim();
        this._fireProjectile(true);
        setTimeout(() => { if (gen === this.gen) this._damageMonster(dmg, true); }, 450);

        this._flashCombo(
            this.combo >= 8 ? '🔥🔥 ' + this.combo + ' 连击！！' :
            this.combo >= 4 ? '🔥 ' + this.combo + ' 连击！' : '✨ 完美命中！'
        );
        this.dom.combo.textContent = 'x' + this.combo;
        this.dom.score.textContent = this.score;
    }

    // 输入错误：连击清零，怪物反击
    onError() {
        if (this.dead) return;
        this.combo = 1;
        this.dom.combo.textContent = 'x1';
        this._monsterAttack();
    }

    _damageMonster(dmg, big) {
        if (this.dead) return;
        this.monHp = Math.max(0, this.monHp - dmg);
        this._updateMonHp();
        this._spawnDamage(dmg, false, big);
        this._spawnHit(false, big);

        const mc = this.dom.monFigure;
        mc.classList.remove('hurt');
        void mc.offsetWidth;
        mc.classList.add('hurt');
        setTimeout(() => mc.classList.remove('hurt'), 380);

        if (this.monHp <= 0) this._killMonster();
    }

    _killMonster() {
        this.kills++;
        const reward = this._monsterAt(this.monIdx).reward;
        this.score += reward * this.combo;
        this.dom.kills.textContent = this.kills;
        this.dom.score.textContent = this.score;

        const mc = this.dom.monFigure;
        mc.classList.remove('hurt');
        void mc.offsetWidth;
        mc.classList.add('die');

        this._flashCombo('💀 击败！ +' + (reward * this.combo));

        const gen = this.gen;
        setTimeout(() => {
            if (this.dead || gen !== this.gen) return;
            this.monIdx++;
            this._loadMonster(this.monIdx);
        }, 720);
    }

    _monsterAttack() {
        const m = this._monsterAt(this.monIdx);
        const gen = this.gen;
        const dmg = Math.floor(4 + Math.random() * 9);

        const mc = this.dom.monFigure;
        mc.classList.remove('atk');
        void mc.offsetWidth;
        mc.classList.add('atk');
        setTimeout(() => mc.classList.remove('atk'), 320);

        this._fireEnemyProjectile(m.proj);

        setTimeout(() => {
            if (gen !== this.gen) return;
            this.playerHp = Math.max(0, this.playerHp - dmg);
            this._updatePlayerHp();
            this._spawnDamage(dmg, true, false);
            this._spawnHit(true, false);

            const pc = this.dom.playerFigure;
            pc.classList.remove('hurt');
            void pc.offsetWidth;
            pc.classList.add('hurt');
            setTimeout(() => pc.classList.remove('hurt'), 420);

            // 屏幕红边
            const f = this.dom.flash;
            f.classList.remove('flash-red');
            void f.offsetWidth;
            f.classList.add('flash-red');

            if (this.playerHp <= 0 && !this.dead) {
                this.dead = true;
                if (this.onPlayerDead) this.onPlayerDead();
            }
        }, 300);
    }

    // ===== 动画辅助 =====
    _playerAttackAnim() {
        const pc = this.dom.playerFigure;
        pc.classList.remove('atk');
        void pc.offsetWidth;
        pc.classList.add('atk');
        setTimeout(() => pc.classList.remove('atk'), 320);
    }

    _fireProjectile(big) {
        const p = document.createElement('div');
        p.className = 'btl-proj btl-proj-player' + (big ? ' big' : '');
        p.textContent = big ? '✨' : '🔵';
        this.dom.track.appendChild(p);
        setTimeout(() => p.remove(), big ? 500 : 360);
    }

    _fireEnemyProjectile(emoji) {
        const p = document.createElement('div');
        p.className = 'btl-proj btl-proj-enemy';
        p.textContent = emoji;
        this.dom.track.appendChild(p);
        setTimeout(() => p.remove(), 360);
    }

    _spawnHit(playerSide, big) {
        const e = document.createElement('div');
        e.className = 'btl-hit ' + (playerSide ? 'player-side' : 'monster-side');
        e.textContent = big ? '💥' : '✦';
        this.dom.arena.appendChild(e);
        setTimeout(() => e.remove(), 500);
    }

    _spawnDamage(val, playerSide, big) {
        const el = document.createElement('div');
        el.className = 'btl-dmg ' + (playerSide ? 'player-side' : 'monster-side') + (big ? ' big' : '');
        el.textContent = '-' + val;
        this.dom.scene.appendChild(el);
        setTimeout(() => el.remove(), 900);
    }

    _flashCombo(text) {
        const scene = this.dom.scene;
        scene.querySelectorAll('.btl-combo').forEach(b => b.remove());
        const el = document.createElement('div');
        el.className = 'btl-combo';
        el.textContent = text;
        scene.appendChild(el);
        setTimeout(() => el.remove(), 1200);
    }

    _updateMonHp() {
        const pct = this.monMaxHp > 0 ? Math.max(0, this.monHp / this.monMaxHp * 100) : 0;
        this.dom.monHpFill.style.width = pct + '%';
        this.dom.monHpNums.textContent = this.monHp + ' / ' + this.monMaxHp;
    }

    _updatePlayerHp() {
        const pct = Math.max(0, this.playerHp / this.playerMaxHp * 100);
        this.dom.playerHpFill.style.width = pct + '%';
        this.dom.playerHpNums.textContent = this.playerHp + ' / ' + this.playerMaxHp;
    }

    getResult() {
        return { kills: this.kills, maxCombo: this.maxCombo, score: this.score, survived: !this.dead };
    }
}

window.Battle = Battle;
