define([
    'phaser'
], function (Phaser) { 
    'use strict';

    var game;

    function HealthDisplay (_game, x, y) {

        game = _game;

        Phaser.Group.call(this, game);

        // Max number of lives to draw (default).
        this.maxHealth = 3;

        // Child groups.
        this.health = new Phaser.Group(_game, this);

        // Lock to camera.
        this.fixedToCamera = true;
        this.cameraOffset.x = 8;
        this.cameraOffset.y = 8;

    }

    HealthDisplay.prototype = Object.create(Phaser.Group.prototype);
    HealthDisplay.prototype.constructor = HealthDisplay;

    HealthDisplay.prototype.updateDisplay = function (amount) {

        var i, sprite;
        this.health.callAll('kill');
        for(i=0; i<this.maxHealth; i++) {
            sprite = this.health.getFirstDead(true, 0, 0, 'health');
            
            if(i+0.5 < amount) {
                sprite.frame = 0;
            } else if (i < amount) {
                sprite.frame = 1;
            } else {
                sprite.frame = 2;
            }
            sprite.revive();

            sprite.x = (i * sprite.width + 5);
            sprite.y = 4;
        }

    };

    HealthDisplay.prototype.setMaxHealth = function (amount) {
        this.maxHealth = amount;
    };

    return HealthDisplay;
});