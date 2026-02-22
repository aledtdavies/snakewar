import { CONFIG } from './constants.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on base canvas

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.cx = this.width / 2;
        this.cy = this.height / 2;

        // Load colorized realistic snake head sprites
        this.headImages = {};
        const skins = ['neon-cyan', 'neon-magenta', 'toxic-green', 'solar-flare'];
        skins.forEach(skin => {
            const img = new Image();
            img.src = `assets/head-${skin}.png`;
            this.headImages[skin] = img;
        });

        // Load 3D blocky powerup icons
        this.powerupImages = {};
        ['star', 'shield', 'magnet'].forEach(type => {
            const img = new Image();
            img.src = `assets/powerup-${type}.png`;
            this.powerupImages[type] = img;
        });

        // Bind resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    handleResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.cx = this.width / 2;
        this.cy = this.height / 2;
    }

    render(game, interpolateAlpha = 1) {
        const { player, snakes, food } = game;
        const ctx = this.ctx;

        // Camera follow player (if alive, else use last known pos)
        let camX, camY;
        if (player && player.alive) {
            // Simple linear interpolation for smoother camera tracking
            // Or exact lock to player head
            camX = player.x;
            camY = player.y;
        } else {
            camX = game.deadCameraX || CONFIG.ARENA_SIZE / 2;
            camY = game.deadCameraY || CONFIG.ARENA_SIZE / 2;
        }

        // Calculate zoom and view bounds
        const zoom = this.width < 900 ? 0.8 : 1.0;
        const cullDistX = this.cx / zoom + 50;
        const cullDistY = this.cy / zoom + 50;

        // 1. Draw Background Space
        ctx.fillStyle = game.level === 2 ? '#000810' : (game.level === 3 ? '#100008' : CONFIG.COLORS.BACKGROUND);
        ctx.fillRect(0, 0, this.width, this.height);

        // Apply Camera Transform
        ctx.save();
        ctx.translate(this.cx, this.cy);
        ctx.scale(zoom, zoom);
        ctx.translate(-camX, -camY);

        // 2. Draw Arena Floor & Grid
        ctx.fillStyle = game.level === 2 ? '#001020' : (game.level === 3 ? '#200010' : CONFIG.COLORS.ARENA_BG);
        ctx.fillRect(0, 0, CONFIG.ARENA_SIZE, CONFIG.ARENA_SIZE);

        ctx.strokeStyle = game.level === 2 ? 'rgba(0, 240, 255, 0.3)' : (game.level === 3 ? 'rgba(255, 0, 170, 0.4)' : CONFIG.COLORS.GRID);
        ctx.lineWidth = 1;
        ctx.beginPath();

        const gridSize = (game.level === 2 || game.level === 3) ? CONFIG.GRID_SIZE / 2 : CONFIG.GRID_SIZE;

        // Draw vertical lines
        for (let x = 0; x <= CONFIG.ARENA_SIZE; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CONFIG.ARENA_SIZE);
        }
        // Draw horizontal lines
        for (let y = 0; y <= CONFIG.ARENA_SIZE; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(CONFIG.ARENA_SIZE, y);
        }
        ctx.stroke();

        // 3. Draw Arena Bounds
        ctx.strokeStyle = CONFIG.COLORS.ARENA_BORDER;
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, CONFIG.ARENA_SIZE, CONFIG.ARENA_SIZE);
        // Outer glow for bounds
        ctx.shadowColor = CONFIG.COLORS.ARENA_BORDER;
        ctx.shadowBlur = 20;
        ctx.strokeRect(0, 0, CONFIG.ARENA_SIZE, CONFIG.ARENA_SIZE);
        ctx.shadowBlur = 0; // Reset

        // 4. Draw Food
        // Only render food in view
        for (const f of food) {
            if (f.markedForDeletion) continue;

            // Simple culling
            if (f.x < camX - cullDistX || f.x > camX + cullDistX ||
                f.y < camY - cullDistY || f.y > camY + cullDistY) {
                continue;
            }

            ctx.beginPath();
            const pulse = Math.sin((performance.now() / 200) + f.floatOffset) * 2;

            if (f.isStar || f.isShield || f.isMagnet) {
                const type = f.isStar ? 'star' : (f.isShield ? 'shield' : 'magnet');
                const img = this.powerupImages[type];
                if (img && img.complete) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'screen';
                    const size = (f.radius * 2.8) + pulse;
                    ctx.drawImage(img, f.x - size / 2, f.y - size / 2, size, size);
                    ctx.restore();
                    continue;
                }
            } else {
                ctx.arc(f.x, f.y, f.radius + (f.isDrop ? pulse : 0), 0, Math.PI * 2);
            }

            ctx.fillStyle = f.color;
            ctx.shadowColor = f.color;
            ctx.shadowBlur = (f.isStar || f.isShield || f.isMagnet) ? 25 : (f.isDrop ? 15 : 10);

            if (f.isShield || f.isMagnet) {
                ctx.strokeStyle = f.color;
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.globalAlpha = 0.3;
                ctx.fill();
                ctx.globalAlpha = 1.0;
            } else {
                ctx.fill();
            }
            ctx.shadowBlur = 0; // Reset
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Ensure transform is reset after magnet's rotate
            ctx.translate(this.cx, this.cy);
            ctx.scale(zoom, zoom);
            ctx.translate(-camX, -camY); // Re-apply camera for next iteration
        }

        // 4.5 Draw Particles
        for (const p of game.particles || []) {
            if (p.x < camX - cullDistX || p.x > camX + cullDistX ||
                p.y < camY - cullDistY || p.y > camY + cullDistY) {
                continue;
            }

            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        // 5. Draw Snakes
        // Sort so player draws last (on top) if alive
        const sortedSnakes = [...snakes].sort((a, b) => {
            if (a.isPlayer) return 1;
            if (b.isPlayer) return -1;
            return a.length - b.length;
        });

        for (const snake of sortedSnakes) {
            if (!snake.alive) continue;

            // Simple culling (approximate based on head)
            const snakeCullX = cullDistX + 500;
            const snakeCullY = cullDistY + 500;
            if (snake.x < camX - snakeCullX || snake.x > camX + snakeCullX ||
                snake.y < camY - snakeCullY || snake.y > camY + snakeCullY) {
                // Note: large snakes might get culled incorrectly if checking only head
                // In a robust game we'd check AABB of whole body, but this is fine for now
                continue;
            }

            // Draw Body (tail to neck)
            for (let i = snake.segments.length - 1; i >= 1; i--) {
                const seg = snake.segments[i];

                // Culling: Skip drawing off-screen segments entirely
                const cullMargin = snake.radius * 3;
                if (seg.x < camX - cullDistX - cullMargin || seg.x > camX + cullDistX + cullMargin ||
                    seg.y < camY - cullDistY - cullMargin || seg.y > camY + cullDistY + cullMargin) {
                    continue;
                }

                // Taper tail slightly
                const tailFactor = 1 - (i / snake.segments.length) * 0.4; // Taper down to 60% size
                const radius = (snake.radius * 0.9) * tailFactor;

                // Determine angle between this segment and the previous one (to orient scales)
                let angle = snake.angle;
                if (i > 1) {
                    const prevSeq = snake.segments[i - 1];
                    angle = Math.atan2(prevSeq.y - seg.y, prevSeq.x - seg.x);
                }

                // Shimmer effect based on time and segment index
                const shimmer = Math.sin((performance.now() / 300) + i * 0.2);

                const primaryColor = snake.skin.body1;
                const secondaryColor = snake.skin.body2;

                ctx.save();
                ctx.translate(seg.x, seg.y);
                ctx.rotate(angle);

                const segLen = Math.max(8, radius * 0.9);
                const segWidth = radius * 1.8; // Marginally thicker width
                const halfW = segWidth / 2;

                // Chevron geometry pointing forward (+X)
                const chevronPoint = segLen * 1.2;
                const wingX = -segLen * 0.4;
                const innerTipX = wingX + segLen * 0.8;

                ctx.beginPath();

                if (i === snake.segments.length - 1) {
                    // Wiggling tapered tail spike
                    // Add a dynamic wiggle angle based on time and segment speed
                    const wiggleSpeed = snake.isBoosting ? 0.02 : 0.01;
                    const wiggleAmount = snake.isBoosting ? 0.5 : 0.3; // Radians
                    const wiggleAngle = Math.sin(performance.now() * wiggleSpeed) * wiggleAmount;

                    // Apply extra rotation for the wiggle right at the tail
                    ctx.rotate(wiggleAngle);

                    const tailLength = segLen * 2.5;
                    const tailBaseY = halfW * 0.4; // Narrower base
                    const backTipX = -tailLength;
                    const frontPointX = tailLength * 0.2;

                    // Draw a chevron that tapers off into a long point
                    ctx.moveTo(frontPointX, 0); // Front inner connection
                    ctx.quadraticCurveTo(0, tailBaseY, wingX, tailBaseY); // Curve to slight top wing
                    ctx.lineTo(backTipX, 0); // Straight taper to back tip
                    ctx.lineTo(wingX, -tailBaseY); // Back up to slight bottom wing
                    ctx.quadraticCurveTo(0, -tailBaseY, frontPointX, 0); // Curve back to front
                } else {
                    // Standard Chevron geometry pointing forward (+X)
                    ctx.moveTo(wingX, -halfW); // Top-left wing
                    ctx.quadraticCurveTo(0, -halfW * 0.2, chevronPoint, 0); // Curve to front tip
                    ctx.quadraticCurveTo(0, halfW * 0.2, wingX, halfW); // Curve to bottom-left wing
                    ctx.quadraticCurveTo(innerTipX, 0, wingX, -halfW); // Inner curve back to start
                }

                ctx.closePath();

                // High transparency shading fill
                ctx.globalAlpha = snake.isBoosting ? 0.4 : 0.15;
                ctx.fillStyle = primaryColor;
                ctx.fill();

                // Bright glowing outline
                ctx.globalAlpha = snake.isBoosting ? 1.0 : 0.8;
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 2.0; // Thicker lines
                ctx.stroke();

                ctx.restore();
            }

            // Draw Head
            ctx.fillStyle = snake.skin.body1; // Match body

            ctx.save();
            ctx.translate(snake.x, snake.y);
            ctx.rotate(snake.angle);

            ctx.beginPath();

            const activeHead = this.headImages[snake.skinId];
            if (activeHead && activeHead.complete && activeHead.naturalWidth > 0) {
                const hw = snake.radius * 3.7; // Decreased to 80% of 4.6
                const hh = snake.radius * 3.7;

                // Adjust brightness based on boost (head is very bright)
                const boostAlpha = snake.isBoosting ? 1.0 : 0.9;
                ctx.globalAlpha = boostAlpha;

                // Offset so the back aligns perfectly with the neck
                ctx.drawImage(activeHead, -hw * 0.20, -hh * 0.5, hw, hh);

                // Boost glow
                if (snake.isBoosting) {
                    ctx.shadowColor = snake.skin.body1;
                    ctx.shadowBlur = 25;
                    ctx.beginPath();
                    ctx.arc(0, 0, snake.radius, 0, Math.PI * 2);
                    ctx.fillStyle = 'transparent';
                    ctx.fill();
                }

                // Shield Active Indicator
                if (snake.shieldTime > 0) {
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 15;
                    ctx.strokeStyle = '#00f0ff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    const pulse = Math.sin(performance.now() / 150) * 5;
                    const r = (snake.radius * 2.5) + pulse;
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * Math.PI * 2) / 6;
                        const x = Math.cos(angle) * r;
                        const y = Math.sin(angle) * r;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }

                // Magnet Active Indicator
                if (snake.magnetTime > 0) {
                    ctx.shadowColor = '#ff00aa';
                    ctx.shadowBlur = 10;
                    ctx.strokeStyle = '#ff00aa';
                    ctx.lineWidth = 1.5;
                    const time = performance.now() / 200;
                    for (let j = 0; j < 2; j++) {
                        ctx.beginPath();
                        const r = ((time + j) % 2) * 20 + snake.radius;
                        ctx.arc(0, 0, r, 0, Math.PI * 2);
                        ctx.globalAlpha = 1 - ((time + j) % 2) / 2;
                        ctx.stroke();
                    }
                    ctx.globalAlpha = 1.0;
                }
                ctx.shadowBlur = 0;
            } else {
                // Fallback geometry if image fails to load
                ctx.arc(0, 0, snake.radius * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = snake.skin.body1;
                ctx.fill();
            }

            ctx.restore();
            ctx.globalAlpha = 1.0; // Reset for nameplate

            // Draw Nameplate (only for bots/others, player knows who they are)
            if (!snake.isPlayer) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '12px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(snake.name, snake.x, snake.y - snake.radius - 10);
            }
        }

        ctx.restore(); // Removes camera transform

        // 6. Draw Minimap directly (could decouple to HUD class, but simple enough here)
        this.renderMinimap(game, camX, camY);
    }

    renderMinimap(game, camX, camY) {
        const minimap = document.getElementById('minimap-canvas');
        if (!minimap) return;

        const mctx = minimap.getContext('2d');
        if (minimap.width === 0) { // init once
            minimap.width = 150;
            minimap.height = 150;
        }

        mctx.clearRect(0, 0, minimap.width, minimap.height);

        // Draw arena bounds on minimap
        mctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        mctx.lineWidth = 1;
        mctx.strokeRect(10, 10, minimap.width - 20, minimap.height - 20);

        const scale = (minimap.width - 20) / CONFIG.ARENA_SIZE;

        // Draw snakes as dots
        game.snakes.forEach(snake => {
            if (!snake.alive) return;

            const mx = 10 + (snake.x * scale);
            const my = 10 + (snake.y * scale);

            mctx.fillStyle = snake.isPlayer ? snake.skin.body1 : '#ff3333';
            mctx.beginPath();
            mctx.arc(mx, my, snake.isPlayer ? 3 : 2, 0, Math.PI * 2);
            mctx.fill();
        });

        // Draw camera viewport box
        const viewW = this.width * scale;
        const viewH = this.height * scale;
        const vx = 10 + (camX * scale) - (viewW / 2);
        const vy = 10 + (camY * scale) - (viewH / 2);

        mctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        mctx.strokeRect(vx, vy, viewW, viewH);
    }
}
