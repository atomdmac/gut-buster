define([
    'phaser'
], function (Phaser) { 
    'use strict';

    // Shortcuts
    var game, self;

    function StomachMeter (_game, x, y) {
        game = _game;
        self = this;

        // Initialize sprite
        Phaser.Sprite.call(this, game, x, y, 'stomach-meter');
        
        this.fullness = 1; // 1=100%
        
        // Set up animations.
        this.animations.add('idle0',   [0], 15);
        this.animations.add('idle10',  [1], 15);
        this.animations.add('idle20',  [2], 15);
        this.animations.add('idle30',  [3], 15);
        this.animations.add('idle40',  [4], 15);
        this.animations.add('idle50',  [5], 15);
        this.animations.add('idle60',  [6], 15);
        this.animations.add('idle70',  [7], 15);
        this.animations.add('idle80',  [8], 15);
        this.animations.add('idle90',  [9], 15);
        this.animations.add('idle100', [10], 15);
        
        this.animations.add('start-squeeze0',   [11], 15);
        this.animations.add('start-squeeze10',  [12], 15);
        this.animations.add('start-squeeze20',  [13], 15);
        this.animations.add('start-squeeze30',  [14], 15);
        this.animations.add('start-squeeze40',  [15], 15);
        this.animations.add('start-squeeze50',  [16], 15);
        this.animations.add('start-squeeze60',  [17], 15);
        this.animations.add('start-squeeze70',  [18], 15);
        this.animations.add('start-squeeze80',  [19], 15);
        this.animations.add('start-squeeze90',  [20], 15);
        this.animations.add('start-squeeze100', [21], 15);
        
        this.animations.add('squeeze0',   [22,33], 15);
        this.animations.add('squeeze10',  [23,34], 15);
        this.animations.add('squeeze20',  [24,35], 15);
        this.animations.add('squeeze30',  [25,36], 15);
        this.animations.add('squeeze40',  [26,37], 15);
        this.animations.add('squeeze50',  [27,38], 15);
        this.animations.add('squeeze60',  [28,39], 15);
        this.animations.add('squeeze70',  [29,40], 15);
        this.animations.add('squeeze80',  [30,41], 15);
        this.animations.add('squeeze90',  [31,42], 15);
        this.animations.add('squeeze100', [32,43], 15);
        
        this.animations.add('release0',   [22,33,44], 15);
        this.animations.add('release10',  [23,34,45], 15);
        this.animations.add('release20',  [24,35,46], 15);
        this.animations.add('release30',  [25,36,47], 15);
        this.animations.add('release40',  [26,37,48], 15);
        this.animations.add('release50',  [27,38,49], 15);
        this.animations.add('release60',  [28,39,50], 15);
        this.animations.add('release70',  [29,40,51], 15);
        this.animations.add('release80',  [30,41,52], 15);
        this.animations.add('release90',  [31,42,53], 15);
        this.animations.add('release100', [32,43,54], 15);
        
        // Set up automatic animation transitions.
        this.animations.getAnimation('squeeze0')  .onComplete.add(this.releaseSqueeze, this);
        this.animations.getAnimation('squeeze10') .onComplete.add(this.releaseSqueeze, this);
        this.animations.getAnimation('squeeze20') .onComplete.add(this.releaseSqueeze, this);
        this.animations.getAnimation('squeeze30') .onComplete.add(this.releaseSqueeze, this);
        this.animations.getAnimation('squeeze40') .onComplete.add(this.releaseSqueeze, this);
        this.animations.getAnimation('squeeze50') .onComplete.add(this.releaseSqueeze, this);
        this.animations.getAnimation('squeeze60') .onComplete.add(this.releaseSqueeze, this);
        this.animations.getAnimation('squeeze70') .onComplete.add(this.releaseSqueeze, this);
        this.animations.getAnimation('squeeze80') .onComplete.add(this.releaseSqueeze, this);
        this.animations.getAnimation('squeeze90') .onComplete.add(this.releaseSqueeze, this);
        this.animations.getAnimation('squeeze100').onComplete.add(this.releaseSqueeze, this);
        
        this.animations.getAnimation('release0')  .onComplete.add(this.setIdle, this);
        this.animations.getAnimation('release10') .onComplete.add(this.setIdle, this);
        this.animations.getAnimation('release20') .onComplete.add(this.setIdle, this);
        this.animations.getAnimation('release30') .onComplete.add(this.setIdle, this);
        this.animations.getAnimation('release40') .onComplete.add(this.setIdle, this);
        this.animations.getAnimation('release50') .onComplete.add(this.setIdle, this);
        this.animations.getAnimation('release60') .onComplete.add(this.setIdle, this);
        this.animations.getAnimation('release70') .onComplete.add(this.setIdle, this);
        this.animations.getAnimation('release80') .onComplete.add(this.setIdle, this);
        this.animations.getAnimation('release90') .onComplete.add(this.setIdle, this);
        this.animations.getAnimation('release100').onComplete.add(this.setIdle, this);
        
        // Lock to camera
        this.fixedToCamera = true;
        this.cameraOffset.x = 10;
        this.cameraOffset.y = 40;

    }

    StomachMeter.prototype = Object.create(Phaser.Sprite.prototype);
    StomachMeter.prototype.constructor = StomachMeter;

    StomachMeter.prototype.updateDisplay = function (percentFull) {
        if (percentFull > 1) percentFull = 1;
        
        // Store % converted to a multiple of 10 for animation selection.
        var p = Math.ceil(percentFull * 10) * 10;
        
        if (percentFull < this.fullness) {
            if (this.animations.name.indexOf('idle') !== -1 &&
                this.animations.name.indexOf('release') !== -1) {
                this.animations.play('start-squeeze'+p);
            }
            else {
                this.animations.play('squeeze'+p);
            }
        }
        else {
            this.animations.play('idle'+p);
        }
        
        this.fullness = percentFull;
    };

    StomachMeter.prototype.squeeze = function () {
        // Store % converted to a multiple of 10 for animation selection.
        var p = Math.ceil(this.fullness * 10) * 10;
        this.animations.play('squeeze'+p);
    };

    StomachMeter.prototype.releaseSqueeze = function () {
        // Store % converted to a multiple of 10 for animation selection.
        var p = Math.ceil(this.fullness * 10) * 10;
        this.animations.play('release'+p);
    };

    StomachMeter.prototype.setIdle = function () {
        // Store % converted to a multiple of 10 for animation selection.
        var p = Math.ceil(this.fullness * 10) * 10;
        this.animations.play('idle'+p);
    };

    return StomachMeter;
});