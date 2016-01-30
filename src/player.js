define([
    'phaser',
    'entity',
    'sword',
    'puker',
    'claw-arm',
    'utilities/state-machine'
], function (Phaser, Entity, Sword, Puker, ClawArm, StateMachine) { 
    'use strict';

    // Shortcuts
    var game;

    function Player (_game, x, y) {
        game = _game;

        // Initialize sprite
        Entity.call(this, game, x, y, 'player');
        this.anchor.set(0.5);

        // Set up animations.
        this.anims = {};
        this.anims.walk = this.animations.add('walk', [2,3,4,5,6,7,8,9], 40);
        this.frame = 0;

        // Enable physics.
        game.physics.enable(this);
        this.body.collideWorldBounds = true;
        this.checkWorldBounds = true;

        // Resize player body/hitbox.
        this.body.setSize(26,29,1,9);

        // Initialize public properites.
        // Fastest possible movement speeds.
        this.body.maxVelocity.x = 500;
        this.body.maxVelocity.y = 10000;
        this.body.drag.x = 1500;
        this.body.drag.y = 0;
        
        // Is player currently jumping?
        this.isJumping = false;
        // Initial jump speed
        this.jumpSpeed = 350;
        // The maximum length of time that the upward movement of the player's
        // normal jump will take.
        this.maxJumpTime = 250;
        // The horizontal acceleration that is applied when moving.
        this.moveAccel = 800;

        // Number of times that the player can die and re-spawn at the last 
        // checkpoint reached.
        this.lives = 3;
        // The maximum number of lives a player can carry at any given time.
        this.maxLives = 3;

        // Number of times the player can be hit by an enemy.
        this.maxHealth = 4;
        this.health = 4;

        // Amount of shit the player can fit in his stomach.
        this.maxFullness = 50;
        this.fullness = 50;
        this.stomachAutoFillTimer = game.time.create(false);
        this.stomachAutoFillTimer.loop(1500, this.eat, this, 1);
        this.stomachAutoFillTimer.start();

        // Equip weapons
        this.weapons = [];
        this.weapons.sword   = new Sword(game, 0, 0);
        this.weapons.puker     = new Puker(game, 20, 14);
        this.weapons.clawArm = new ClawArm(game, 0, 0);

        this.weapons.push(this.weapons.sword);
        this.weapons.push(this.weapons.puker);
        this.weapons.push(this.weapons.clawArm);

        for(var i=0; i<this.weapons.length; i++) {
            this.addChild(this.weapons[i]);
        }
        
        this.weapons.puker.events.onPuke.add(this.onPukerPuke, this);

        this.maxMoveSpeed = new Phaser.Point(300, 10000);

        // Wall jump timer
        this.wallJumpTime = game.time.now;
        this.wallJumpDuration = 350;
        this.lastBlocked = null; // Values will be 'right' or 'left'

        // Signals
        this.events.onPuke = new Phaser.Signal();
        this.events.onEat = new Phaser.Signal();
        this.events.onAddLife = new Phaser.Signal();
        this.events.onRemoveLife = new Phaser.Signal();
        this.events.onAddMaxLife = new Phaser.Signal();
        this.events.onRemoveMaxLife = new Phaser.Signal();
        this.events.onExit = new Phaser.Signal();

        // Kill player when they fall outside the bounds of the map.
        this.events.onOutOfBounds.add(this.handleDeath, this);

        StateMachine.extend(this);
        this.stateMachine.states = {
            'normal': {
                'update': this.update_normal
            },
            'approachExit': {
                'update': this.update_approachExit
            },
            'performExit' : {
                'update': this.update_performExit
            }
        };
        this.stateMachine.setState('normal');
    }

    Player.prototype = Object.create(Entity.prototype);
    Player.prototype.constructor = Player;

    Player.prototype.update_normal = function () {
        // Update sprite.
        if(this.isJumping && this.body.velocity.y < 0) this.frame = 10;
        else if (!this.body.touching.down && !this.body.blocked.left && !this.body.blocked.right && this.body.velocity.y > 0) this.frame = 11;
        else if(this.body.acceleration.x === 0) this.frame = 0;

        if(game.time.now > this.jumpTimer) {
            this.isJumping = false;
        }
        if(this.isJumping) {
            this.body.velocity.y = -this.jumpSpeed;
        }

        // Update weapons.
        for(var w=0; w<this.weapons.length; w++) {
            this.weapons[w].update();
        }

        Phaser.Sprite.prototype.update.call(this);
    };

    Player.prototype.update_approachExit = function () {
        if(!this.body.onFloor() && !this.body.touching.down) return;
        if(game.exitDoor.x + game.exitDoor.width > this.x) {
            this.moveRight();
            return;
        } else {
            this.mask = game.exitDoor.maskShape;
            this.stateMachine.setState('performExit');
        }
    };

    Player.prototype.update_performExit = function () {
        this.moveLeft();
        if(game.exitDoor.x > this.x - this.width) {
            this.events.onExit.dispatch(this);
        }
    };
    
    // Update children.
    Player.prototype.update = function () {
        this.stateMachine.handle('update');
    };

    Player.prototype.attackSword = function () {
        this.weapons[0].use();
    };

    Player.prototype.attackPuker = function () {
        if (this.fullness > 0) {
            this.weapons[1].use();
        }
    };

    Player.prototype.onPukerPuke = function () {
        this.fullness--;
        this.events.onPuke.dispatch();
    };
    
    Player.prototype.attackClaw = function () {
        this.weapons[2].use();
    };

    Player.prototype.heal = function (amount, source) {
        amount = Math.abs(amount || 1);
        this.health += amount;
        if (this.health > this.maxHealth) this.health = this.maxHealth;
        this.events.onHeal.dispatch(this.health, amount);

    };
    
    Player.prototype.eat = function(amount) {
        this.fullness += amount;
        if (this.fullness > this.maxFullness) this.fullness = this.maxFullness;
        this.events.onEat.dispatch();
    };

    Player.prototype.addLife = function (amount) {
        if(!amount || amount < 1) amount = 1;
        this.lives += amount;
        if(this.lives > this.maxLives) this.lives = this.maxLives;
        this.events.onAddLife.dispatch(this, amount);
    };

    Player.prototype.removeLife = function(amount) {
        if(!amount || amount < 1) amount = 1;
        this.lives -= amount;
        if(this.lives < 0) this.lives = 0;
        this.events.onRemoveLife.dispatch(this, amount);
    };

    Player.prototype.addMaxLife = function (amount) {
        if(!amount || amount < 1) amount = 1;
        this.maxLives += amount;
        this.events.onAddMaxLife.dispatch(this, amount);
    };

    Player.prototype.removeMaxLife = function (amount) {
        if(!amount || amount < 1) amount = 1;
        this.lives -= amount;
        this.events.onRemoveMaxLife.dispatch(this, amount);
    };

    Player.prototype.kill = function () {
        this.dying = false;
        Phaser.Sprite.prototype.kill.apply(this, arguments);
    };
    
    Player.prototype.jump = function () {

        // Temporarily disable input after knockback.
        if(this.knockbackTime > game.time.now) return;

        // Update sprite.
        this.animations.stop();
        this.frame = 5;
        
        // Normal jumping
        if(this.body.onFloor() || this.body.touching.down) {
            this.isJumping = true;
            this.jumpTimer = game.time.now + this.maxJumpTime;
        }

        // Wall jumping.
        else if(this.lastBlocked === 'left' && this.wallJumpTime > game.time.now) {
            this.body.velocity.x = this.maxMoveSpeed.x * 0.8;  // TODO: Find a more appropriate way to calculate vx when wall jumping.
            this.isJumping = true;
            this.jumpTimer = game.time.now + (this.maxJumpTime * 0.4);
            this.wallJumpTime = game.time.now;
        }

        else if(this.lastBlocked === 'right' && this.wallJumpTime > game.time.now) {
            this.body.velocity.x = -this.maxMoveSpeed.x * 0.8;  // TODO: Find a more appropriate way to calculate vx when wall jumping.
            this.isJumping = true;
            this.jumpTimer = game.time.now + (this.maxJumpTime * 0.4);
            this.wallJumpTime = game.time.now;
        }
    };

    Player.prototype.endJump = function () {
        this.isJumping = false;
    };

    Player.prototype.moveLeft = function () {
        // Temporarily disable input after knockback.
        if(this.knockbackTime > game.time.now) return;

        // Play walk animation if 1) we're on the floor 2) We're not blocked.
        if(!this.anims.walk.isPlaying && (this.body.onFloor() || this.body.touching.down)) this.anims.walk.play();

        if(this.body.velocity.x <=  -this.maxMoveSpeed.x) this.body.velocity.x = -this.maxMoveSpeed.x;
        
        // Face away from wall and slide down wall slowly if...
        // - We're falling (i.e. y velocity is a positive value)
        // - We're touching a wall on our left
        // - We're NOT on a floor or platform.
        if(this.body.velocity.y > 0 && this.body.onWall() && this.body.blocked.left && !(this.body.onFloor() || this.body.touching.down)) {
            this.flip(1);
            if (this.body.velocity.y > 0) {
                this.body.velocity.y = 50;
                this.frame = 12;
            }

        }
        // Face normally and fall normally.
        else {
            this.flip(-1);
        }

        // If we're touching a wall, we can jump off of it.
        if(this.body.onWall() && this.body.blocked.left && !(this.body.onFloor() || this.body.touching.down)) {
            // Create a small window of time during which the player can wall jump.
            this.wallJumpTime = game.time.now + this.wallJumpDuration;
            this.lastBlocked = 'left';
        }
        
        // Wait for drag to stop us if switching directions.
        if (this.body.acceleration.x > 0 && this.body.touching.bottom) {
            this.body.acceleration.x *= -1;
        }
        if (this.body.velocity.x <= 0 && this.body.touching.bottom) {
            this.body.acceleration.x = -this.moveAccel;
        } else {
            this.body.acceleration.x = -this.moveAccel;
        }
    };

    Player.prototype.moveRight = function () {
        // Temporarily disable input after knockback.
        if(this.knockbackTime > game.time.now) return;

        // Play walk animation if 1) we're on the floor 2) We're not blocked.
        if(!this.anims.walk.isPlaying && (this.body.onFloor() || this.body.touching.down)) this.anims.walk.play();

        if(this.body.velocity.x >=  this.maxMoveSpeed.x) this.body.velocity.x = this.maxMoveSpeed.x;

        // Face away from wall and slide down wall slowly if...
        // - We're falling (i.e. y velocity is a positive value)
        // - We're touching a wall on our right
        // - We're NOT on a floor or platform.
        if(this.body.velocity.y > 0 && this.body.onWall() && this.body.blocked.right && !(this.body.onFloor() || this.body.touching.down)) {
            this.flip(-1);
            if (this.body.velocity.y > 0) {
                this.body.velocity.y = 50;
                this.frame = 12;
            }
        }
        // Face normally and fall normally.
        else {
            this.flip(1);
        }

                // If we're touching a wall, we can jump off of it.
        if(this.body.onWall() && this.body.blocked.right && !(this.body.onFloor() || this.body.touching.down)) {
            // Create a small window of time during which the player can wall jump.
            this.wallJumpTime = game.time.now + this.wallJumpDuration;
            this.lastBlocked = 'right';
        }
        
        // Wait for drag to stop us if switching directions.
        if (this.body.acceleration.x < 0 && this.body.touching.bottom) {
            this.body.acceleration.x *= -1;
        }
        if (this.body.velocity.x >= 0 && this.body.touching.bottom) {
            this.body.acceleration.x = this.moveAccel;
        } else {
            this.body.acceleration.x = this.moveAccel;
        }
    };

    Player.prototype.stopMoving = function () {
        this.body.acceleration.x = 0;
    };

    /* Cause the player to exit the level.  This entails:
     * - Stop accepting user input
     * - Move the player to the exit
     * Most of this will be handled by the Player's statemachine.
     */
    Player.prototype.exitLevel = function () {
        // Only attempt to leave the level if we're not already trying to do so.
        if(this.stateMachine.getState() === 'normal') {
            this.stateMachine.setState('approachExit');
        }
    };

    Player.prototype.damage = function () {
        // Player cannot take damage/knockback unless under user control.
        if(this.stateMachine.getState() === 'normal') {
            Entity.prototype.damage.apply(this, arguments);
        }
    };

    return Player;

});