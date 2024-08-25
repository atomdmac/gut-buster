define([
    'phaser'
], function (Phaser) { 
    'use strict';

    // Shortcuts
    var game, self;

    function Spawner (_game, x, y, key, frame, properties) {
        game = _game;
        self = this;

        // Initialize sprite
        Phaser.Sprite.call(this, game, x, y, 'spawner');

        this.renderable = false;
        
        // Spawn settings
        this.maxSpawned = 1;
        this.spawnRate = 500; // Delay to spawn, in ms
        this.isFresh = true;
        
        // Sprites spawned
        this.sprites = game.add.group();
        this.sprites.x = 0;
        this.sprites.y = 0;
        this.sprites.classType = game.spriteClassTypes[properties.key];
        this.sprites.createMultiple(this.maxSpawned, properties.key, 1, true);
        this.sprites.setAll('x', this.x);
        this.sprites.setAll('y', this.x);
        this.sprites.callAll('kill');
        
        // Spawn timer
        this.spawnTimer = game.time.create(false);
        this.spawnTimer.start(); 

        // Signals
        this.events.onSpawn = new Phaser.Signal();
        
        game.physics.enable(this);
        this.body.immovable = true;
        this.body.allowGravity = false;
    }

    Spawner.prototype = Object.create(Phaser.Sprite.prototype);
    Spawner.prototype.constructor = Spawner;

    Spawner.prototype.update = function () {
        if (this.inCamera) {
            // Attempt to spawn when the spawner is within the camera bounds.
            this.spawn();
        }
        else {
            this.isFresh = true;
        }

        // Call up!
        Phaser.Sprite.prototype.update.call(this);
    };

    function onCooldownComplete () {
        // No action necessary?
    }

    Spawner.prototype.spawn = function () {
        var sprite;
        if (!this.spawnTimer.duration && this.isFresh) {
            sprite = this.sprites.getFirstDead();
            if (sprite) {
                sprite.revive();
                sprite.x = this.x;
                sprite.y = this.y;
                this.events.onSpawn.dispatch(this, sprite);
                if (!this.sprites.getFirstDead()) {
                    this.isFresh = false; // fresh out!
                }
                this.spawnTimer.add(this.spawnRate, onCooldownComplete, this);
            }
            else{
                this.isFresh = false; // fresh out!
            }
        }
    };

    return Spawner;

});