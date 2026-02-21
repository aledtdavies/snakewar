import { CONFIG } from './constants.js';

export class AI {
    constructor(snake, level = 1) {
        this.snake = snake;
        this.state = 'ROAM'; // ROAM, SEEK_FOOD, ATTACK, FLEE
        this.target = null;
        this.timer = 0;

        // AI configuration parameters (Dynamic Difficulty)
        this.visionRadius = 400 + ((level - 1) * 200);             // How far bot can see scales infinitely
        this.reactionDelay = Math.max(0.05, 0.2 - (level * 0.02)); // Reaction time gets faster
        this.aggression = Math.min(0.95, 0.5 + (level * 0.08));    // Likelihood to attack scales up

        // Scale snake's physical turning ability by level
        this.snake.turnSpeed = CONFIG.TURN_SPEED + ((level - 1) * 0.5);
    }

    update(dt, game, snakes, foods) {
        if (!this.snake.alive) return;

        this.timer -= dt;
        if (this.timer <= 0) {
            // Evaluate surroundings and pick a state based on priority
            this._decideStrategy(snakes, foods);
            this.timer = this.reactionDelay + (Math.random() * 0.1); // Add jitter to avoid synchronized bot frame spikes
        }

        // Execute current state
        let desiredAngle = this.snake.angle;

        switch (this.state) {
            case 'ROAM':
                desiredAngle = this._doRoam(dt);
                break;
            case 'SEEK_FOOD':
                desiredAngle = this._doSeek(this.target);
                break;
            case 'FLEE':
                desiredAngle = this._doFlee(this.target);
                // Bots boost when fleeing
                this.snake.isBoosting = true;
                break;
            case 'ATTACK':
                desiredAngle = this._doAttack(this.target);
                // Bots occasionally boost when attacking
                this.snake.isBoosting = Math.random() > 0.5;
                break;
        }

        // Arena bounds avoidance (override normal AI if hitting wall)
        const margin = 150;
        const { x, y } = this.snake;

        let wallAvoidAngle = null;
        if (x < margin) wallAvoidAngle = 0; // Turn right
        else if (x > CONFIG.ARENA_SIZE - margin) wallAvoidAngle = Math.PI; // Turn left
        else if (y < margin) wallAvoidAngle = Math.PI / 2; // Turn down
        else if (y > CONFIG.ARENA_SIZE - margin) wallAvoidAngle = -Math.PI / 2; // Turn up

        if (wallAvoidAngle !== null) {
            // Blend wall avoidance into current desire
            desiredAngle = wallAvoidAngle;
        }

        // Disable boost if no longer fleeing/attacking
        if (this.state === 'ROAM' || this.state === 'SEEK_FOOD') {
            this.snake.isBoosting = false;
        }

        // Apply inputs to snake
        this.snake.update(dt, desiredAngle, this.snake.isBoosting);
    }

    _decideStrategy(snakes, foods) {
        // 1. Check for immediate threats (larger snakes nearby)
        let nearestThreat = null;
        let minThreatDist = Infinity;

        // 2. Check for prey (smaller snakes nearby)
        let nearestPrey = null;
        let minPreyDist = Infinity;

        for (const other of snakes) {
            if (other === this.snake || !other.alive) continue;

            const dx = other.x - this.snake.x;
            const dy = other.y - this.snake.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.visionRadius) {
                if (other.length > this.snake.length + 5) {
                    // Threat
                    if (dist < minThreatDist) {
                        minThreatDist = dist;
                        nearestThreat = other;
                    }
                } else if (this.snake.length > other.length + 5) {
                    // Prey
                    if (dist < minPreyDist) {
                        minPreyDist = dist;
                        nearestPrey = other;
                    }
                }
            }
        }

        if (nearestThreat && minThreatDist < this.visionRadius * 0.7) {
            this.state = 'FLEE';
            this.target = nearestThreat;
            return;
        }

        if (nearestPrey && Math.random() < this.aggression) {
            this.state = 'ATTACK';
            this.target = nearestPrey;
            return;
        }

        // 3. Find food
        let nearestFood = null;
        let minFoodDist = Infinity;

        for (const f of foods) {
            const dx = f.x - this.snake.x;
            const dy = f.y - this.snake.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.visionRadius && dist < minFoodDist) {
                minFoodDist = dist;
                nearestFood = f;
            }
        }

        if (nearestFood) {
            this.state = 'SEEK_FOOD';
            this.target = nearestFood;
        } else {
            // 4. Roam aimlessly
            this.state = 'ROAM';
            this.target = null;
        }
    }

    _doRoam(dt) {
        // Gradually shift wandering angle
        const wanderJitter = 0.5 * dt;
        return this.snake.angle + (Math.random() * wanderJitter * 2 - wanderJitter);
    }

    _doSeek(target) {
        if (!target || target.markedForDeletion) return this._doRoam(0);
        return Math.atan2(target.y - this.snake.y, target.x - this.snake.x);
    }

    _doFlee(threat) {
        if (!threat || !threat.alive) return this._doRoam(0);
        // Run in the exact opposite direction of the threat
        const angleToThreat = Math.atan2(threat.y - this.snake.y, threat.x - this.snake.x);
        return angleToThreat + Math.PI;
    }

    _doAttack(prey) {
        if (!prey || !prey.alive) return this._doRoam(0);
        // Predict intercept trajectory based on prey's movement vector (basic pursuit)
        const leadX = prey.x + Math.cos(prey.angle) * prey.speed;
        const leadY = prey.y + Math.sin(prey.angle) * prey.speed;
        return Math.atan2(leadY - this.snake.y, leadX - this.snake.x);
    }
}
