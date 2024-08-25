define([
    'phaser'
], function (Phaser) { 
    'use strict';

    var game;

    function LivesDisplay (_game, x, y, lifeKey, lifeEmptyKey) {

        game = _game;

        // Initialize sprite
        Phaser.Sprite.call(this, game, x, y, 'lives');

        // Current number of lives.
        this.lives = 3;
        this.livesString = "00";
        this.livesText = new Phaser.Text(game, 8, 4, this.livesString, { font: "bold 16px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" });
        this.addChild(this.livesText);
        // Lock to camera.
        this.fixedToCamera = true;
        this.cameraOffset.x = 60;
        this.cameraOffset.y = 60;

    }

    LivesDisplay.prototype = Object.create(Phaser.Sprite.prototype);
    LivesDisplay.prototype.constructor = LivesDisplay;

    LivesDisplay.prototype.updateDisplay = function (amount) {
        this.livesString = this.lives = amount;
        this.livesString = this.livesString.toString();
        console.log(this.livesString);
        if (this.livesString.length === 1) {
            this.livesString = "0" + this.livesString;
        }
        this.livesText.setText(this.livesString);
    };

    return LivesDisplay;
});