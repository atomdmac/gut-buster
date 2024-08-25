define([
    'phaser',
    'weapon'
], function (Phaser, Weapon) { 
    'use strict';

    var game;

    function Claw (_game, x, y) {
        game = _game;

        Phaser.Sprite.call(this, game, x, y, 'claw', 1);
        this.anchor.set(0.5);

        this.debug = true;

        this.speed = 1000;
        this.revive();

        game.physics.enable(this);
        this.body.immovable = true;
        this.body.allowGravity = false;

    }

    Claw.prototype = Object.create(Phaser.Sprite.prototype);
    Claw.prototype.constructor = Claw;

    Claw.prototype.revive = function (health) {
        Phaser.Sprite.prototype.revive.call(this, health);
    };

    Claw.prototype.fire = function (direction) {
        this.body.velocity.y = 0;
        switch(direction) {
            case -1:
                this.scale.x = -1; //flipped
                this.body.velocity.x = -this.speed;
                break;
            case 1:
                this.scale.x = 1; //facing default direction
                this.body.velocity.x = this.speed;
                break;
        }

    };

    return Claw;
});