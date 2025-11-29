class Player {
    constructor(game) {
        this.game = game;
        this.width = 30;
        this.height = 50;
        this.x = 50;
        this.y = game.height - 100;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.jumpForce = -12;
        this.isOnGround = false;
    }
    
    update(keys, heat) {
        this.velocityX = 0;
        
        const speedMultiplier = Math.max(0.5, 1 - (heat / 200));
        
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.velocityX = -this.speed * speedMultiplier;
        }
        
        if (keys['ArrowRight'] || keys['KeyD']) {
            this.velocityX = this.speed * speedMultiplier;
        }
        
        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && this.isOnGround) {
            this.velocityY = this.jumpForce * speedMultiplier;
            this.isOnGround = false;
        }
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;
        
        this.isOnGround = false;
    }
}