define([
    'phaser'
], function (Phaser) { 
    'use strict';

    var game;

    function PoopTimer (_game, time) {

        game = _game;

        // Initialize sprite
        Phaser.Text.call(this, game, 0, 0, '0:00', { font: "bold 16px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" });
        
        // debug
        this.defaultTime = 120;
        this.set(time ? time : this.defaultTime);
        
        // Lock to camera.
        this.fixedToCamera = true;
        this.cameraOffset.x = 300;
        this.cameraOffset.y = 10;

        // Signals
        this.events.onTick = new Phaser.Signal();
        this.events.onTimeout = new Phaser.Signal();
    }

    PoopTimer.prototype = Object.create(Phaser.Text.prototype);
    PoopTimer.prototype.constructor = PoopTimer;

    PoopTimer.prototype.set = function (seconds) {
        this.paused = false;
        this.timeElapsed = 0;
        
        this.seconds = this.maxSeconds = seconds;
        this.timeString = normalizeTimeString(this.seconds);
        this.setText(this.timeString);
    };

    PoopTimer.prototype.preUpdate = function () {
        if (!this.paused) Phaser.Text.prototype.preUpdate.call(this);
    };

    PoopTimer.prototype.update = function () {
        if (!this.paused) {
            Phaser.Text.prototype.update.call(this);
            
            this.timeElapsed += game.time.physicsElapsed;
            
            if (this.seconds > 0 && this.timeElapsed >= 1) {
                this.seconds--;
                this.timeElapsed--;
                
                this.timeString = normalizeTimeString(this.seconds);
                this.setText(this.timeString);
                
                // Dispatch tick event.
                this.events.onTick.dispatch(this.seconds,
                                            this.maxSeconds);
                
                // Dispatch timeout event only once.
                if (this.seconds <= 0) {
                    this.events.onTimeout.dispatch();
                }
            }
        }
    };

    PoopTimer.prototype.postUpdate = function () {
        if (!this.paused) Phaser.Text.prototype.postUpdate.call(this);
    };
    
    function normalizeTimeString(seconds) {
        var minutes = Math.floor(seconds / 60);
        seconds %= 60;
        if (seconds < 10) {seconds = "0"+seconds;}
        return minutes+':'+seconds;
    }

    return PoopTimer;
});