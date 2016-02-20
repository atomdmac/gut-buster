define([
    'phaser'
], function (Phaser) { 
    'use strict';

    var game;

    function PoopTimer (_game, time) {

        game = _game;

        // Initialize sprite
        Phaser.Text.call(this, game, 0, 0, '0:00', { font: "bold 16px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" });
        this.anchor.set(0.5);
        
        this.defaultScale = new Phaser.Point(1, 1);
        this.defaultCameraOffset = new Phaser.Point(game.camera.width/2, 20);
        
        this.zoomedScale = new Phaser.Point(8, 8);
        this.zoomedCameraOffset = new Phaser.Point(game.camera.width/2, 200);
        
        // Lock to camera.
        this.fixedToCamera = true;
        this.scale = this.defaultScale;
        this.cameraOffset = this.defaultCameraOffset;
        
        
        // Set time.
        this.seconds = 0; // Is tweened to this.startTime in intro animation.
        this.startTime = time ? time : 120;
        this.maxSeconds = this.maxSeconds ? this.maxSeconds : this.startTime; // Placeholder to ensure SpeechBubble intervals don't get skewed when the player respawns at a Checkpoint (once Checkpoint times are implemented).
        this.paused = false;
        this.started = false;
        this.timeElapsed = 0;
        
        this.startIntroAnimation();

        // Signals
        this.events.onStart = new Phaser.Signal();
        this.events.onTick = new Phaser.Signal();
        this.events.onTimeout = new Phaser.Signal();
    }

    PoopTimer.prototype = Object.create(Phaser.Text.prototype);
    PoopTimer.prototype.constructor = PoopTimer;

    /*
     * Handles setting the actual time text that is displayed.
     */
    PoopTimer.prototype.updateTimeText = function () {
        this.timeString = normalizeTimeString(this.seconds);
        this.setText(this.timeString);
    };

    /*
     * Scales timer up and counts from 0 to this.startSeconds, then triggers
     * secondary function to complete the animation.
     */
    PoopTimer.prototype.startIntroAnimation = function () {
        // Prep display to start animating.
        this.scale = this.zoomedScale;
        this.cameraOffset = this.zoomedCameraOffset;
        this.alpha = 0;
        
        game.add.tween(this).to(
            { alpha: 1 },                   // Fade in
            250,                            // pretty quickly
            Phaser.Easing.Cubic.InOut,      // with some easing
            true);                          // and start automatically.
        
        game.add.tween(this).to(
            { seconds: this.startTime },    // Incrememnt seconds
            2000,                           // dramtically
            Phaser.Easing.Cubic.InOut,      // with some easing
            true)                           // and start automatically.
        .onUpdateCallback(this.updateTimeText, this) // Keep display updated.
        .onComplete.add(this.finishIntroAnimation, this); // Continue animation.
    };

    /*
     * Moves the timer into it's normal position and triggers the timer to start.
     * 
     * 
     */
    PoopTimer.prototype.finishIntroAnimation = function () {
        // Normalize this.seconds after we finish tweening the timer display,
        // since the tween onUpdateCallback tends to not fire for the actual
        // target value.
        this.seconds = this.startTime;
        this.updateTimeText();
        
        game.add.tween(this.scale).to(
            {   x: this.defaultScale.x,
                y: this.defaultScale.y },       // Scale to default size
            400,                                // pretty quickly
            Phaser.Easing.Cubic.InOut,          // with some easing
            true,                               // and start automatically
            250);                               // after a short delay.
        
        game.add.tween(this.cameraOffset).to(
            {   x: this.defaultCameraOffset.x,
                y: this.defaultCameraOffset.y },// Move to default position
            400,                                // pretty quickly
            Phaser.Easing.Cubic.InOut,          // with some easing
            true,                               // and start automatically
            250)                                // after a short delay,
        .onComplete.add(this.startTimer, this); // then start the timer. 
    };
    
    /*
     * Starts the timer.
     */
    PoopTimer.prototype.startTimer = function () {
        this.started = true;
        this.events.onStart.dispatch();
    };

    PoopTimer.prototype.preUpdate = function () {
        if (!this.paused) Phaser.Text.prototype.preUpdate.call(this);
    };

    PoopTimer.prototype.update = function () {
        if (!this.paused && this.started) {
            Phaser.Text.prototype.update.call(this);
            
            this.timeElapsed += game.time.physicsElapsed;
            
            if (this.seconds > 0 && this.timeElapsed >= 1) {
                this.seconds--;
                this.timeElapsed--;
                
                this.timeString = normalizeTimeString(this.seconds);
                this.updateTimeText();
                
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
        seconds = Math.floor(seconds);
        var minutes = Math.floor(seconds / 60);
        seconds %= 60;
        if (seconds < 10) {seconds = "0"+seconds;}
        return minutes+':'+seconds;
    }

    return PoopTimer;
});