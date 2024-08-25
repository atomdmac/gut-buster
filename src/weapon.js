define([
    'phaser',
    'game-sprite'
], function (Phaser, GameSprite) { 
    'use strict';

    var game, self;

    function Weapon (_game, x, y, key, frame) {
        game = _game;
        self = this;
        
        GameSprite.call(this, game, x, y, key, frame);

        // Whether or not this weapon is currently in use.
        this.inUse = false;

        // How often this weapon can be used (in ms)
        this.useRate = 100;

        // Used to throttle use rate.
        this.useTimeout = 0;

    }

    Weapon.prototype = Object.create(GameSprite.prototype);
    Weapon.prototype.constructor = Weapon;

    // Return one or more items that can be collided with to cause damage.
    Weapon.prototype.getCollidables = function () {
        if(this.inUse) return this;
        return null;
    };

    Weapon.prototype.use = function () {
        if(this.canUse()) {
            this.useTimeout = game.time.now;
            this.inUse = true;
        }
    };

    Weapon.prototype.canUse = function () {
        if (game.time.now > this.useTimeout + this.useRate) {
            return true;
        } else {
            return false;
        }
    };

    Weapon.prototype.onHit = function (weapon, victim) {
        if(victim.health > 0) victim.damage(1, self.parent);
    };

    Weapon.prototype.onHitTerrain = function (weapon, tile) {
        
    };

    return Weapon;
});