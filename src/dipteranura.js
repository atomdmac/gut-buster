define([
    'phaser',
    'entity',
    'health-powerup',
    'food-powerup',
    'worm',
    'utilities/state-machine'
], function (Phaser, Entity, HealthPowerup, FoodPowerup, Worm, StateMachine) { 
    'use strict';

    // Shortcuts
    var game, self;

    function Dipteranura (_game, x, y) {

        game = _game;
        self = this;

        // Initialize sprite
        Entity.call(this, game, x, y, 'dipteranura');

        this.animations.add('idle', [0], 10);
        this.animations.add('hopping', [1,2,3,4,5,6,7], 10);
        this.animations.add('vomiting', [8,9,8,9,8,9,9,10,11,12], 10);
        
        // Which way is the dude or dudette facing?
        this.facing = 'right';

        // Initialize public properites.
        // Fastest possible movement speeds.
        this.body.maxVelocity.x = 100;
        this.body.maxVelocity.y = 10000;
        this.body.drag.x = 800;
        this.body.drag.y = 0;

        // The acceleration that is applied when moving.
        this.moveAccel = 16000;
     
        // Initial health.
        this.health = this.maxHealth = 3;

        // AI
        this.canVomit = true;
        this.restDuration = 1000;
        this.restFulfilledTime = game.time.now;
        this.vomitRange = 175;
        
        // Missiles
        this.missiles = game.add.group();
        this.missiles.x = 0;
        this.missiles.y = 0;
        this.missiles.classType = Worm;
        this.missileVelocity = [{x: 350, y: 220},
                                {x: 300, y: 200},
                                {x: 250, y: 180}];
        
        // State machine for managing behavior states.
        StateMachine.extend(this);
        this.stateMachine.onStateChange.add(this.onSelfChangeState);
        this.stateMachine.states = {
            'idle': {
                'update': this.update_idle
            },
            'hopping': {
                'update': this.update_hopping
            },
            'vomiting': { 
                'update': this.update_vomiting
            }
        };
        // Spawn in idle state.
        this.stateMachine.setState('idle');
        
    }

    Dipteranura.prototype = Object.create(Entity.prototype);
    Dipteranura.prototype.constructor = Dipteranura;

    Dipteranura.prototype.update = function () {
        
        // Don't move unless acceleration is actively applied.
        this.stopMoving();

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
        Entity.prototype.update.call(this);
    };
    
    /*
     * For whatever reason, variables adjusted on 'self' in this event handler
     * can't be referenced from 'this' in other areas of the class. Probably
     * some sort of weird scoping issue. As a workaround, you can read these
     * properties from 'self' elsewhere, which seems to work fine. Thoughts?
     */
    Dipteranura.prototype.onSelfChangeState = function (sm, stateName) {
        if (stateName === 'idle') {
            self.restFulfilledTime = game.time.now + self.restDuration;
        }
    };
    
    Dipteranura.prototype.update_idle = function () {
        
        this.animations.play('idle');
        
        // Honor resting when idle.
        if(self.restFulfilledTime > game.time.now) return; // Use 'self' here as workaround to event handler scoping issue.
        
        // Hop til you vomit!
        if (this.shouldVomit()) {
            // Reset flags.
            this.canVomit = true;
            
            this.stateMachine.setState('vomiting');
        }
        else {
            this.stateMachine.setState('hopping');
        }
    };

    Dipteranura.prototype.update_hopping = function () {
        // Temporarily disable input after knockback.
        // if(this.knockbackTimeout > game.time.now) return;
        
        this.animations.play('hopping');
        
        if (this.body.blocked.left) {
            this.facing = 'right';
        }
        if (this.body.blocked.right) {
            this.facing = 'left';
        }
        
        if (this.facing === 'left') {
            this.body.acceleration.x = -this.moveAccel;
        }
        else {
            this.body.acceleration.x = this.moveAccel;
        }
        
        if (this.animations.frame === 6) {
            this.body.acceleration.x = 0;
            this.body.velocity.x = 0;
            this.stateMachine.setState('idle');
        }
    };

    Dipteranura.prototype.update_vomiting = function () {
        // Temporarily disable input after knockback.
        // if(this.knockbackTimeout > game.time.now) return;
        
        this.animations.play('vomiting');
        
        if (this.animations.frame === 10) {
            this.vomit();
        }
        if (this.animations.frame === 12) {
            this.stateMachine.setState('idle');
        }
    };

    Dipteranura.prototype.vomit = function () {
        if (this.canVomit) {
            var missile;
            
            game.world.bringToTop(this.missiles);
            for (var lcv = 0; lcv < this.missileVelocity.length; lcv++) {
                missile = this.missiles.getFirstDead(true, this.x, this.y);
                missile.revive(null, 'flying');
                missile.x = this.x;
                missile.y = this.y;
                missile.facing = this.facing;
                
                if (this.facing === 'left') {
                    missile.body.velocity.x = -this.missileVelocity[lcv].x;
                }
                else {
                    missile.body.velocity.x = this.missileVelocity[lcv].x;
                }
                missile.body.velocity.y = -this.missileVelocity[lcv].y;
                
                this.events.onSpawnChild.dispatch(this, missile);
            }
            
            this.canVomit = false;
        }
    };
    
    Dipteranura.prototype.shouldVomit = function () {
        return this.canSee(game.player) &&
               this.isFacingPlayer() &&
               Math.abs(game.player.position.x - this.position.x) <= this.vomitRange;
    };

    Dipteranura.prototype.isFacingPlayer = function () {
        if (game.player.position.x - this.position.x <= 0 && this.facing === 'left' ||
            game.player.position.x - this.position.x >= 0 && this.facing === 'right') {
            return true;
        }
        return false;
    };

    Dipteranura.prototype.facePlayer = function () {
        if (!this.isFacingPlayer()) {
            if (this.facing === 'right') {
                this.facing = 'left';
            }
            else {
                this.facing = 'right';
            }
        }
    };

    Dipteranura.prototype.revive = function () {
        // Call up!
        Entity.prototype.revive.call(this, this.maxHealth);
        
        this.body.checkCollision.up = true;
        this.body.checkCollision.down = true;
        this.body.checkCollision.left = true;
        this.body.checkCollision.right = true;
        
        this.stateMachine.setState('idle');
        this.facePlayer();
    };

    Dipteranura.prototype.stopMoving = function () {
        this.body.acceleration.set(0);
    };
    
    Dipteranura.prototype.handleDeath = function () {
        // Drop loot.
        if (Math.random() < 0.1) {
            this.events.onDrop.dispatch(
                this, 
                new HealthPowerup(game, this.x, this.y-this.height)
            );
        }

        else if(Math.random() < 0.5) {
            this.events.onDrop.dispatch(
                this, 
                new FoodPowerup(game, this.x, this.y-this.height)
            );
        }

        this.body.checkCollision.up = false;
        this.body.checkCollision.down = false;
        this.body.checkCollision.left = false;
        this.body.checkCollision.right = false;

        Entity.prototype.handleDeath.apply(this);
    };

    return Dipteranura;

});