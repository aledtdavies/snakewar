export class AudioManager {
    constructor() {
        this.sounds = {};

        // Global volume controls (0.0 to 1.0)
        // You can adjust these here!
        this.sfxVolume = 0.6;
        this.musicVolume = 0.3;

        // Map keys to the exact filenames the user provides
        this.soundPaths = {
            'eat': 'assets/sfx_eat.mp3',
            'eat_snake': 'assets/sfx_eat_snake.mp3',
            'eat_body': 'assets/sfx_eat_body.mp3',
            'star': 'assets/sfx_star.mp3',
            'shield': 'assets/sfx_shield.mp3',
            'magnet': 'assets/sfx_magnet.mp3',
            'game_over': 'assets/sfx_game_over.mp3',
            'level_complete': 'assets/sfx_level_complete.mp3'
        };

        this.musicPaths = {
            'title': 'assets/bgm_title.mp3',
            'game': 'assets/bgm_game.mp3'
        };

        // Pre-load audio elements
        for (const [key, path] of Object.entries(this.soundPaths)) {
            const audio = new Audio(path);
            audio.preload = 'auto';
            this.sounds[key] = audio;
        }
    }

    playSFX(key) {
        const sound = this.sounds[key];
        if (sound) {
            // Clone node to allow overlapping identical sounds (e.g. eating rapidly)
            const clone = sound.cloneNode();
            clone.volume = this.sfxVolume;

            // Play is a promise; we catch errors because browsers block audio before user clicks the page,
            // or if the file doesn't exist yet.
            clone.play().catch(e => {
                // Silently drop errors for missing files or blocked autoplay
            });
        }
    }

    playBGM(key) {
        // We will implement BGM loop logic here later.
    }

    setSFXVolume(vol) {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
    }

    setMusicVolume(vol) {
        this.musicVolume = Math.max(0, Math.min(1, vol));
        // Update any currently playing music loops here in the future
    }
}

// Export a singleton instance that can be used anywhere
export const audioManager = new AudioManager();
