define([
    'phaser',
    'entity',
    'health-powerup',
    'food-powerup',
    'utilities/state-machine',
    'behaviors/pacer'
], function (Phaser, Entity, HealthPowerup, FoodPowerup, StateMachine, Pacer) { 
    'use strict';

    // Shortcuts
    var game, self;

    function Worm (_game, x, y, state) {
        game = _game;
        self = this;

        // Initialize sprite
        Entity.call(this, game, x, y, 'velma-worm');
        
        this.animations.add('walk', [0,1,2,3,4,5], 5);
       // this.animations.add('attack', [6,7,8], 5);
        this.animations.add('flying', [9,10,11,12], 5);

        this.bodyFrameData = [
            [46,4,1,19],
            [23,16,20,7],
            [26,3,17,20],
            [26,3,17,20],
            [23,16,20,7],
            [46,4,1,19],
            [],
            [],
            [],
            [17,13,16,5],
            [13,17,17,3],
            [17,13,14,5],
            [13,17,15,3]
        ];
        
        // State machine for managing behavior states.
        StateMachine.extend(this);
        this.stateMachine.onStateChange.add(this.onSelfChangeState, this);
        this.stateMachine.states = {
            'flying': {
                'update': this.update_flying
            },
            'walking': {
                'update': this.update_walking
            }
        };
        // Spawn in idle state.
        this.stateMachine.setState('walking');
        
        // Which way is the dude or dudette facing?
        this.facing = 'right';

        // Initialize public properites.
        // Fastest possible movement speeds.
        this.body.maxVelocity.x = 500;
        this.body.maxVelocity.y = 10000;
        this.body.drag.x = 800;
        this.body.drag.y = 0;
        
        // Initial health.
        this.health = this.maxHealth = 1;
        
        // The horizontal acceleration that is applied when moving.
        this.moveAccel = 700;
    }

    Worm.prototype = Object.create(Entity.prototype);
    Worm.prototype.constructor = Worm;

    Worm.prototype.update = function () {
    
        // Adjust body to match animation frame.
        var bfd = this.bodyFrameData[this.animations.frame];
        this.body.setSize(bfd[0],
                          bfd[1],
                          bfd[2]*this.anchor.x*this.scale,
                          bfd[3]*this.anchor.y);

        // Don't continue to accelerate unless force is applied.
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
    
    Worm.prototype.onSelfChangeState = function (sm, stateName) {
        if (stateName === 'flying') {
            this.animations.play('flying', null, true);
            this.body.drag.x = 100;
        }
        else if (stateName === 'walking') {
            this.body.drag.x = 800;
        }
    };
    
    Worm.prototype.update_flying = function () {
        if (this.body.blocked.down) {
            this.stateMachine.setState('walking');
        }
    };
    
    Worm.prototype.update_walking = function () {
        // Play animation.
        this.animations.play('walk');
        
		// Face away from any walls touched.
        if(this.body.onWall()) {
            if (this.body.blocked.left) {
                this.facing = 'right';
            }
            // Face normally.
            else {
                this.facing = 'left';
            }
        }
        
        // Accelerate on certain frame of animation.
        if (this.animations.frame === 4) {
            this.body.acceleration.x = this.moveAccel * this.scale.x;
        }
    };

    Worm.prototype.revive = function (health, state) {
        // Call up!
        Entity.prototype.revive.call(this, health);
        
        state = state ? state : 'walking';
        this.stateMachine.setState(state);
        
        this.body.checkCollision.up = true;
        this.body.checkCollision.down = true;
        this.body.checkCollision.left = true;
        this.body.checkCollision.right = true;
    };

    Worm.prototype.stopMoving = function () {
        this.body.acceleration.x = 0;
    };
    
    Worm.prototype.handleDeath = function () {
        // Drop loot.
        if (Math.random() < 0.05) {
            this.events.onDrop.dispatch(
                this, 
                new HealthPowerup(game, this.x, this.y-this.height)
            );
        }

        else if(Math.random() < 0.1) {
            this.events.onDrop.dispatch(
                this, 
                new FoodPowerup(game, this.x, this.y-this.height)
            );
        }
        
        this.stateMachine.setState('flying');
        
        this.body.checkCollision.up = false;
        this.body.checkCollision.down = false;
        this.body.checkCollision.left = false;
        this.body.checkCollision.right = false;
        
        Entity.prototype.handleDeath.apply(this);
    };

    return Worm;

});