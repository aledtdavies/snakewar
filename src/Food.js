import { CONFIG } from './constants.js';

export class Food {
    constructor(x, y, value = CONFIG.FOOD_VALUE, isDrop = false) {
        this.x = x;
        this.y = y;
        this.value = value;
        // Dropped food on death is larger/more valuable
        this.isDrop = isDrop;

        // Visual radius
        this.radius = isDrop ? 8 + Math.random() * 4 : 4 + Math.random() * 3;

        // Pick random neon color
        this.color = CONFIG.COLORS.FOOD[Math.floor(Math.random() * CONFIG.COLORS.FOOD.length)];

        // Gentle floating animation offset
        this.spawnTime = performance.now();
        this.floatOffset = Math.random() * Math.PI * 2;

        // Optional lifespan
        this.life = isDrop ? 300 : 600; // seconds before despawn
        this.markedForDeletion = false;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.markedForDeletion = true;
        }
    }
}

export class Star extends Food {
    constructor(x, y) {
        super(x, y, 5, false); // value = 5
        this.isStar = true;
        this.radius = 20;
        this.color = '#ffff00'; // Gold/Yellow
        this.life = 200; // Depawns faster
    }
}

export class Shield extends Food {
    constructor(x, y) {
        super(x, y, 5, false);
        this.isShield = true;
        this.radius = 20;
        this.color = '#00f0ff'; // Cyan
        this.life = 200;
    }
}

export class Magnet extends Food {
    constructor(x, y) {
        super(x, y, 5, false);
        this.isMagnet = true;
        this.radius = 20;
        this.color = '#ff00aa'; // Magenta
        this.life = 200;
    }
}
