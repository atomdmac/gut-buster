define([
    'phaser',
    'weapon'
], function (Phaser, Weapon) { 
    'use strict';

    var game;

    function Checkpoint (_game, x, y) {
        game = _game;

        Phaser.Sprite.call(this, game, x, y, 'blank', 1);

        game.physics.enable(this);
        this.body.immovable = true;
        this.body.allowGravity = false;

    }

    Checkpoint.prototype = Object.create(Phaser.Sprite.prototype);
    Checkpoint.prototype.constructor = Checkpoint;

    return Checkpoint;
});