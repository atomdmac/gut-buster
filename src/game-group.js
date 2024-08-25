define([
    'phaser'
], function (Phaser) { 
    'use strict';

    var game;

    function GameGroup (_game) {

        game = _game;

        Phaser.Group.call(this, game);
        
        this.paused = false;

    }

    GameGroup.prototype = Object.create(Phaser.Group.prototype);
    GameGroup.prototype.constructor = GameGroup;

    GameGroup.prototype.preUpdate = function () {
        if (!this.paused) Phaser.Group.prototype.preUpdate.call(this);
    };

    GameGroup.prototype.update = function () {
        if (!this.paused) Phaser.Group.prototype.update.call(this);
    };

    GameGroup.prototype.postUpdate = function () {
        if (!this.paused) Phaser.Group.prototype.postUpdate.call(this);
    };

    return GameGroup;
});