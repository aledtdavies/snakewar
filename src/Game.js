import { CONFIG } from './constants.js';
import { Snake } from './Snake.js';
import { Food, Star, Shield, Magnet } from './Food.js';
import { checkCollisions } from './Collision.js';
import { AI } from './AI.js';

const randomName = () => {
    const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Serpent', 'Fang', 'Venom', 'Viper', 'Slither', 'Python', 'Boa', 'Cobra'];
    return names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 100);
}

export class Game {
    constructor(input, renderer, hud) {
        this.input = input;
        this.renderer = renderer;
        this.hud = hud;

        this.snakes = [];
        this.food = [];
        this.bots = [];
        this.particles = [];

        this.player = null;
        this.state = 'MENU'; // MENU, PLAYING, GAME_OVER, LEVEL_UP
        this.level = 1;

        this.lastTime = performance.now();
        this.animationFrameId = null;

        // Stats
        this.timeAlive = 0;
        this.playerKills = 0;
    }

    start(playerName, skinChoice) {
        this.snakes = [];
        this.food = [];
        this.bots = [];
        this.particles = [];
        this.timeAlive = 0;
        this.playerKills = 0;

        // Reset game difficulty and state
        this.level = 1;
        CONFIG.ARENA_SIZE = 4000;
        CONFIG.SCORE_MULTIPLIER = 1.0;

        // Initial Food spwan
        for (let i = 0; i < (CONFIG.MAX_FOOD_ORBS * this.level); i++) {
            this.spawnFood();
        }

        // Spawn Player in center
        this.player = new Snake(
            CONFIG.ARENA_SIZE / 2,
            CONFIG.ARENA_SIZE / 2,
            true,
            playerName || "Player",
            skinChoice
        );
        this.snakes.push(this.player);

        // Spawn Bots
        this._spawnBots(CONFIG.BOT_COUNT);

        this.state = 'PLAYING';
        this.lastTime = performance.now();

        // Update HUD initially
        this.hud.updateScore(this.player.length);

        // Show mobile boost button if it exists
        const mobBtn = document.getElementById('btn-boost-mobile');
        if (mobBtn) mobBtn.classList.remove('hidden');

        if (!this.animationFrameId) {
            this.loop();
        }
    }

    _spawnBots(count) {
        const skins = Object.keys(CONFIG.SKINS);

        for (let i = 0; i < count; i++) {
            // Spawn away from player
            let bx, by;
            do {
                bx = Math.random() * CONFIG.ARENA_SIZE;
                by = Math.random() * CONFIG.ARENA_SIZE;
            } while (this.player && Math.abs(bx - this.player.x) < 500 && Math.abs(by - this.player.y) < 500);

            const botSnake = new Snake(bx, by, false, randomName(), skins[Math.floor(Math.random() * skins.length)]);

            // Randomize bot starting length based on level
            const baseGrowth = 20 * this.level;
            const randomGrowth = Math.floor(Math.random() * 30 * this.level);
            botSnake.targetLength += baseGrowth + randomGrowth;
            botSnake.length += baseGrowth + randomGrowth;

            this.snakes.push(botSnake);
            this.bots.push(new AI(botSnake, this.level));
        }
    }

    triggerLevelUp(targetLevel) {
        this.level = targetLevel;
        this.state = 'LEVEL_UP';

        // Base Configuration Changes
        CONFIG.ARENA_SIZE = 5000 + (this.level - 1) * 1500;
        CONFIG.SCORE_MULTIPLIER = 1.0 + (this.level - 1) * 1.0;

        const targetBots = 30 + (this.level - 1) * 10;
        let addedBots = targetBots - this.bots.length;

        if (addedBots > 0) {
            this._spawnBots(addedBots);
        }

        // Replenish food for larger arena
        for (let i = 0; i < CONFIG.MAX_FOOD_ORBS * this.level; i++) {
            this.spawnFood();
        }

        // Show level up message
        this.hud.showLevelUp(this.level, () => {
            // Resume game
            this.state = 'PLAYING';
            this.lastTime = performance.now();
        });
    }

    spawnFood() {
        // Collect powerup counts
        const numStars = this.food.filter(f => f.isStar).length;
        const numShields = this.food.filter(f => f.isShield).length;
        const numMagnets = this.food.filter(f => f.isMagnet).length;

        const rand = Math.random();

        // Very rare Star spawn (0.5%)
        if (rand < 0.005 && numStars < CONFIG.MAX_STARS) {
            this.food.push(new Star(Math.random() * CONFIG.ARENA_SIZE, Math.random() * CONFIG.ARENA_SIZE));
        }
        // 1.5% chance for Shield
        else if (rand >= 0.005 && rand < 0.02 && numShields < CONFIG.MAX_SHIELDS) {
            this.food.push(new Shield(Math.random() * CONFIG.ARENA_SIZE, Math.random() * CONFIG.ARENA_SIZE));
        }
        // 1.5% chance for Magnet
        else if (rand >= 0.02 && rand < 0.035 && numMagnets < CONFIG.MAX_MAGNETS) {
            this.food.push(new Magnet(Math.random() * CONFIG.ARENA_SIZE, Math.random() * CONFIG.ARENA_SIZE));
        }

        // Standard food
        if (this.food.length < CONFIG.MAX_FOOD_ORBS) {
            this.food.push(new Food(
                Math.random() * CONFIG.ARENA_SIZE,
                Math.random() * CONFIG.ARENA_SIZE
            ));
        }
    }

    killSnake(snake) {
        const segments = snake.die();

        // Drop food for each tail segment
        // To prevent massive lag on huge snake death, we might cap the drops
        const dropCount = Math.min(segments.length, 100);
        const step = Math.max(1, Math.floor(segments.length / dropCount));

        for (let i = 0; i < segments.length; i += step) {
            const seg = segments[i];
            // Scatter slightly
            const scatterX = (Math.random() - 0.5) * 20;
            const scatterY = (Math.random() - 0.5) * 20;
            this.food.push(new Food(seg.x + scatterX, seg.y + scatterY, 3, true));
        }

        if (snake.isPlayer) {
            this.gameOver();
        } else {
            // Respawn a new bot eventually to keep arena populated
            setTimeout(() => {
                if (this.state === 'PLAYING') {
                    this._spawnBots(1);
                }
            }, 3000);
        }
    }

    gameOver() {
        this.state = 'GAME_OVER';
        this.deadCameraX = this.player.x;
        this.deadCameraY = this.player.y;

        this.hud.showGameOver(this.player.length, this.playerKills, this.timeAlive, this.player.name);

        // Hide mobile boost button
        const mobBtn = document.getElementById('btn-boost-mobile');
        if (mobBtn) mobBtn.classList.add('hidden');
    }

    update(dt) {
        if (this.state !== 'PLAYING') return;

        this.timeAlive += dt;

        // Update player
        if (this.player && this.player.alive) {
            const targetAngle = this.input.getAngle();
            this.player.update(dt, targetAngle, this.input.isBoosting);

            this.hud.updateScore(this.player.length);
            this.hud.updateBoostPrompt(this.player.length >= CONFIG.MIN_BOOST_LENGTH);

            // Check for Infinite Level Up
            const nextLevelThreshold = this.level * this.level * 2500;
            if (this.player.length >= nextLevelThreshold) {
                this.triggerLevelUp(this.level + 1);
            }
        }

        // Update bots
        this.bots.forEach(bot => bot.update(dt, this, this.snakes, this.food));

        // Generate boost particles & cleanup dead entities
        this.snakes = this.snakes.filter(s => {
            if (!s.alive) return false;

            // Boost particles
            if (s.isBoosting && s.segments.length > 0) {
                // Emit 2-3 particles per frame from the tail
                const tail = s.segments[s.segments.length - 1];
                for (let i = 0; i < 2; i++) {
                    // Slight spread
                    const angleOff = s.angle + Math.PI + (Math.random() - 0.5);
                    const speed = 20 + Math.random() * 50;
                    this.particles.push({
                        x: tail.x + (Math.random() - 0.5) * 10,
                        y: tail.y + (Math.random() - 0.5) * 10,
                        vx: Math.cos(angleOff) * speed,
                        vy: Math.sin(angleOff) * speed,
                        life: 0.5 + Math.random() * 0.5, // 0.5 to 1 second
                        maxLife: 1.0,
                        color: s.skin.body1,
                        size: 2 + Math.random() * 3
                    });
                }
            }
            return true;
        });

        this.bots = this.bots.filter(b => b.snake.alive);

        // Update food (lifespans)
        this.food.forEach(f => f.update(dt));
        this.food = this.food.filter(f => !f.markedForDeletion);

        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // Replenish natural food
        if (Math.random() < 0.1) { // 10% chance per frame to spawn food if under limit
            this.spawnFood();
        }

        // Handle Magnet logic for all alive snakes
        this.snakes.forEach(snake => {
            if (snake.magnetTime > 0 && snake.alive) {
                this.food.forEach(f => {
                    const dx = snake.x - f.x;
                    const dy = snake.y - f.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < CONFIG.MAGNET_RANGE * CONFIG.MAGNET_RANGE) {
                        const dist = Math.sqrt(distSq);
                        if (dist > 5) {
                            const pullSpeed = 500; // Fast magnetic pull
                            f.x += (dx / dist) * pullSpeed * dt;
                            f.y += (dy / dist) * pullSpeed * dt;
                        }
                    }
                });
            }
        });

        checkCollisions(this);

        // Update leaderboard (10 times a second max, not every frame)
        if (Math.random() < 0.1) {
            this.hud.updateLeaderboard(this.snakes);
        }
    }

    loop() {
        const now = performance.now();
        // Cap dt to prevent massive jumps if tab is backgrounded
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;

        if (this.state === 'PLAYING') {
            this.update(dt);
        }

        // Always render, even if dead (to see background/other snakes)
        this.renderer.render(this);

        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}
