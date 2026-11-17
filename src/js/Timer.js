// 计时器模块 - 倒计时（默认 5 分钟）
class Timer {
    constructor(durationSeconds, onTick, onEnd) {
        this.duration = durationSeconds;
        this.remaining = durationSeconds;
        this.onTick = onTick;   // (remaining, elapsed) => void
        this.onEnd = onEnd;     // () => void
        this.intervalId = null;
    }

    start() {
        this.stop();
        this.intervalId = setInterval(() => {
            this.remaining--;
            if (this.onTick) {
                this.onTick(this.remaining, this.duration - this.remaining);
            }
            if (this.remaining <= 0) {
                this.stop();
                if (this.onEnd) this.onEnd();
            }
        }, 1000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    reset() {
        this.stop();
        this.remaining = this.duration;
    }

    getElapsed() {
        return this.duration - this.remaining;
    }

    // 将秒数格式化为 MM:SS
    static format(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
}

window.Timer = Timer;
