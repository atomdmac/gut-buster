define([
    'phaser',
    'entity',
    'health-powerup',
    'food-powerup',
    'utilities/state-machine'
], function (Phaser, Entity, HealthPowerup, FoodPowerup, StateMachine) { 
    'use strict';

    // Shortcuts
    var game, self, sightLine;

    function Cthulbat (_game, x, y) {

        game = _game;
        self = this;

        // Initialize sprite
        Entity.call(this, game, x, y, 'enemy');

        // Set up physics.
        this.body.checkCollision.up = false;
        this.body.checkCollision.down = false;
        this.body.checkCollision.left = false;
        this.body.checkCollision.right = false;

        // Initialize public properites.
        // Fastest possible movement speeds.
        this.body.maxVelocity.x = 150;
        this.body.maxVelocity.y = 150;
        this.body.drag.x = 500;
        this.body.drag.y = 500;

        // The acceleration that is applied when moving.
        this.moveAccel = 500;

        // Initial jump speed
        this.jumpSpeed = 500;
     
        // Initial health.
        this.health = this.maxHealth = 2;

        // AI
        this.distanceToTarget = new Phaser.Point();
        this.swoopTween = null;
        this.huntTarget = game.player;

        // AI Config
        this.distanceToHunting = 300;
        this.distanceToAttacking = 128;
        
        // State machine for managing behavior states.
        StateMachine.extend(this);
        this.stateMachine.states = {
            'idle': {
                'update': this.update_idle
            },
            'hunting': {
                'update': this.update_hunting
            },
            'attacking': { 
                'update': this.update_attacking
            },
            'swoop': { 
                'update': this.update_swooping
            },
            'retreat': {
                'update': this.update_retreat
            }
        };

        // Spawn in idle state.
        this.stateMachine.setState('idle');
        
        // Assets for killing enemy when it goes off screen for a given period
        // of time.
        this.offCameraKillTimer = game.time.create(false);
        this.offCameraKillTimer.start(); 
        
    }

    Cthulbat.prototype = Object.create(Entity.prototype);
    Cthulbat.prototype.constructor = Cthulbat;

    Cthulbat.prototype.update = function () {
        
        // Calculate distance between enemy and player.
        Phaser.Point.subtract(this.huntTarget.position, this.position, this.distanceToTarget);
        
        // Don't move unless acceleration is actively applied.
        this.stopMoving();

        // Apply behaviors.
        if(this.alive && !this.dying && !this.invulnerable) {
            this.stateMachine.handle('update');
        }
        
        // Call up!
        Entity.prototype.update.call(this);
    };
    
    Cthulbat.prototype.update_idle = function () {

        // If distance to player is <400, continue.
        Phaser.Point.subtract(this.huntTarget.position, this.position, this.distanceToTarget);
        if(this.distanceToTarget.getMagnitude() < this.distanceToHunting && !this.invulnerable) {
            this.stateMachine.setState('hunting');
        }
    };

    
    Cthulbat.prototype.update_hunting = function () {
        
        // Move to the enemy or where the player was last seen.
        if(this.distanceToTarget.x > 8) {
            this.moveRight();
        } 

        else if(this.distanceToTarget.x < -8) {
            this.moveLeft();
        } 

        if(this.distanceToTarget.getMagnitude() < this.distanceToAttacking) {
            this.stateMachine.setState('attacking');
        }
    };

    Cthulbat.prototype.update_attacking = function () {
        
        // Swoop!
        this.body.moves = false;
        
        if(!this.swoopTween) {
            this.swoopTween = this.game.add.tween(this);
            this.swoopTween.to({
                //x: this.huntTarget.x + (this.scale.x*(this.distanceToAttacking/2)),
                //y: this.huntTarget.y
                x: [this.x, this.huntTarget.x, this.huntTarget.x, this.x+(this.scale.x*200)],
                y: [this.y, this.huntTarget.y+20, this.huntTarget.y+20, this.y-20]
            }, 1000, Phaser.Easing.Quadratic.Out, true)
            .interpolation(Phaser.Math.bezierInterpolation)
            .onComplete.add(this.onSwoopComplete, this);
        }
        this.stateMachine.setState('swoop');
    };
    
    Cthulbat.prototype.onSwoopComplete = function () {
        this.stopSwoop();
        this.stateMachine.setState('retreat');
    };

    Cthulbat.prototype.update_swooping = function () {
        // If enemy dies while swooping, abort the swoop.
        if(this.dying && this.swoopTween && this.swoopTween.isRunning)  {
             this.stopSwoop();
        }
        if(this.invulnerable) {
            this.stopSwoop();
            this.stateMachine.setState('idle');
        }
    };

    Cthulbat.prototype.update_retreat = function() {
        // If hit while retreating, go into the idle state.
        if(this.invulnerable) this.stateMachine.setState('idle');

        Phaser.Point.subtract(this.huntTarget.position, this.position, this.distanceToTarget);
        if(this.distanceToTarget.getMagnitude() < this.distanceToAttacking) {
            // Move to the enemy or where the player was last seen.
            if(this.distanceToTarget.x >= 8) {
                this.moveRight();
                Phaser.Point.negative(this.body.acceleration, this.body.acceleration);
                if(this.body.acceleration.y > 0) this.body.acceleration.y *= -1;
            } 
    
            else if(this.distanceToTarget.x <= -8) {
                this.moveLeft();
                Phaser.Point.negative(this.body.acceleration, this.body.acceleration);
                if(this.body.acceleration.y > 0) this.body.acceleration.y *= -1;
            }
        } else {
            this.stateMachine.setState('hunting');
        }
    };

    Cthulbat.prototype.shouldAttack = function () {
        // If the player is visible and within attack range.
        if(this.distanceToTarget.getMagnitude() < this.distanceToAttacking) return true;
    
        // ...else don't attack.
        return false;
    };

    Cthulbat.prototype.stopSwoop = function () {
        // If swoop is in progress, cancel it.
        if(this.swoopTween) {        
            this.swoopTween.stop();
            this.swoopTween = null;
            this.body.moves = true;
            this.stopMoving();
            this.body.velocity.set(0);
            this.stateMachine.setState('idle');
        }
    };

    Cthulbat.prototype.damage = function (amount, source) {
        // Cancel the rest of the swoop.
        this.onSwoopComplete();

        // Call up to super class.
        Entity.prototype.damage.call(this, amount, source);
    };
    

    Cthulbat.prototype.revive = function () {
        // Call up!
        Entity.prototype.revive.call(this, this.maxHealth);
        
        // Zero out all movement.
        this.body.acceleration.set(0);
        this.body.velocity.set(0);

        // Reset physics settings for this body.
        this.body.drag.set(500);
        this.body.maxVelocity.set(150);
        
        // Restore flight.
        this.body.allowGravity = false;

        // Always start in the "idle" state.
        this.stateMachine.setState('idle');
    };

    Cthulbat.prototype.moveLeft = function () {
        // Temporarily disable input after knockback.
        if(this.knockbackTime > game.time.now) return;

        this.body.acceleration.set(0);
        game.physics.arcade.accelerateToObject(this, game.player, this.moveAccel, this.body.maxVelocity.x, this.body.maxVelocity.y);
        this.flip(-1);
    };

    Cthulbat.prototype.moveRight = function () {
        // Temporarily disable input after knockback.
        if(this.knockbackTime > game.time.now) return;
        
        this.body.acceleration.set(0);
        game.physics.arcade.accelerateToObject(this, game.player, this.moveAccel, this.body.maxVelocity.x, this.body.maxVelocity.y);
        this.flip(1);
    };

    Cthulbat.prototype.stopMoving = function () {
        this.body.acceleration.set(0);
    };
    
    Cthulbat.prototype.handleDeath = function () {

        // Drop loot.
        if (Math.random() < 0.10) {
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

        // If in the process of swooping, stop it.
        this.stopSwoop();

        // Modify drag and max velocity to allow enemy to fall while dying.
        this.body.drag.y = 0;
        this.body.maxVelocity.y = 500;
        
        // Stop trying to fly.
        this.body.allowGravity = true;

        Entity.prototype.handleDeath.call(this);

    };

    return Cthulbat;

});