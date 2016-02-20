define([
    'phaser',
    'game-sprite',
    'health-powerup',
    'utilities/state-machine'
], function (Phaser, GameSprite, HealthPowerup, StateMachine) { 
    'use strict';

    // Shortcuts
    var game, self;

    function Entity (_game, x, y, key, frame) {

        game = _game;
        self = this;

        // Initialize sprite
        GameSprite.call(this, game, x, y, key, frame);
        this.anchor.set(0.5);

        // Enable physics.
        game.physics.enable(this);
        this.body.collideWorldBounds = true;
        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
        // this.body.setSize(10, 10); // Fit body to the actual artwork.

        // // Initialize public properites.
        // // Fastest possible movement speeds.
        // this.body.maxVelocity.x = 400;
        // this.body.maxVelocity.y = 10000;
        // this.body.drag.x = 0;
        // this.body.drag.y = 0;

        // The acceleration that is applied when moving.
        // this.moveAccel = 16000;
     
        // Initial health.
        this.health = this.maxHealth = 1;
        
        // Line of sight
		this.lineOfSight = new Phaser.Line();
        
        // Invulnerability
        this.invulnerable            = false;
        this.invulnerableTime        = game.time.now;
        this.invulnerabilityDuration = 500;

        // Knockback
        this.knockback         = new Phaser.Point();
        this.knockbackTime     = game.time.now;
        this.knockbackDuration = 500;

        // Signals
        this.events.onHeal   = new Phaser.Signal();
        this.events.onDamage = new Phaser.Signal();
        this.events.onDeath  = new Phaser.Signal();
        this.events.onDrop   = new Phaser.Signal();
        this.events.onSpawnChild = new Phaser.Signal();
        
        // Assets for killing enemy when it goes off screen for a given period
        // of time.
        this.offCameraKillTimer = game.time.create(false);
        this.offCameraKillTimer.start(); 
        
    }


    Entity.prototype = Object.create(GameSprite.prototype);
    Entity.prototype.constructor = Entity;

    Entity.prototype.update = function () {
        
        // Call up!
        GameSprite.prototype.update.call(this);
        
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
    };

    /*
     * Check whether this entity can see a given target.
     */
    Entity.prototype.canSee = function (target) {
        this.lineOfSight.start.x = this.x;
        this.lineOfSight.start.y = this.y;
        this.lineOfSight.end.x = target.x;
        this.lineOfSight.end.y = target.y;
        var tiles = game.collisionLayer.getRayCastTiles(this.lineOfSight, null, true);

        if(tiles.length) return false;
        return true;
    };

    /* 
     * Trigger a temporary period of invulnerability that will wear off after
     * the given amount of time.  If no time is given, a default value will be
     * used.  To change the default value, change the value of invulnerabilityDuration.
     */
    Entity.prototype.makeInvulnerable = function (time) {
        if(!this.invulnerable) {
            this.invulnerable = true;
            this.invulnerableTime = game.time.now + (time || this.invulnerabilityDuration);

            // Visual feedback to show player was hit and is currently invulnerable.
            this.blinkTween = game.add.tween(this);
            this.blinkTween.to({alpha: 0}, 80, null, true, 0, -1, true);
            this.blinkTween.onLoop.add(this.onBlinkLoopCallback, this);
        }
    };

    /*
     * Callback for when the "blink" animation tween completes/loops.  Each time
     * this callback is called, we check to see if the player's invulnerability
     * frame has finished or not.
     */
    Entity.prototype.onBlinkLoopCallback = function (){
        if(game.time.now > this.invulnerableTime) {
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
     * Apply damage to the entity.  In addition to decreasing the entity's health
     * by the given amount, this will apply a brief period of invulnerability 
     * and knockback.  If the entity's health falls to or below 0, the entity
     * will die.
     */
    Entity.prototype.damage = function (amount, source) {

        // Can currently take damage?
        if(this.invulnerable) return;

		if (amount < 0) amount = 0;
        this.health -= amount;
        this.events.onDamage.dispatch(this.health, amount);

        // Temporary invulnerability.
        this.makeInvulnerable();

        // Knockback force
        Phaser.Point.subtract({x: this.position.x, y: this.position.y-20}, source.position, this.knockback);
        Phaser.Point.normalize(this.knockback, this.knockback);
        this.knockback.setMagnitude(500);

        // Zero out current velocity
        this.body.velocity.set(0);

        Phaser.Point.add(this.body.velocity, this.knockback, this.body.velocity);
        this.knockback.set(0);

        // Temporarily disable input after knockback.
        this.knockbackTime = game.time.now + this.knockbackDuration;
        
        if (this.health <= 0) {
            this.handleDeath();
        }
    };
    
    /*
     * Cause the entity to begin dying.  This is different from the "kill" 
     * method in that it does not remove the entity from the world.  Rather, it
     * provides an opportunity to, for example, show a death animation, generate
     * loot drops, etc.
     */ 
    Entity.prototype.handleDeath = function () {
        
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

    Entity.prototype.kill = function () {
        this.dying = false;
        GameSprite.prototype.kill.apply(this, arguments);
    };

    return Entity;

});