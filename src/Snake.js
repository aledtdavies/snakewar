import { CONFIG } from './constants.js';
import { audioManager } from './Audio.js';

export class Snake {
    constructor(x, y, isPlayer = false, name = "Snake", skin = "neon-cyan") {
        this.id = Math.random().toString(36).substring(2, 9);
        this.isPlayer = isPlayer;
        this.name = name;
        this.skin = CONFIG.SKINS[skin] || CONFIG.SKINS['neon-cyan'];
        this.skinId = skin; // Save the skin name/id for sprite lookup

        // Position and orientation
        this.x = x;
        this.y = y;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;

        // Segments (Array of {x, y})
        // Head is segments[0]
        this.segments = [];
        for (let i = 0; i < CONFIG.INITIAL_LENGTH; i++) {
            // Initially spawn curled behind head
            this.segments.push({
                x: x - Math.cos(this.angle) * CONFIG.SEGMENT_SPACING * i,
                y: y - Math.sin(this.angle) * CONFIG.SEGMENT_SPACING * i
            });
        }

        // Stats & State
        this.length = CONFIG.INITIAL_LENGTH;
        this.targetLength = CONFIG.INITIAL_LENGTH;
        this.isBoosting = false;
        this.alive = true;
        this.score = 0;

        // Current derived stats
        this.radius = CONFIG.HEAD_RADIUS;
        this.speed = CONFIG.BASE_SPEED;
        this.superTime = 0; // seconds remaining for star powerup
        this.shieldTime = 0; // seconds remaining for shield
        this.magnetTime = 0; // seconds remaining for magnet

        // Interpolation data for rendering
        this.lastX = x;
        this.lastY = y;
    }

    update(dt, inputAngle, isBoosting) {
        if (!this.alive) return;

        this.lastX = this.x;
        this.lastY = this.y;

        if (this.superTime > 0) {
            this.superTime -= dt;
            if (this.superTime < 0) this.superTime = 0;
        }
        if (this.shieldTime > 0) {
            this.shieldTime -= dt;
            if (this.shieldTime < 0) this.shieldTime = 0;
        }
        if (this.magnetTime > 0) {
            this.magnetTime -= dt;
            if (this.magnetTime < 0) this.magnetTime = 0;
        }

        // Calculate radius based on length
        // Grow slightly as you get longer
        this.radius = Math.min(
            CONFIG.MAX_RADIUS,
            CONFIG.HEAD_RADIUS + (this.length * CONFIG.GROWTH_SCALE)
        );

        // Super mode makes head/body much larger and flashing
        if (this.superTime > 0) {
            this.radius += 5 + Math.sin(performance.now() / 100) * 3;
        }

        // Handle Boost
        this.isBoosting = isBoosting && this.length > CONFIG.MIN_BOOST_LENGTH;
        if (this.isBoosting) {
            this.speed = CONFIG.BASE_SPEED * CONFIG.BOOST_SPEED_MULT;
            // Drain length over time
            this.targetLength -= CONFIG.BOOST_COST_RATE * dt;
            if (this.targetLength < CONFIG.MIN_BOOST_LENGTH) {
                this.targetLength = CONFIG.MIN_BOOST_LENGTH;
                this.isBoosting = false;
            }

            // Ensure integer length roughly matches targetLength
            if (this.length > Math.ceil(this.targetLength)) {
                this.length--;
                // Pop a segment off the tail when shrunk
                if (this.segments.length > this.length) {
                    this.segments.pop();
                }
            }

        } else {
            this.speed = CONFIG.BASE_SPEED;
        }

        // Steering / Turning
        this.targetAngle = inputAngle;

        // Resolve shortest angle distance
        let diff = this.targetAngle - this.angle;

        // Normalize diff to [-PI, PI]
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        // Cap turn speed
        const maxTurn = CONFIG.TURN_SPEED * dt;
        if (Math.abs(diff) <= maxTurn) {
            this.angle = this.targetAngle;
        } else {
            this.angle += Math.sign(diff) * maxTurn;
        }

        // Normalize angle to [0, 2PI]
        while (this.angle < 0) this.angle += Math.PI * 2;
        while (this.angle >= Math.PI * 2) this.angle -= Math.PI * 2;

        // Move Head
        const dx = Math.cos(this.angle) * this.speed * dt;
        const dy = Math.sin(this.angle) * this.speed * dt;

        this.x += dx;
        this.y += dy;

        // Constrain to arena
        this.x = Math.max(this.radius, Math.min(CONFIG.ARENA_SIZE - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(CONFIG.ARENA_SIZE - this.radius, this.y));

        // Update segments structure (Inverse Kinematics / Follow logic)
        // The head moves, and each subsequent segment is pulled toward the one in front of it

        // Temporarily insert new head position
        this.segments.unshift({ x: this.x, y: this.y });

        // Now space out segments correctly to maintain SEGMENT_SPACING distance
        for (let i = 1; i < this.segments.length; i++) {
            const current = this.segments[i];
            const leader = this.segments[i - 1];

            const cdx = leader.x - current.x;
            const cdy = leader.y - current.y;
            const dist = Math.sqrt(cdx * cdx + cdy * cdy);

            if (dist > 0) {
                // Pull segment towards leader so they are exactly SEGMENT_SPACING apart
                const ratio = (dist - CONFIG.SEGMENT_SPACING) / dist;

                // Only pull if it's too far (creates the slithering effect)
                if (dist > CONFIG.SEGMENT_SPACING) {
                    current.x += cdx * ratio;
                    current.y += cdy * ratio;
                }
            }
        }

        // Growth logic - if we are longer than our segment array, keep the tail
        // Otherwise, chop off the tail to maintain length
        while (this.segments.length > this.length) {
            this.segments.pop();
        }
    }

    eat(foodOrb) {
        this.score += foodOrb.value * (CONFIG.SCORE_MULTIPLIER || 1.0);
        this.targetLength += foodOrb.value * (CONFIG.SCORE_MULTIPLIER || 1.0);
        this.length = Math.floor(this.targetLength);

        if (foodOrb.isStar) {
            this.superTime = CONFIG.STAR_DURATION;
            // audioManager.playSFX('star'); 
        } else if (foodOrb.isShield) {
            this.shieldTime = CONFIG.SHIELD_DURATION;
            // audioManager.playSFX('shield');
        } else if (foodOrb.isMagnet) {
            this.magnetTime = CONFIG.MAGNET_DURATION;
            // audioManager.playSFX('magnet');
        } else if (foodOrb.isDrop) {
            // Player ate another snake's dropped segment
            if (this.isPlayer) {
                audioManager.playSFX('eat_body');
            }
        } else {
            // Standard food
            // if (this.isPlayer) audioManager.playSFX('eat');
        }

        // We don't push a new segment immediately.
        // The `update` loop will naturally leave the tail alone since
        // we don't pop() if length > segments.length. It forces the tail to stretch next frame.
    }

    die() {
        this.alive = false;
        // Convert segments to food logic happens in Game engine
        return this.segments;
    }
}
