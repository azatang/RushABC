// 统计模块 - 准确率、速度、字数
class Statistics {
    constructor() {
        this.reset();
    }

    reset() {
        this.totalKeystrokes = 0;  // 总按键次数（含错误）
        this.correctChars = 0;     // 正确输入的字符数
        this.wrongChars = 0;       // 错误按键次数
        this.completedWords = 0;   // 完成的词汇/单词数
    }

    // 记录一次正确按键
    recordCorrect() {
        this.totalKeystrokes++;
        this.correctChars++;
    }

    // 记录一次错误按键
    recordWrong() {
        this.totalKeystrokes++;
        this.wrongChars++;
    }

    recordWordComplete() {
        this.completedWords++;
    }

    // 准确率（百分比，保留一位小数）
    getAccuracy() {
        if (this.totalKeystrokes === 0) return 100;
        return Math.round((this.correctChars / this.totalKeystrokes) * 1000) / 10;
    }

    // 速度：每分钟正确字符数（CPM），elapsedSeconds 为已用秒数
    getSpeed(elapsedSeconds) {
        if (elapsedSeconds <= 0) return 0;
        return Math.round((this.correctChars / elapsedSeconds) * 60);
    }

    getSummary(elapsedSeconds) {
        return {
            accuracy: this.getAccuracy(),
            speed: this.getSpeed(elapsedSeconds),
            correctChars: this.correctChars,
            wrongChars: this.wrongChars,
            completedWords: this.completedWords
        };
    }
}

window.Statistics = Statistics;
