import { Input } from './Input.js';
import { Renderer } from './Renderer.js';
import { HUD } from './HUD.js';
import { Game } from './Game.js';
import { audioManager } from './Audio.js';

document.addEventListener('DOMContentLoaded', () => {

    // UI Elements
    const canvas = document.getElementById('game-canvas');
    const btnPlay = document.getElementById('btn-play');
    const btnPlayAgain = document.getElementById('btn-play-again');
    const btnResume = document.getElementById('btn-resume');
    const btnPauseMobile = document.getElementById('btn-pause-mobile');
    const inputName = document.getElementById('player-name');
    const skinOptions = document.querySelectorAll('.skin-option');

    const globalLeaderboardList = document.getElementById('global-leaderboard-list');
    const btnClearScores = document.getElementById('btn-clear-scores');

    // Audio Sliders
    const sfxSlider = document.getElementById('sfx-volume');
    const musicSlider = document.getElementById('music-volume');

    if (sfxSlider) {
        sfxSlider.addEventListener('input', (e) => audioManager.setSFXVolume(parseFloat(e.target.value)));
    }
    if (musicSlider) {
        musicSlider.addEventListener('input', (e) => audioManager.setMusicVolume(parseFloat(e.target.value)));
    }

    const loadGlobalLeaderboard = () => {
        let scores = [];
        try {
            scores = JSON.parse(localStorage.getItem('snakeWarScores') || '[]');
        } catch (e) {
            console.warn("localStorage is disabled or blocked by iframe:", e);
        }

        globalLeaderboardList.innerHTML = '';
        if (scores.length === 0) {
            globalLeaderboardList.innerHTML = '<li>No scores yet. Play to rank!</li>';
            return;
        }
        scores.slice(0, 5).forEach((s, idx) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="lb-name">${idx + 1}. ${s.name}</span> <span class="lb-score">${Math.floor(s.score)}</span>`;
            if (s.name === inputName.value.trim()) {
                li.style.color = 'var(--glow-cyan)';
            }
            globalLeaderboardList.appendChild(li);
        });
    };

    btnClearScores.addEventListener('click', () => {
        try {
            localStorage.removeItem('snakeWarScores');
        } catch (e) { }
        loadGlobalLeaderboard();
    });

    // Initial load
    loadGlobalLeaderboard();

    // Core Modules
    const input = new Input(canvas);
    const renderer = new Renderer(canvas);
    const hud = new HUD();

    // Initialize Game engine
    const game = new Game(input, renderer, hud);

    // Wire up pause input to game engine
    input.onPauseToggle = () => game.togglePause();

    let selectedSkin = 'neon-cyan';

    // Skin selection logic
    skinOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            // Remove selected class from all
            skinOptions.forEach(opt => opt.classList.remove('selected'));
            // Add to clicked
            e.target.classList.add('selected');
            selectedSkin = e.target.dataset.skin;
        });
    });

    const startGame = () => {
        const playerName = inputName.value.trim() || 'Player';
        hud.hideAllScreens();
        game.start(playerName, selectedSkin);
    };

    // Event Listeners for Play buttons
    btnPlay.addEventListener('click', startGame);
    btnPlayAgain.addEventListener('click', () => {
        loadGlobalLeaderboard(); // Update in case score was saved
        startGame();
    });

    // Resume button from pause screen
    btnResume.addEventListener('click', () => {
        game.togglePause();
    });

    // Mobile pause button
    if (btnPauseMobile) {
        btnPauseMobile.addEventListener('click', () => {
            game.togglePause();
        });
    }

    // Allow pressing Enter in name input to start game
    inputName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startGame();
        }
    });

    // Render loop just for menu background (before game starts)
    const renderMenuBackground = () => {
        if (game.state === 'MENU') {
            renderer.render(game);
            // Spin camera slowly for a nice effect
            game.deadCameraX = (game.deadCameraX || 0) + 1;
            game.deadCameraY = (game.deadCameraY || 0) + 0.5;
            requestAnimationFrame(renderMenuBackground);
        }
    };

    // Init menu background
    game.deadCameraX = 2000;
    game.deadCameraY = 2000;
    renderMenuBackground();
});
