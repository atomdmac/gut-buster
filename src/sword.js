define([
    'phaser',
    'weapon'
], function (Phaser, Weapon) { 
    'use strict';

    var game, anim;

    function Sword (_game, x, y) {
        game = _game;

        Weapon.call(this, game, x, y, 'sword-swipe');
        game.physics.enable(this);
        this.body.allowGravity = false;
        this.body.moves = false;
        this.body.immovable = true;

        anim = this.animations.add('swipe', null, 60);
        anim.onComplete.add(onAttackFinish, this);
        this.anchor.y = 0.5;
        this.anchor.x = 0.25;

        // Whether or not this weapon is currently in use.
        this.inUse = false;

        // How often this weapon can be used (in ms)
        this.useRate = 10;

        // Used to throttle use rate.
        this.useTimeout = 0;

        // A list of hitbox items to use for the sword.
        this.hitboxes = game.add.group();
        this.hitboxes.enableBody = true;
        this.addChild(this.hitboxes);

        this.rightHitboxFrames = makeRightHitboxFrames(this.hitboxes);
        this.leftHitboxFrames = makeLeftHitboxFrames(this.hitboxes);

        // Make sure hitboxes stay attached to the player.
        this.hitboxes.forEach(function (hitbox) {
            hitbox.body.allowGravity = false;
            hitbox.body.moves = false;
            hitbox.body.immovable = true;
        });

    }

    function makeRightHitboxFrames (hitboxes) {

        var box0 = hitboxes.create(0,0,'blank');
        box0.body.setSize(32, 32, -16, -48);

        var box1 = hitboxes.create(0,0,'blank');
        box1.body.setSize(32, 32, 0, -48);

        var box2 = hitboxes.create(0,0,'blank');
        box2.body.setSize(32, 48, 16, -48);

        var box3 = hitboxes.create(0,0,'blank');
        box3.body.setSize(32, 64, 16, -48);

        var box4 = hitboxes.create(0,0,'blank');
        box4.body.setSize(32, 64, 16, -32);

        var box5 = hitboxes.create(0,0,'blank');
        box5.body.setSize(32, 80, 16, -31);

        var box6 = hitboxes.create(0,0,'blank');
        box6.body.setSize(48, 32, 0, 16);

        // Remember: frame keys here are 0 indexed.
        return {
            '0': box0,
            '1': box1,
            '2': box2,
            '3': box3,
            '4': box4,
            '5': box5,
            '6': box6,
            '7': null
        };
    }

    function makeLeftHitboxFrames (hitboxes) {

        var box0 = hitboxes.create(0,0,'blank');
        box0.body.setSize(32, 32, -16, -48);

        var box1 = hitboxes.create(0,0,'blank');
        box1.body.setSize(32, 32, -32, -48);

        var box2 = hitboxes.create(0,0,'blank');
        box2.body.setSize(32, 48, -48, -48);

        var box3 = hitboxes.create(0,0,'blank');
        box3.body.setSize(32, 64, -48, -48);

        var box4 = hitboxes.create(0,0,'blank');
        box4.body.setSize(32, 64, -48, -32);

        var box5 = hitboxes.create(0,0,'blank');
        box5.body.setSize(32, 80, -48, -31);

        var box6 = hitboxes.create(0,0,'blank');
        box6.body.setSize(48, 32, -48, 16);

        // Remember: frame keys here are 0 indexed.
        return {
            '0': box0,
            '1': box1,
            '2': box2,
            '3': box3,
            '4': box4,
            '5': box5,
            '6': box6,
            '7': null
        };
    }

    Sword.prototype = Object.create(Weapon.prototype);
    Sword.prototype.constructor = Sword;

    Sword.prototype.getCollidables = function () {
        if(!this.inUse) return null;

        var hitbox;
        if(this.parent.scale.x > 0) {
            hitbox = this.rightHitboxFrames[anim.currentFrame.index];
        } else {
            hitbox = this.leftHitboxFrames[anim.currentFrame.index];
        }

        if(hitbox) return hitbox;
        return null;  
    };

    function onAttackFinish () {
        this.inUse = false;
        anim.stop(true);
    }

    Sword.prototype.update = function () {
        // Hide sword when it's not in use.
        if(anim.isPlaying) this.visible = true;
        else this.visible = false;

        Weapon.prototype.update.call(this);
    };

    Sword.prototype.revive = function (health) {
        anim.stop(true);
        Weapon.prototype.revive.call(this);
    };

    Sword.prototype.use = function (direction) {
        if(this.canUse()) {
            this.inUse = true;
            this.useTimeout = game.time.now;
            anim.stop(true);
            anim.play();
        }
    };

    Sword.prototype.canUse = function () {
        if (this.parent && 
            game.time.now > this.useTimeout + this.useRate) {
            return true;
        } else {
            return false;
        }
    };

    return Sword;
});