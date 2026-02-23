import { CONFIG } from './constants.js';
import { Food } from './Food.js';
import { audioManager } from './Audio.js';

export function checkCollisions(game) {
    const { snakes, food } = game;

    // 1. Snake vs Food
    for (let i = 0; i < snakes.length; i++) {
        const snake = snakes[i];
        if (!snake.alive) continue;

        for (let j = 0; j < food.length; j++) {
            const f = food[j];
            if (f.markedForDeletion) continue;

            // Shift mouth collision point forward further
            const mouthX = snake.x + Math.cos(snake.angle) * snake.radius * 1.3;
            const mouthY = snake.y + Math.sin(snake.angle) * snake.radius * 1.3;

            const dx = mouthX - f.x;
            const dy = mouthY - f.y;
            const distSq = dx * dx + dy * dy;
            const hitRadius = snake.radius + f.radius;

            // If distance < snake head radius + food radius
            if (distSq < hitRadius * hitRadius) {
                snake.eat(f);
                f.markedForDeletion = true;
            }
        }
    }

    // 2. Snake vs Snake (Combat)
    // To handle head-on collisions fairly, we must evaluate them simultaneously
    const snakesToKill = new Set();

    for (let i = 0; i < snakes.length; i++) {
        const s1 = snakes[i];
        if (!s1.alive) continue;

        for (let j = 0; j < snakes.length; j++) {
            if (i === j) continue;

            const s2 = snakes[j];
            if (!s2.alive) continue;

            // Check Head (s1) vs Head (s2) - shift s1 mouth forward
            const s1MouthX = s1.x + Math.cos(s1.angle) * s1.radius * 1.3;
            const s1MouthY = s1.y + Math.sin(s1.angle) * s1.radius * 1.3;
            const s2MouthX = s2.x + Math.cos(s2.angle) * s2.radius * 1.3;
            const s2MouthY = s2.y + Math.sin(s2.angle) * s2.radius * 1.3;

            const dx = s1MouthX - s2MouthX;
            const dy = s1MouthY - s2MouthY;
            const distSq = dx * dx + dy * dy;
            const hitRadius = s1.radius + s2.radius;

            // Head-on collision
            if (distSq < hitRadius * hitRadius) {
                const s1Super = s1.superTime > 0;
                const s2Super = s2.superTime > 0;
                const s1Shield = s1.shieldTime > 0;
                const s2Shield = s2.shieldTime > 0;

                if (s1Super) {
                    // S1 is super, slices through S2
                    if (!s2Shield) {
                        if (s1.isPlayer && !snakesToKill.has(s2)) { game.playerKills++; s2.killedByPlayer = true; }
                        snakesToKill.add(s2);
                    }
                } else if (s2Super) {
                    // S2 is super, slices through S1
                    if (!s1Shield) {
                        if (s2.isPlayer && !snakesToKill.has(s1)) { game.playerKills++; s1.killedByPlayer = true; }
                        snakesToKill.add(s1);
                    }
                } else if (s1Shield || s2Shield) {
                    // If either is shielded (but not super), they just bounce/pass through (no death)
                    // No action needed, they are protected.
                } else {
                    // Standard length-based resolution (no super, no shield)
                    if (s1.length === s2.length) {
                        snakesToKill.add(s1);
                        snakesToKill.add(s2);
                    } else if (s1.length < s2.length) {
                        if (s2.isPlayer && !snakesToKill.has(s1)) { game.playerKills++; s1.killedByPlayer = true; }
                        snakesToKill.add(s1);
                    } else {
                        if (s1.isPlayer && !snakesToKill.has(s2)) { game.playerKills++; s2.killedByPlayer = true; }
                        snakesToKill.add(s2);
                    }
                }
                // If either is shielded (but not super), they just bounce/pass through (no death)
                continue; // Skip body checks
            }

            // Check Head (s1 mouth) vs Body (s2 segment)
            // Precise forward-facing collision: The segment must be somewhat 'in front' of s1's mouth
            let hitBody = false;
            let hitSegmentIndex = -1;

            const hitS1MouthX = s1.x + Math.cos(s1.angle) * s1.radius * 1.3;
            const hitS1MouthY = s1.y + Math.sin(s1.angle) * s1.radius * 1.3;

            for (let k = 2; k < s2.segments.length; k += 2) {
                const seg = s2.segments[k];
                const sdx = seg.x - hitS1MouthX; // Vector from mouth to segment
                const sdy = seg.y - hitS1MouthY;
                const sdistSq = sdx * sdx + sdy * sdy;
                const hitRadius = s1.radius + CONFIG.BODY_RADIUS;

                if (sdistSq < hitRadius * hitRadius) {
                    // Check if segment is in front of the snake's current face vector
                    const faceAngle = s1.angle;
                    const angleToSeg = Math.atan2(sdy, sdx);
                    let angleDiff = Math.abs(faceAngle - angleToSeg);
                    while (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                    // Only count as a hit if it's roughly in the front 120-degree cone (PI/3 radians either side)
                    if (angleDiff < Math.PI / 2.5) {
                        hitBody = true;
                        hitSegmentIndex = k;
                        break;
                    }
                }
            }

            if (hitBody) {
                const s1Super = s1.superTime > 0;
                const s2Super = s2.superTime > 0;
                const s1Shield = s1.shieldTime > 0;
                const s2Shield = s2.shieldTime > 0;

                // If s1 (head) hits s2's body
                if (s2Super && !s1Super) {
                    // s2 is super, cut s1 down to size! (lose 50% length)
                    if (!s1Shield) {
                        s1.targetLength = Math.max(CONFIG.INITIAL_LENGTH, Math.floor(s1.length / 2));
                        s1.angle += Math.PI; // bounce off safely
                    }
                } else if (!s1Super && s1.length <= s2.length) {
                    // Normal rules: s1 is smaller or equal -> s1 dies
                    if (!s1Shield) {
                        if (s2.isPlayer && !snakesToKill.has(s1)) { game.playerKills++; s1.killedByPlayer = true; }
                        snakesToKill.add(s1);
                    }
                } else {
                    // s1 is larger OR s1 is super -> s1 "bites" s2 in half at hitSegmentIndex
                    // s2 loses segments from hitSegmentIndex to the end
                    if (!s2Shield) {
                        if (hitSegmentIndex > 0 && hitSegmentIndex < s2.segments.length) {
                            const severedSegments = s2.segments.splice(hitSegmentIndex);
                            s2.length = s2.segments.length; // Update s2's length target
                            s2.targetLength = s2.length;

                            // Drop severed segments as food immediately
                            severedSegments.forEach(seg => {
                                const scatterX = (Math.random() - 0.5) * 20;
                                const scatterY = (Math.random() - 0.5) * 20;

                                // Mark the food so we know if it came from the player
                                const droppedFood = new Food(seg.x + scatterX, seg.y + scatterY, 2, true);
                                if (s2.isPlayer) {
                                    droppedFood.fromPlayer = true;
                                }
                                game.food.push(droppedFood);
                            });

                            // Add some immediate score score to the attacking snake (s1)
                            s1.score += severedSegments.length * 2;
                            s1.targetLength += severedSegments.length * 2;
                            s1.length = Math.floor(s1.targetLength);
                        }
                    } else {
                        // S2 has a shield! S1 bounces off harmlessly.
                        s1.angle += Math.PI;
                    }
                }
            }
        }
    }

    // Apply deaths
    let playerKilledSnake = false;

    snakesToKill.forEach(snake => {
        if (snake.killedByPlayer) {
            playerKilledSnake = true;
        }
        game.killSnake(snake);
    });

    // Play the full eaten sound exactly once per collision frame if player successfully killed a snake
    if (playerKilledSnake) {
        audioManager.playSFX('eat_snake', 0.8);
    }
}
