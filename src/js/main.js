// 主程序入口 - 界面切换与事件绑定
(function () {
    const $ = (id) => document.getElementById(id);

    const screens = {
        home: $('screen-home'),
        game: $('screen-game'),
        result: $('screen-result')
    };

    const dom = {
        keyboard: $('keyboard'),
        wordHint: $('word-hint'),
        charRow: $('char-row'),
        statTime: $('stat-time'),
        statAccuracy: $('stat-accuracy'),
        statSpeed: $('stat-speed'),
        statProgress: $('stat-progress'),
        progressLabel: $('progress-label'),
        progressFill: $('progress-fill'),
        modeBadge: $('mode-badge'),
        battle: {
            scene: $('battle-scene'),
            arena: $('btl-arena'),
            track: $('btl-track'),
            flash: $('screen-flash'),
            playerFigure: $('btl-player-figure'),
            monFigure: $('btl-mon-figure'),
            playerHpFill: $('btl-player-hp-fill'),
            playerHpNums: $('btl-player-hp-nums'),
            monHpFill: $('btl-mon-hp-fill'),
            monHpNums: $('btl-mon-hp-nums'),
            monName: $('btl-mon-name'),
            score: $('btl-score'),
            combo: $('btl-combo'),
            kills: $('btl-kills')
        }
    };

    const game = new Game(dom);

    const selection = { mode: null, difficulty: null, play: 'practice' };

    const MODE_NAMES = { chinese: '中文拼音', english: '英文单词' };
    const DIFF_NAMES = { easy: '简单', medium: '中等', hard: '困难' };
    const PLAY_NAMES = { practice: '练习模式', battle: '闯关打怪' };

    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[name].classList.add('active');
    }

    function updateStartButton() {
        $('btn-start').disabled = !(selection.mode && selection.difficulty);
    }

    // 模式选择
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selection.mode = btn.dataset.mode;
            updateStartButton();
        });
    });

    // 难度选择
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selection.difficulty = btn.dataset.difficulty;
            updateStartButton();
        });
    });

    // 玩法选择（练习模式 / 闯关打怪）
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.play-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selection.play = btn.dataset.play;
        });
    });

    function beginGame() {
        dom.modeBadge.textContent =
            `${MODE_NAMES[selection.mode]} - ${DIFF_NAMES[selection.difficulty]}难度 · ${PLAY_NAMES[selection.play]}`;
        // 根据玩法切换战斗布局
        screens.game.classList.toggle('battle-mode', selection.play === 'battle');
        showScreen('game');
        game.start(selection.mode, selection.difficulty, selection.play);
    }

    // 开始练习
    $('btn-start').addEventListener('click', () => {
        if (selection.mode && selection.difficulty) beginGame();
    });

    // 游戏内：重新开始
    $('btn-restart').addEventListener('click', () => {
        game.abort();
        game.start(selection.mode, selection.difficulty, selection.play);
    });

    // 游戏内：返回菜单
    $('btn-menu').addEventListener('click', () => {
        game.abort();
        showScreen('home');
    });

    // 结果回调
    game.onEnd = (summary) => {
        $('result-accuracy').textContent = summary.accuracy + '%';
        $('result-speed').textContent = summary.speed;
        $('result-correct').textContent = summary.correctChars;
        $('result-wrong').textContent = summary.wrongChars;

        const isBattle = summary.gameMode === 'battle';
        screens.result.classList.toggle('battle-mode', isBattle);

        if (isBattle) {
            $('result-kills').textContent = summary.kills;
            $('result-combo').textContent = summary.maxCombo;
            document.querySelector('.result-title').textContent =
                summary.playerDied ? '💀 法师阵亡！' : '🎉 时间到，挑战完成！';
            $('result-praise').textContent = getBattlePraise(summary.kills, summary.playerDied);
        } else {
            document.querySelector('.result-title').textContent = '🎉 挑战完成！';
            $('result-praise').textContent = getPraise(summary.accuracy, summary.speed);
        }

        saveRecord(summary);
        showScreen('result');
    };

    // 结果页：再次挑战
    $('btn-again').addEventListener('click', beginGame);

    // 结果页：返回首页
    $('btn-home').addEventListener('click', () => showScreen('home'));

    function getPraise(accuracy, speed) {
        if (accuracy >= 98 && speed >= 120) return '太棒了！打字小能手！🏆';
        if (accuracy >= 95) return '非常好，继续保持！🌟';
        if (accuracy >= 85) return '不错哦，多练习会更快！👍';
        return '加油，熟能生巧！💪';
    }

    function getBattlePraise(kills, died) {
        if (died) return '再接再厉，下次打得更准就不会被反击啦！💪';
        if (kills >= 12) return '传说勇者！你消灭了一整支怪物军团！🏆';
        if (kills >= 6) return '打字战士，势不可挡！⚔️';
        if (kills >= 3) return '干得漂亮，继续冒险吧！🌟';
        return '勇敢的挑战者，多练习就能击败更多怪物！👍';
    }

    // 本地保存历史成绩
    function saveRecord(summary) {
        try {
            const key = 'rushabc_records';
            const records = JSON.parse(localStorage.getItem(key) || '[]');
            records.push({
                mode: selection.mode,
                difficulty: selection.difficulty,
                play: selection.play,
                accuracy: summary.accuracy,
                speed: summary.speed,
                correctChars: summary.correctChars,
                wrongChars: summary.wrongChars,
                kills: summary.kills || 0,
                time: Date.now()
            });
            localStorage.setItem(key, JSON.stringify(records.slice(-50)));
        } catch (e) {
            // localStorage 不可用时静默忽略
        }
    }

    showScreen('home');
})();
