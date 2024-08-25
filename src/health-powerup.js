define([
    'phaser'
], function (Phaser) { 
    'use strict';

    var game, self, animation;

    function HealthPowerup (_game, x, y) {
        game = _game;
        self = this;

        Phaser.Sprite.call(this, game, x, y, 'health-powerup');
        this.anchor.set(0.5);

        this.pickupEffect = game.add.emitter(this.x, this.y, this.width);

        this.pickupEffect.makeParticles('heal');
        this.pickupEffect.maxRotation = 0;
        this.pickupEffect.width = this.width;
        this.pickupEffect.setAlpha(1, 0, 1000);
        this.pickupEffect.setYSpeed(-70, -70);
        this.pickupEffect.setXSpeed(-10, 10);
        this.pickupEffect.setRotation(0, 0);
        game.world.bringToTop(this.pickupEffect);

        //  false means don't explode all the sprites at once, but instead release at a rate of 20 particles per frame
        //  The 5000 value is the lifespan of each particle
        
        // Enable physics.
        game.physics.enable(this);
        this.body.collideWorldBounds = true;
        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
        
        animation = this.animations.add('fascinate');
        animation.play(10, true);

        // Start on radnom frame so all drops are desyncronized.
        animation.next(Math.floor(Math.random()*10));
    }

    HealthPowerup.prototype = Object.create(Phaser.Sprite.prototype);
    HealthPowerup.prototype.constructor = HealthPowerup;
    
    HealthPowerup.prototype.useOn = function (target) {
        target.heal(1, self);

        this.pickupEffect.emitX = this.x;
        this.pickupEffect.emitY = this.y;
        this.pickupEffect.forEach(function (item) {
            item.body.allowGravity = false;
        });
        this.pickupEffect.flow(1000, 50, 1, 5, true);
    };

    HealthPowerup.prototype.update = function () {
    };

    return HealthPowerup;
});