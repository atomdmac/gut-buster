define([
    'phaser'
], function (Phaser) { 
    'use strict';

    var game, self, animation;

    function FoodPowerup (_game, x, y) {
        game = _game;
        self = this;

        Phaser.Sprite.call(this, game, x, y, 'food-powerup');

        this.pickupEffect = game.add.emitter(this.x, this.y, this.width);

        this.pickupEffect.makeParticles('eat');
        this.pickupEffect.maxRotation = 0;
        this.pickupEffect.width = this.width;
        this.pickupEffect.setAlpha(1, 0, 1000);
        this.pickupEffect.setYSpeed(-70, -70);
        this.pickupEffect.setXSpeed(-10, 10);
        this.pickupEffect.setRotation(0, 0);
        game.world.bringToTop(this.pickupEffect);
        
        // Enable physics.
        game.physics.enable(this);
        this.body.collideWorldBounds = true;
        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
        
        animation = this.animations.add('fascinate');
        animation.play(10, true);

        // Start on random frame so all drops are desyncronized.
        animation.next(Math.floor(Math.random()*10));
    }

    FoodPowerup.prototype = Object.create(Phaser.Sprite.prototype);
    FoodPowerup.prototype.constructor = FoodPowerup;
    
    FoodPowerup.prototype.useOn = function (target) {
        target.eat(10, self);

        this.pickupEffect.emitX = this.x;
        this.pickupEffect.emitY = this.y;
        this.pickupEffect.forEach(function (item) {
            item.body.allowGravity = false;
        });
        this.pickupEffect.flow(1000, 50, 1, 5, true);
    };

    return FoodPowerup;
});