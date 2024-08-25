define([
    'phaser',
	'game-group'
], function (Phaser, GameGroup) { 
    'use strict';

    // Shortcuts
    var game, self;

    function PauseMenu (_game) {
        game = _game;
        self = this;

        // Initialize sprite
        GameGroup.call(this, game);
		
        // Lock to camera.
        this.fixedToCamera = true;
		
		this.background = new Phaser.Sprite(game, 0, 0, 'pause-background');
        this.addChild(this.background);
		
		// Temporary mock-up. Needs to be replaced with something real.
		// Note: background image current has mock-up graphics in it, too.
		this.standardGuts = new Phaser.Sprite(game, 80, 80, 'stomach-meter', 7);
		this.standardGutsLabel = new Phaser.Text(game, 145, 100, this.livesString, { font: "bold 16px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" });
        this.standardGutsLabel.setText("Regular Gut");
		this.standardGutsCaption = new Phaser.Text(game, 145, 120, this.livesString, { font: "bold 12px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" });
        this.standardGutsCaption.setText("A pretty standard puke sack.");
		this.addChild(this.standardGuts);
		this.addChild(this.standardGutsLabel);
		this.addChild(this.standardGutsCaption);
		
    }

    PauseMenu.prototype = Object.create(GameGroup.prototype);
    PauseMenu.prototype.constructor = PauseMenu;

	PauseMenu.prototype.enable = function () {
		this.setAll('exists', true);
		this.paused = true;
    };

	PauseMenu.prototype.disable = function () {
		this.setAll('exists', false);
		this.paused = false;
    };
    return PauseMenu;

});