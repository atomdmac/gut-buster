define([
    'phaser',
    'game-sprite'
], function (Phaser, GameSprite) { 
    'use strict';

    // Shortcuts
    var game;

    function SpeechBubble (_game, x, y, key, frame, target) {

        game = _game;

        this.offset = new Phaser.Point(x, y);
        this.target = target;
        this.floatOffset = new Phaser.Point(0, 0);

        var levitateAnim = game.add.tween(this.floatOffset);
        var easing = Phaser.Easing.Sinusoidal.InOut;
        levitateAnim.to({y: 5}, 500, easing, true, 0, -1, true);

        // Initialize sprite
        GameSprite.call(this, game, x, y, key, frame);
        
    }

    SpeechBubble.prototype = Object.create(GameSprite.prototype);
    SpeechBubble.prototype.constructor = SpeechBubble;

    SpeechBubble.prototype.update = function () {

        this.x = this.target.x + this.offset.x + this.floatOffset.x;
        this.y = this.target.y + this.offset.y + this.floatOffset.y;
        
        // Call up!
        GameSprite.prototype.update.call(this);

    };

    return SpeechBubble;

});