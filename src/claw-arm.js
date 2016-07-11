define([
    'phaser',
    'weapon',
    'claw'
], function (Phaser, Weapon, Claw) { 
    'use strict';

    var game, self, coordinatesMediumPoint;

    function ClawArm (_game, x, y) {
        game = _game;
        self = this;

        Weapon.call(this, game, x, y, 'blank');
        this.anchor.set(0.5);
        
        this.armBalls = game.add.group();
        this.armBalls.x = this.x;
        this.armBalls.y = this.y;
        this.armBalls.createMultiple(30, 'claw-arm-ball');
        
        this.claw = new Claw(game, x, y);
        game.add.existing(this.claw);
        this.claw.kill(); // start the claw off dead

        // Flags
        this.inUse = false;
        this.retracting = false;
        this.clawAnchor = null;
        this.clawObjectHeld = null;

        // How often this weapon can be used (in ms)
        this.maxDistance = 200;
        
        // Auto-release timer.
        this.timeToRelease = Phaser.Timer.SECOND * 0.25; // 1 second

        game.physics.enable(this);
        this.body.immovable = true;
        this.body.allowGravity = false;
    }

    ClawArm.prototype = Object.create(Weapon.prototype);
    ClawArm.prototype.constructor = ClawArm;
    
    coordinatesMediumPoint = function( xA, yA, xB, yB, distanceAC ){
        var angleAB     = Math.atan2( ( yB - yA ), ( xB - xA ) );
        var deltaXAC    = distanceAC * Math.cos( angleAB );
        var deltaYAC    = distanceAC * Math.sin( angleAB );
        
        var xC          = xA + deltaXAC;
        var yC          = yA + deltaYAC;
       
        return { x: xC, y: yC };
    };
    
    ClawArm.prototype.update = function () {
        if(this.inUse) {
            // Precalculate new position of target
            var angle = this.claw.position.angle(this.parent),
                distanceBetween = this.claw.position.distance(this.parent);
            
            // Update arm ball positions
            var aBall;
            for (var lcv = 0; lcv < this.armBalls.length; lcv++) {
                aBall = this.armBalls.getChildAt(lcv);
                
                var clawDelta = distanceBetween / (this.armBalls.length / lcv);
                var armBallCoords = coordinatesMediumPoint(
                    this.claw.x,
                    this.claw.y,
                    this.parent.x,
                    this.parent.y,
                    clawDelta
                );
                
                aBall.x = armBallCoords.x;
                aBall.y = armBallCoords.y;
            }
            
            
            // Handle current state of action.
            
            // Pull the user to the claw.
            if (this.clawAnchor) {
                if (distanceBetween > 20) {
                    if (Math.abs(Phaser.Point.distance(this.parent.position, this.parent.previousPosition)) < 1 &&
                        Math.abs(Phaser.Point.distance(this.claw.position, this.claw.previousPosition)) < 1) {
                        
                        game.time.events.add(this.timeToRelease, onStuck, this);
                    }
                    else {
                        this.parent.body.velocity.x = Math.cos(angle) * -700;
                        this.parent.body.velocity.y = Math.sin(angle) * -700;
                    }
                }
                else {
                    onAttackFinish();
                }
            }
            // Pull the claw to the user.
            else if (this.retracting) {
                if (distanceBetween < 20) {
                    if (this.clawObjectHeld && this.clawObjectHeld.body) {
                        this.clawObjectHeld.body.velocity.x = Math.cos(angle) * 700;
                        this.clawObjectHeld.body.velocity.y = Math.sin(angle) * 700;
                    }
                    onAttackFinish();
                }
                else {
                    if (Math.abs(Phaser.Point.distance(this.parent.position, this.parent.previousPosition)) < 1 &&
                        Math.abs(Phaser.Point.distance(this.claw.position, this.claw.previousPosition)) < 1) {
                        
                        game.time.events.add(this.timeToRelease, onStuck, this);
                    }
                    
                    this.claw.body.velocity.x = Math.cos(angle) * 700;
                    this.claw.body.velocity.y = Math.sin(angle) * 700;
                    
                    if (this.clawObjectHeld) {
                        this.clawObjectHeld.x = this.claw.x;
                        this.clawObjectHeld.y = this.claw.y;
                    }
                }
            }
            // Not anchored yet, so start pulling the claw in to the player.
            else if (distanceBetween >= this.maxDistance) {
                // Set flag.
                this.retract();
            }
            
        }
        // Call up!
        Phaser.Sprite.prototype.update.call(this);
    };

    function onStuck () {
        if(self.inUse) {
            // Release any anchor or object held.
            self.clawAnchor = null;
            self.clawObjectHeld = null;
            
            // Ensure Claw is retracting.
            self.retracting = true;
            
            // Allow Claw to pass through terrain to finish retracting.
            self.claw.body.checkCollision.up = false;
            self.claw.body.checkCollision.down = false;
            self.claw.body.checkCollision.left = false;
            self.claw.body.checkCollision.right = false;
        }
    }

    function onAttackFinish () {
        // Clear flags.
        self.clawAnchor = null;
        self.clawObjectHeld = null;
        self.inUse = false;
        self.retracting = false;
        
        // Kill the claw and arm balls.
        self.claw.kill();
        self.armBalls.callAll('kill');
    }

    ClawArm.prototype.getCollidables = function () {
        return this.claw;
    };

    ClawArm.prototype.use = function () {
        if(!self.inUse) {
            // Set flag.
            self.inUse = true;
            
            // Reset arm balls.
            self.armBalls.callAll('revive');
            game.world.bringToTop(self.armBalls);
            self.armBalls.setAll('x', self.parent.x);
            self.armBalls.setAll('y', self.parent.y);
            
            // Reset claw and fire it!
            self.claw.body.checkCollision.up = true;
            self.claw.body.checkCollision.down = true;
            self.claw.body.checkCollision.left = true;
            self.claw.body.checkCollision.right = true;
            self.claw.reset(self.parent.x, self.parent.y);
            game.world.bringToTop(self.claw);
            self.claw.fire(self.parent.scale.x);
        }
    };
    
    ClawArm.prototype.retract = function() {
            self.retracting = true;
    },
    
    ClawArm.prototype.checkRetractErrors = function() {
        
    };

    ClawArm.prototype.onHit = function (collidable, victim) {
        if (self.inUse && !self.clawObjectHeld && !self.clawAnchor && !self.retracting) {
            // Do some damage to the victim.
            //victim.damage(1, victim);
            
            // Set flags.
            self.clawObjectHeld = victim;
            self.retract();
        }
    };

    ClawArm.prototype.onHitTerrain = function (weapon, tile) {
        if (self.inUse && !self.clawObjectHeld && !self.clawAnchor && !self.retracting) {
            // Set flag.
            self.clawAnchor = {x: tile.worldX, y: tile.worldY};
        }
    };

    return ClawArm;
});