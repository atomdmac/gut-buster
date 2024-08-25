define([
    'phaser',
    'entity',
    'weapon',
    'puke'
], function (Phaser, Entity, Weapon, Puke) { 
    'use strict';

    var game;

    function Puker (_game, x, y) {
        game = _game;

        Weapon.call(this, game, x, y, 'blank', 1);
        this.anchor.set(0.5);

        this.missiles = game.add.group();
        this.missiles.x = 0;
        this.missiles.y = 0;
        this.missiles.classType = Puke;

        // How often this weapon can be used (in ms)
        this.useRate = 40;
        this.useTimer = game.time.create(false);
        this.useTimer.start(); 

        // Used to throttle use rate.
        this.useTimeout = 0;

        game.physics.enable(this);
        this.body.immovable = true;
        this.body.allowGravity = false;

        // Signals
        this.events.onPuke = new Phaser.Signal();
    }

    Puker.prototype = Object.create(Weapon.prototype);
    Puker.prototype.constructor = Puker;

    Puker.prototype.update = function () {
        Phaser.Sprite.prototype.update.call(this);
    };

    Puker.prototype.getCollidables = function () {
        return this.missiles.children;
    };

    Puker.prototype.use = function (direction) {
        if (!this.canUse()) return;

        // Since Puker will be a child of the owner's head, we need to create
        // a reference to the parent's (i.e. the head) parent.
        // TODO: Find a more straightforward way to reference the parent's parent.
        var parent = this.parent.parent,
            v = {
                x:(parent.scale.x*Math.random()*150 - 75) + parent.body.velocity.x, 
                y: 0};
        var missile = this.missiles.getFirstDead(true, parent.x+(this.x*parent.scale.x), parent.y+this.y);
        game.world.bringToTop(this.missiles);
        missile.fire(parent.scale.x, v);
        this.useTimeout = game.time.now;
        this.events.onPuke.dispatch();
    };

    Puker.prototype.canUse = function () {
        if (game.time.now > this.useTimeout + this.useRate) {
            return true;
        } else {
            return false;
        }
    };

    Puker.prototype.onHit = function (missile, victim) {
        Weapon.prototype.onHit.call(this, 1, victim);
    };

    return Puker;
});