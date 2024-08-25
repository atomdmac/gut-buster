define([
    'phaser',
    'utilities/state-machine'
], function (Phaser, StateMachine) { 
    'use strict';

    // Shortcuts
    var game, self;

    function GameSprite (_game, x, y, key, frame) {

        game = _game;
        self = this;
        
        key = key ? key : 'blank';
        
        // Initialize sprite
        Phaser.Sprite.call(this, game, x, y, key, frame);
        
        this.paused = false;
        
        // Assets for killing enemy when it goes off screen for a given period
        // of time.
        this.offCameraKillTimer = game.time.create(false);
        this.offCameraKillTimer.start(); 
        
    }


    GameSprite.prototype = Object.create(Phaser.Sprite.prototype);
    GameSprite.prototype.constructor = GameSprite;

    GameSprite.prototype.preUpdate = function () {
        if (!this.paused) Phaser.Sprite.prototype.preUpdate.call(this);
    };

    GameSprite.prototype.update = function () {
        if (!this.paused) {
            // Call up!
            Phaser.Sprite.prototype.update.call(this);
            
            if (this.alive) {
                if (!this.inCamera) {
                    // Auto-kill if off camera for too long.
                    this.offCameraKillTimer.add(2000, this.kill, this);
                }
                else {
                    // Cancel auto-kill if returned to the camera.
                    this.offCameraKillTimer.removeAll();
                }
            }
        }
    };

    GameSprite.prototype.postUpdate = function () {
        if (!this.paused) Phaser.Sprite.prototype.postUpdate.call(this);
    };

    GameSprite.prototype.flip = function (direction) {
        if(direction) this.scale.x = direction;
        else this.scale.x *= -1;
    };

    GameSprite.prototype.revive = function (health) {
        // Stop movement to prevent compounding of gravity acceleration.
        if(this.body) {
            this.body.acceleration.set(0);
            this.body.velocity.set(0);
        }
        Phaser.Sprite.prototype.revive.call(this, health);
    };

    GameSprite.prototype.reset = function (x, y, health) {
        // Call up!  Use defaults if values aren't given.
        Phaser.Sprite.prototype.reset.call(this, x||this.x, y||this.y, health||this.maxHealth);
    };

    /* 
     * Trigger a temporary period of invulnerability that will wear off after
     * the given amount of time.  If no time is given, a default value will be
     * used.  To change the default value, change the value of invulnerabilityDuration.
     */
    GameSprite.prototype.blink = function (time) {
        // Visual feedback to show player was hit and is currently invulnerable.
        this.blinkTween = game.add.tween(this);
        this.blinkTween.to({alpha: 0}, 80, null, true, 0, -1, true);
        this.blinkTween.onLoop.add(this.onBlinkLoopCallback);
    };

    /*
     * Callback for when the "blink" animation tween completes/loops.  Each time
     * this callback is called, we check to see if the player's invulnerability
     * frame has finished or not.
     */
    GameSprite.prototype.onBlinkLoopCallback = function (){
        if(game.time.now - this.invulnerableTimer) {
            this.blinkTween.start(0);
            this.blinkTween.pause();
            this.invulnerable = false;
            this.alpha = 1;
            if (!this.alive) {
                this.kill();
            }
        }
    };
    
    /*
     * Cause the GameSprite to begin dying.  This is different from the "kill" 
     * method in that it does not remove the GameSprite from the world.  Rather, it
     * provides an opportunity to, for example, show a death animation, generate
     * loot drops, etc.
     */ 
    GameSprite.prototype.die = function () {
        
        // You may only kill me once.  Sorry.
        if(this.dying) return;

        // Send out the obit
        this.events.onDeath.dispatch(this);

        // ... and now we're in the process of dying.  Weeeeee!
        this.dying = true;

        // Now that we're dying, we don't collide with anything.
        this.body.checkCollision.up = false;
        this.body.checkCollision.down = false;
        this.body.checkCollision.left = false;
        this.body.checkCollision.right = false;

    };

    GameSprite.prototype.kill = function () {
        this.dying = false;
        Phaser.Sprite.prototype.kill.apply(this, arguments);
    };

    return GameSprite;

});