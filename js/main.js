// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOver');
    const levelCompleteScreen = document.getElementById('levelComplete');
    const gameCompleteScreen = document.getElementById('gameComplete');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    const nextLevelButton = document.getElementById('nextLevelButton');
    const completeRestartButton = document.getElementById('completeRestartButton');
    const pauseButton = document.getElementById('pauseButton');
    const restartGameButton = document.getElementById('restartGameButton');
    
    let game;
    
    startButton.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        game = new Game(canvas);
        game.start();
    });
    
    restartButton.addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        game.restartGame();
        game.start();
    });
    
    nextLevelButton.addEventListener('click', () => {
        levelCompleteScreen.classList.add('hidden');
        game.nextLevel();
        game.start();
    });
    
    completeRestartButton.addEventListener('click', () => {
        gameCompleteScreen.classList.add('hidden');
        game.restartGame();
        game.start();
    });
    
    pauseButton.addEventListener('click', () => {
        if (game) {
            game.togglePause();
            pauseButton.textContent = game.paused ? 'Продолжить' : 'Пауза';
        }
    });
    
    restartGameButton.addEventListener('click', () => {
        if (game) {
            game.restartGame();
            if (gameOverScreen.classList.contains('hidden') && 
                levelCompleteScreen.classList.contains('hidden') &&
                gameCompleteScreen.classList.contains('hidden')) {
                game.start();
            } else {
                gameOverScreen.classList.add('hidden');
                levelCompleteScreen.classList.add('hidden');
                gameCompleteScreen.classList.add('hidden');
                game.start();
            }
        } else {
            startScreen.classList.add('hidden');
            game = new Game(canvas);
            game.start();
        }
    });
});