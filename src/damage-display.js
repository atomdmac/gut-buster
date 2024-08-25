define([
    'phaser'
], function (Phaser) { 
    'use strict';

    // Shortcuts
    var game, self, health, maxHealth, flash;

    function DamageDisplay (_game, x, y) {

        game = _game;
        self = this;

        // Initialize sprite
        Phaser.Sprite.call(this, game, x, y, 'damage-overlay');    
        
        this.fixedToCamera = true;
        this.cameraOffset.x = 0;
        this.cameraOffset.y = 0;

        maxHealth = 100;
    }


    DamageDisplay.prototype = Object.create(Phaser.Sprite.prototype);
    DamageDisplay.prototype.constructor = DamageDisplay;

    DamageDisplay.prototype.setMaxHealth = function (amount) {
        maxHealth = amount;
    };

    DamageDisplay.prototype.updateDisplay = function (amount) {
        // How opaque will the overlay be when animated?
        var newAlphaMax = 1 - (amount / maxHealth),
            // How opaque will the overlay be when animation finishes?
            newAlpha = 0.6 - (amount / maxHealth);

        if(flash) flash.stop(true);

        if(amount > health) {
            flash = game.add.tween(this);
            flash.to({alpha: newAlpha}, 300, null, true, 0, 0, false);
        } 

        else {
            this.alpha = newAlpha;

            flash = game.add.tween(this);
            flash.to({alpha: [newAlphaMax, newAlpha]}, 150, null, true, 0, 0, false)
            .interpolation(Phaser.Math.bezierInterpolation);

        }

        health = amount;
    };

    return DamageDisplay;

});