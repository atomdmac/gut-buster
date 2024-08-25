define([
    'phaser',
    'health-powerup',
    'utilities/state-machine'
], function (Phaser, HealthPowerup, StateMachine) { 
    'use strict';

    // Shortcuts
    var game, self;

    function EggSac (_game, x, y) {

        game = _game;
        self = this;

        // Initialize sprite
        Phaser.Sprite.call(this, game, x, y, 'egg-sac');
        this.anchor.set(0.5);

        this.animations.add('idle', [0], 10);
        this.animations.add('flying', [1,2,3,4,5,6,7], 15);
        
        // Which way is the dude or dudette facing?
        this.facing = this.parent && this.parent.facing ? this.parent.facing : 'right';

        // Enable physics.
        game.physics.enable(this);
        this.body.collideWorldBounds = true;
        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
        this.body.setSize(10, 10); // Fit body to the actual artwork.

        // Initialize public properites.
        // Fastest possible movement speeds.
        this.body.maxVelocity.x = 400;
        this.body.maxVelocity.y = 10000;
        this.body.drag.x = 0;
        this.body.drag.y = 0;

        // The acceleration that is applied when moving.
        this.moveAccel = 16000;
     
        // Initial health.
        this.health = this.maxHealth = 1;
        this.fireVelocity = {x: 300, y: 200};

        // Invulnerability
        this.invulnerable = false;
        this.invulnerableTimer = 0;

        // Knockback
        this.knockback = new Phaser.Point();
        this.knockbackTimeout = game.time.now;

        // Signals
        this.events.onHeal = new Phaser.Signal();
        this.events.onDamage = new Phaser.Signal();
        this.events.onDeath = new Phaser.Signal();
        this.events.onDrop = new Phaser.Signal();
        
        // State machine for managing behavior states.
        StateMachine.extend(this);
        this.stateMachine.states = {
            'idle': {
                'update': this.update_idle
            },
            'flying': {
                'update': this.update_flying
            }
        };
        // Spawn in idle state.
        this.stateMachine.setState('idle');
        
        // Assets for killing enemy when it goes off screen for a given period
        // of time.
        this.offCameraKillTimer = game.time.create(false);
        this.offCameraKillTimer.start(); 
        
    }

    function onBlinkLoop (){
        if(game.time.now - this.invulnerableTimer > 500) {
            this.blinkTween.start(0);
            this.blinkTween.pause();
            this.invulnerable = false;
            this.alpha = 1;
            if (!this.alive) {
                this.kill();
            }
        }
    }

    EggSac.prototype = Object.create(Phaser.Sprite.prototype);
    EggSac.prototype.constructor = EggSac;

    EggSac.prototype.update = function () {

        // Apply behaviors.
        if(this.alive && !this.dying && !this.invulnerable) {
            this.stateMachine.handle('update');
        }

        // Update direction
        if (this.facing === 'right') {
            this.scale.x = 1; //facing default direction
        }
        else {
            this.scale.x = -1; //flipped
        }
        
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
    };
    
    EggSac.prototype.update_idle = function () {
        // Temporarily disable input after knockback.
        if(this.knockbackTimeout > game.time.now) return;
        
        this.animations.play('idle');
        
        this.body.velocity.x = 0;
    };

    EggSac.prototype.update_flying = function () {
        // Temporarily disable input after knockback.
        if(this.knockbackTimeout > game.time.now) return;
        
        this.animations.play('flying');
        
        // TODO: If the egg sac hits the ground, switch to idle state.
        if (this.body.blocked.down) {
            this.stateMachine.setState('idle');
        }
    };

    EggSac.prototype.fire = function (direction) {
        this.facing = direction;
        
        if (this.facing === 'left') {
            this.body.velocity.x = -this.fireVelocity.x;
        }
        else {
            this.body.velocity.x = this.fireVelocity.x;
        }
        this.body.velocity.y = -this.fireVelocity.y;
        
        this.stateMachine.setState('flying');
    };

    EggSac.prototype.reset = function (x, y, health) {
        // Call up!
        Phaser.Sprite.prototype.reset.call(this, x||this.x, y||this.y, health||this.maxHealth);
        
        this.stateMachine.setState('idle');
        
        this.body.checkCollision.up = true;
        this.body.checkCollision.down = true;
        this.body.checkCollision.left = true;
        this.body.checkCollision.right = true;
    };

    EggSac.prototype.damage = function (amount, source) {

        // Can currently take damage?
        if(this.invulnerable) return;

        amount = Math.abs(amount || 1);
        this.health -= amount;
        this.events.onDamage.dispatch(this.health, amount);

        // Temporary invulnerability.
        this.invulnerable = true;
        this.invulnerableTimer = game.time.now;
        
        // Visual feedback to show player was hit and is currently invulnerable.
        this.blinkTween = game.add.tween(this);
        this.blinkTween.to({alpha: 0}, 80, null, true, 0, -1, true);
        this.blinkTween.onLoop.add(onBlinkLoop, this);

        // Knockback force
        Phaser.Point.subtract({x: this.position.x, y: this.position.y-20}, source.position, this.knockback);
        Phaser.Point.normalize(this.knockback, this.knockback);
        this.knockback.setMagnitude(500);

        // Zero out current velocity
        this.body.velocity.set(0);

        Phaser.Point.add(this.body.velocity, this.knockback, this.body.velocity);
        this.knockback.set(0);

        // Temporarily disable input after knockback.
        this.knockbackTimeout = game.time.now + 500;
        
        if (this.health <= 0) {
            this.handleDeath();
        }
    };
    
    EggSac.prototype.handleDeath = function () {
        this.events.onDeath.dispatch(this);

        this.body.checkCollision.up = false;
        this.body.checkCollision.down = false;
        this.body.checkCollision.left = false;
        this.body.checkCollision.right = false;

    };

    EggSac.prototype.kill = function () {
        this.dying = false;
        Phaser.Sprite.prototype.kill.apply(this, arguments);
    };

    return EggSac;

});