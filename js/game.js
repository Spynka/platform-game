class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.paused = false;
        this.gameOver = false;
        this.levelComplete = false;
        this.gameWon = false;
        
        this.player = new Player(this);
        this.platforms = [];
        this.brooms = [];
        this.beers = [];
        this.steamParticles = [];
        
        this.level = 1;
        this.score = 0;
        this.beerCount = 0;
        this.requiredBeer = 5;
        this.requiredBrooms = 2;
        this.timeLeft = 20;
        this.heat = 0;
        this.maxHeat = 100;
        this.gravity = 0.5;
        
        this.keys = {};
        this.setupInput();
        this.generateLevel();
        
        this.lastTime = 0;
        this.messageTimer = 0;
        this.currentMessage = "";
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    generateLevel() {
        this.platforms = [];
        this.brooms = [];
        this.beers = [];
        this.steamParticles = [];
        
        // Устанавливаем цели в зависимости от уровня
        switch(this.level) {
            case 1:
                this.requiredBrooms = 2;
                this.requiredBeer = 5;
                this.timeLeft = 20;
                break;
            case 2:
                this.requiredBrooms = 3;
                this.requiredBeer = 4;
                this.timeLeft = 20;
                break;
            case 3:
                this.requiredBrooms = 4;
                this.requiredBeer = 3;
                this.timeLeft = 20;
                break;
        }
        
        // Пол
        this.platforms.push({x: 0, y: this.height - 40, width: this.width, height: 40, type: 'ground'});
        
        // Банные лавки (платформы)
        const benchCount = 8;
        const benchPositions = [];
        
        // Создаем хорошо связанные платформы для легкого доступа
        const platformLayout = [
            // Нижний ряд (легкий доступ)
            {x: 100, y: this.height - 120, width: 100},
            {x: 300, y: this.height - 120, width: 100},
            {x: 500, y: this.height - 120, width: 100},
            
            // Средний ряд
            {x: 50, y: this.height - 220, width: 80},
            {x: 200, y: this.height - 220, width: 80},
            {x: 400, y: this.height - 220, width: 80},
            {x: 600, y: this.height - 220, width: 80},
            
            // Верхний ряд
            {x: 150, y: this.height - 320, width: 70},
            {x: 350, y: this.height - 320, width: 70},
            {x: 550, y: this.height - 320, width: 70}
        ];
        
        // Используем только нужное количество платформ
        for (let i = 0; i < Math.min(benchCount, platformLayout.length); i++) {
            const platform = platformLayout[i];
            benchPositions.push({x: platform.x, y: platform.y});
            this.platforms.push({
                x: platform.x, 
                y: platform.y, 
                width: platform.width, 
                height: 15, 
                type: 'bench'
            });
        }
        
        // Веники - размещаем на доступных платформах
        const broomMessages = [
            "Веник собран! Ух, попаримся!",
            "Еще веник! Жарко становится!",
            "Отличный веник! Парься смелее!"
        ];
        
        // Размещаем веники на разных платформах
        const broomPlatforms = [0, 2, 4, 6];
        for (let i = 0; i < this.requiredBrooms + 1; i++) {
            if (i < broomPlatforms.length && broomPlatforms[i] < benchPositions.length) {
                const platform = benchPositions[broomPlatforms[i]];
                this.brooms.push({
                    x: platform.x + 20,
                    y: platform.y - 40,
                    width: 25,
                    height: 40,
                    collected: false,
                    message: broomMessages[i % broomMessages.length]
                });
            }
        }
        
        // Пиво - размещаем на оставшихся платформах
        const beerMessages = [
            "Пиво выпито! Ух, холодное!",
            "Еще пивка! Освежает!",
            "Отлично! Пиво спасает от жара!"
        ];
        
        // Размещаем пиво на разных платформах
        const beerPlatforms = [1, 3, 5, 7];
        for (let i = 0; i < this.requiredBeer + 2; i++) {
            if (i < beerPlatforms.length && beerPlatforms[i] < benchPositions.length) {
                const platform = benchPositions[beerPlatforms[i]];
                this.beers.push({
                    x: platform.x + 30,
                    y: platform.y - 30,
                    width: 18,
                    height: 30,
                    collected: false,
                    message: beerMessages[i % beerMessages.length]
                });
            }
        }
        
        // Добавляем дополнительные предметы если нужно больше чем платформ
        const additionalItems = Math.max(0, (this.requiredBeer + 2) - beerPlatforms.length);
        for (let i = 0; i < additionalItems; i++) {
            const randomPlatform = benchPositions[Math.floor(Math.random() * benchPositions.length)];
            this.beers.push({
                x: randomPlatform.x + 15,
                y: randomPlatform.y - 30,
                width: 18,
                height: 30,
                collected: false,
                message: beerMessages[i % beerMessages.length]
            });
        }
        
        this.player.x = 50;
        this.player.y = this.height - 100;
        this.player.velocityY = 0;
        this.heat = 0;
        this.score = 0;
        this.beerCount = 0;
    }
    
    checkCollisions() {
        // Коллизии с платформами
        this.platforms.forEach(platform => {
            if (this.isColliding(this.player, platform)) {
                const playerBottom = this.player.y + this.player.height;
                const platformTop = platform.y;
                
                if (playerBottom > platformTop && this.player.velocityY > 0) {
                    this.player.y = platformTop - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isOnGround = true;
                }
            }
        });
        
        // Сбор веников
        this.brooms.forEach((broom, index) => {
            if (!broom.collected && this.isColliding(this.player, broom)) {
                broom.collected = true;
                this.score++;
                this.showMessage(broom.message);
                this.updateStats();
            }
        });
        
        // Сбор пива
        this.beers.forEach((beer, index) => {
            if (!beer.collected && this.isColliding(this.player, beer)) {
                beer.collected = true;
                this.beerCount++;
                this.timeLeft += 5;
                this.heat = Math.max(0, this.heat - 10);
                this.showMessage(beer.message);
                this.updateStats();
            }
        });
    }
    
    isColliding(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }
    
    updateSteam() {
        // Умеренная интенсивность пара
        const steamIntensity = this.level * 2 + (1 - this.timeLeft / 20) * 4;
        
        for (let i = 0; i < steamIntensity; i++) {
            if (Math.random() < 0.3) {
                this.steamParticles.push({
                    x: Math.random() * this.width,
                    y: this.height + 10,
                    size: 15 + Math.random() * 30,
                    speed: 1 + Math.random() * 2,
                    opacity: 0.3 + Math.random() * 0.4
                });
            }
        }
        
        // Обновление пара
        this.steamParticles.forEach((particle, index) => {
            particle.y -= particle.speed;
            particle.opacity *= 0.97;
            
            if (particle.opacity < 0.1 || particle.y < -50) {
                this.steamParticles.splice(index, 1);
            }
        });
    }
    
    update(deltaTime) {
        if (this.paused || this.gameOver || this.levelComplete || this.gameWon) return;
        
        const deltaSeconds = deltaTime / 1000;
        
        // Умеренная скорость роста жара
        this.timeLeft -= deltaSeconds;
        const heatMultiplier = 1 + (this.level - 1) * 0.3;
        this.heat += (deltaSeconds * (this.maxHeat / 20)) * heatMultiplier;
        
        // Проверка условий
        if (this.timeLeft <= 0 || this.heat >= this.maxHeat) {
            this.gameOver = true;
            this.showGameOver();
            return;
        }
        
        if (this.score >= this.requiredBrooms && this.beerCount >= this.requiredBeer) {
            if (this.level >= 3) {
                this.gameWon = true;
                this.showGameComplete();
            } else {
                this.levelComplete = true;
                this.showLevelComplete();
            }
            return;
        }
        
        this.player.update(this.keys, this.heat);
        this.player.velocityY += this.gravity;
        this.checkCollisions();
        this.updateSteam();
        this.updateStats();
        
        if (this.messageTimer > 0) {
            this.messageTimer -= deltaSeconds;
        }
    }
    
    showMessage(text) {
        this.currentMessage = text;
        this.messageTimer = 2;
        
        let messageEl = document.querySelector('.message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'message';
            document.querySelector('.game-canvas-container').appendChild(messageEl);
        }
        messageEl.textContent = text;
        
        messageEl.style.animation = 'none';
        setTimeout(() => {
            messageEl.style.animation = 'fadeInOut 2s ease-in-out';
        }, 10);
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBackground();
        this.drawSteam();
        this.platforms.forEach(platform => this.drawPlatform(platform));
        this.brooms.forEach(broom => !broom.collected && this.drawBroom(broom));
        this.beers.forEach(beer => !beer.collected && this.drawBeer(beer));
        this.drawPlayer();
        this.drawUI();
        
        if (this.paused) this.drawPauseScreen();
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#34495e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#8B7355';
        this.ctx.fillRect(0, 0, this.width, 30);
        this.ctx.fillRect(0, 0, 30, this.height);
        this.ctx.fillRect(this.width - 30, 0, 30, this.height);
    }
    
    drawSteam() {
        this.steamParticles.forEach(particle => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawPlatform(platform) {
        if (platform.type === 'ground') {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            this.ctx.fillStyle = '#2E8B57';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 5);
        } else {
            this.ctx.fillStyle = '#A0522D';
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            this.ctx.fillStyle = '#DEB887';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
        }
    }
    
    drawPlayer() {
        const p = this.player;
        const redness = this.heat / this.maxHeat;
        const bodyColor = this.lerpColor('#FFE0B2', '#FF6B6B', redness);
        this.ctx.fillStyle = bodyColor;
        
        this.ctx.fillRect(p.x + 5, p.y, p.width - 10, p.height - 15);
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width/2, p.y - 8, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(p.x, p.y + p.height - 20, p.width, 8);
        
        this.ctx.fillStyle = bodyColor;
        this.ctx.fillRect(p.x - 3, p.y + 10, 5, 25);
        this.ctx.fillRect(p.x + p.width - 2, p.y + 10, 5, 25);
        this.ctx.fillRect(p.x + 8, p.y + p.height - 15, 7, 20);
        this.ctx.fillRect(p.x + p.width - 15, p.y + p.height - 15, 7, 20);
        
        const faceRedness = Math.min(redness * 1.5, 1);
        const faceColor = this.lerpColor('#FFCCBC', '#FF5252', faceRedness);
        this.ctx.fillStyle = faceColor;
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width/2, p.y - 8, 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(p.x + p.width/2 - 4, p.y - 10, 2, 2);
        this.ctx.fillRect(p.x + p.width/2 + 2, p.y - 10, 2, 2);
        this.ctx.fillRect(p.x + p.width/2 - 2, p.y - 6, 4, 1);
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(p.x + p.width/2 - 8, p.y - 20, 16, 6);
    }
    
    drawBroom(broom) {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.moveTo(broom.x + 10, broom.y + 35);
        this.ctx.lineTo(broom.x + 15, broom.y + 35);
        this.ctx.lineTo(broom.x + 14, broom.y);
        this.ctx.lineTo(broom.x + 11, broom.y);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2E8B57';
        this.ctx.beginPath();
        this.ctx.moveTo(broom.x, broom.y + 35);
        this.ctx.lineTo(broom.x + 25, broom.y + 35);
        this.ctx.lineTo(broom.x + 14, broom.y + 5);
        this.ctx.lineTo(broom.x + 11, broom.y + 5);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawBeer(beer) {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(beer.x, beer.y + 8, beer.width, beer.height - 16);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(beer.x + beer.width/2, beer.y + 5, beer.width/2 + 2, 0, Math.PI);
        this.ctx.fill();
    }
    
    drawUI() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 350, 100);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Уровень: ${this.level}`, 20, 30);
        this.ctx.fillText(`Веники: ${this.score}/${this.requiredBrooms}`, 20, 50);
        this.ctx.fillText(`Пиво: ${this.beerCount}/${this.requiredBeer}`, 20, 70);
        this.ctx.fillText(`Время: ${Math.ceil(this.timeLeft)}с`, 20, 90);
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(150, 85, this.heat * 1.5, 12);
        this.ctx.strokeStyle = 'white';
        this.ctx.strokeRect(150, 85, 150, 12);
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('Жар', 110, 95);
    }
    
    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ПАУЗА', this.width / 2, this.height / 2);
        this.ctx.textAlign = 'left';
    }
    
    lerpColor(color1, color2, factor) {
        const hex = color => color.replace('#', '');
        const r1 = parseInt(hex(color1).substr(0, 2), 16);
        const g1 = parseInt(hex(color1).substr(2, 2), 16);
        const b1 = parseInt(hex(color1).substr(4, 2), 16);
        const r2 = parseInt(hex(color2).substr(0, 2), 16);
        const g2 = parseInt(hex(color2).substr(2, 2), 16);
        const b2 = parseInt(hex(color2).substr(4, 2), 16);
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    
    updateStats() {
        document.getElementById('level').textContent = this.level;
        document.getElementById('score').textContent = this.score;
        document.getElementById('beerCount').textContent = this.beerCount;
        document.getElementById('requiredBrooms').textContent = this.requiredBrooms;
        document.getElementById('requiredBeer').textContent = this.requiredBeer;
        document.getElementById('time').textContent = Math.ceil(this.timeLeft);
        document.getElementById('heat').textContent = Math.min(100, Math.floor(this.heat));
    }
    
    showGameOver() {
        document.getElementById('finalBrooms').textContent = this.score;
        document.getElementById('finalBeer').textContent = this.beerCount;
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    showLevelComplete() {
        document.getElementById('levelComplete').classList.remove('hidden');
    }
    
    showGameComplete() {
        document.getElementById('gameComplete').classList.remove('hidden');
    }
    
    nextLevel() {
        this.level++;
        document.getElementById('levelComplete').classList.add('hidden');
        this.generateLevel();
        this.levelComplete = false;
    }
    
    restartGame() {
        this.level = 1;
        this.generateLevel();
        this.gameOver = false;
        this.levelComplete = false;
        this.gameWon = false;
        this.updateStats();
    }
    
    gameLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        this.update(deltaTime);
        this.render();
        
        if (!this.gameOver && !this.levelComplete && !this.gameWon) {
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    
    start() {
        this.gameOver = false;
        this.levelComplete = false;
        this.gameWon = false;
        this.lastTime = 0;
        this.updateStats();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    togglePause() {
        this.paused = !this.paused;
    }
}