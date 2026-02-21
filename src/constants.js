// Game constants and configuration
export const CONFIG = {
    // Arena
    ARENA_SIZE: 4000,          // Width and height of the square arena
    GRID_SIZE: 100,            // Size of background grid cells

    // Game Loop
    TARGET_FPS: 60,

    // Player & Snake Physics
    BASE_SPEED: 180,           // Pixels per second
    BOOST_SPEED_MULT: 2.2,     // Speed multiplier when boosting
    TURN_SPEED: Math.PI * 1.5, // Radians per second maximum turn rate

    // Sizing
    HEAD_RADIUS: 12,
    BODY_RADIUS: 10,
    SEGMENT_SPACING: 8,        // Distance between segment centers

    // Growth & Food
    INITIAL_LENGTH: 20,
    FOOD_VALUE: 1,             // Growth per standard food orb
    GROWTH_SCALE: 0.075,       // How much radius increases per unit of length

    // Economy / Boost
    BOOST_COST_RATE: 2.5,      // Length lost per second while boosting
    MIN_BOOST_LENGTH: 25,      // Cannot boost if smaller than this

    // Entities
    MAX_FOOD_ORBS: 400,
    BOT_COUNT: 25,
    MAX_STARS: 2,
    MAX_SHIELDS: 3,
    MAX_MAGNETS: 3,

    // Powerups
    STAR_DURATION: 10,         // seconds
    SHIELD_DURATION: 10,       // seconds
    MAGNET_DURATION: 12,       // seconds
    MAGNET_RANGE: 250,         // pixel radius for attracting food

    // Visuals
    COLORS: {
        BACKGROUND: '#05050f',
        ARENA_BG: '#0a0a1a',
        GRID: 'rgba(30, 30, 60, 0.4)',
        ARENA_BORDER: 'rgba(255, 0, 100, 0.6)',
        FOOD: ['#00f0ff', '#39ff14', '#ffaa00', '#ff00aa', '#ffff00']
    },

    // Skins map
    SKINS: {
        'neon-cyan': { head: '#ffffff', body1: '#00f0ff', body2: '#0055ff' },
        'neon-magenta': { head: '#ffffff', body1: '#ff00aa', body2: '#aa00ff' },
        'toxic-green': { head: '#ffffff', body1: '#39ff14', body2: '#00aa00' },
        'solar-flare': { head: '#ffffff', body1: '#ffaa00', body2: '#ff0000' }
    }
};
