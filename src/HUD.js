export class HUD {
    constructor() {
        this.scoreValue = document.getElementById('score-value');
        this.leaderboardList = document.getElementById('leaderboard-list');
        this.boostPrompt = document.getElementById('boost-prompt');

        this.menuScreen = document.getElementById('main-menu');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.levelUpScreen = document.getElementById('level-up-screen');
        this.hudLayer = document.getElementById('hud');

        // Game Over stats
        this.finalScore = document.getElementById('final-score');
        this.killsValue = document.getElementById('kills');
        this.timeAliveValue = document.getElementById('time-alive');
    }

    hideAllScreens() {
        this.menuScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.hudLayer.classList.remove('hidden');
    }

    showMenu() {
        this.menuScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.hudLayer.classList.add('hidden');
    }

    showGameOver(score, kills, timeSeconds, playerName) {
        this.hudLayer.classList.add('hidden');
        this.levelUpScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');

        const gameOverPanel = this.gameOverScreen.querySelector('.game-over-panel');
        if (gameOverPanel) {
            // Hide the panel initially
            gameOverPanel.style.opacity = '0';
            gameOverPanel.style.transform = 'translateY(20px)';
            gameOverPanel.style.transition = 'opacity 1s ease 1.5s, transform 1s ease 1.5s'; // 1.5s delay

            // Trigger layout recalculation then fade in
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    gameOverPanel.style.opacity = '1';
                    gameOverPanel.style.transform = 'translateY(0)';
                });
            });
        }

        this.finalScore.textContent = Math.floor(score);
        this.killsValue.textContent = kills;

        const mins = Math.floor(timeSeconds / 60);
        const secs = Math.floor(timeSeconds % 60).toString().padStart(2, '0');
        this.timeAliveValue.textContent = `${mins}:${secs}`;

        // Local Storage Leaderboard Logic
        let scores = [];
        try {
            scores = JSON.parse(localStorage.getItem('snakeWarScores') || '[]');
        } catch (e) { }

        // Find if this is a new PB for this exact name
        const previousBest = scores.find(s => s.name === playerName)?.score || 0;
        const isPB = score > previousBest && score > 30; // Min threshold for PB

        const pbRow = document.getElementById('pb-row');
        if (pbRow) {
            pbRow.style.display = isPB ? 'flex' : 'none';
        }

        // Add and sort global scores
        scores.push({ name: playerName || 'Player', score: score, date: Date.now() });
        scores.sort((a, b) => b.score - a.score);

        // De-duplicate same names (keep highest)
        const uniqueScores = [];
        const seenNames = new Set();
        for (const s of scores) {
            if (!seenNames.has(s.name)) {
                uniqueScores.push(s);
                seenNames.add(s.name);
            }
        }

        // Keep top 10
        try {
            localStorage.setItem('snakeWarScores', JSON.stringify(uniqueScores.slice(0, 10)));
        } catch (e) { }

        // Populate Game Over Leaderboard
        const gameOverLeaderboardList = document.getElementById('game-over-leaderboard-list');
        if (gameOverLeaderboardList) {
            gameOverLeaderboardList.innerHTML = '';
            const topScores = uniqueScores.slice(0, 5); // Show top 5 to fit UI
            topScores.forEach((s, index) => {
                const li = document.createElement('li');
                if (s.name === playerName && s.score === score) {
                    li.classList.add('is-player');
                }

                const nameSpan = document.createElement('span');
                nameSpan.className = 'lb-name';
                nameSpan.textContent = `${index + 1}. ${s.name}`;

                const scoreSpan = document.createElement('span');
                scoreSpan.className = 'lb-score';
                scoreSpan.textContent = Math.floor(s.score);

                li.appendChild(nameSpan);
                li.appendChild(scoreSpan);
                gameOverLeaderboardList.appendChild(li);
            });
        }
    }

    showLevelUp(level, continueCallback) {
        this.hudLayer.classList.add('hidden');
        this.levelUpScreen.classList.remove('hidden');

        const title = document.getElementById('level-up-title');
        title.textContent = `LEVEL ${level}`;

        const desc = this.levelUpScreen.querySelector('p');
        if (level === 2) {
            desc.textContent = "ARENA EXPANDED. MULTIPLIER x2.0";
        } else if (level === 3) {
            desc.textContent = "EXTREME ARENA. MULTIPLIER x3.0";
        }

        const btn = document.getElementById('btn-continue');
        // Remove previous listener if any by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', () => {
            this.levelUpScreen.classList.add('hidden');
            this.hudLayer.classList.remove('hidden');
            if (continueCallback) continueCallback();
        });
    }

    updateScore(score) {
        this.scoreValue.textContent = Math.floor(score);
    }

    updateBoostPrompt(canBoost) {
        if (canBoost) {
            this.boostPrompt.classList.add('show');
        } else {
            this.boostPrompt.classList.remove('show');
        }
    }

    updateLeaderboard(snakes) {
        // Sort snakes by length (descending)
        const topSnakes = [...snakes]
            .sort((a, b) => b.length - a.length)
            .slice(0, 5); // Take top 5

        this.leaderboardList.innerHTML = '';

        topSnakes.forEach((snake, index) => {
            const li = document.createElement('li');
            if (snake.isPlayer) {
                li.classList.add('is-player');
            }

            const nameSpan = document.createElement('span');
            nameSpan.className = 'lb-name';
            nameSpan.textContent = `${index + 1}. ${snake.name}`;

            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'lb-score';
            scoreSpan.textContent = Math.floor(snake.length);

            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);

            this.leaderboardList.appendChild(li);
        });
    }
}
