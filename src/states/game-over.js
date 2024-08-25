define([
    'phaser'
], function (Phaser) { 
    'use strict';

    // Shortcuts
    var game, dieText, dieTimeoutText, openTime, time, totalTimeout, timeRemaining, data;

    return {
        // Intro
        init: function (_data) {
            // Shortcut variables.
            game = this.game;
            data = _data;
        },

        update: function () {
            timeRemaining = totalTimeout - (game.time.now - openTime);
            if(timeRemaining < 0) timeRemaining = 0;
        },
        
        // Main
        create: function () {
            openTime = game.time.now;
            totalTimeout = 3000;

            dieText = game.add.text(game.width / 2, game.height / 2, 'Game Over, man...', {align: 'center', fill: '#ff0000'});
            dieText.anchor.set(0.5);

            game.input.keyboard.onPressCallback = function () {
                if(timeRemaining) return;
                game.input.keyboard.onPressCallback = null;
                this.game.state.start('Menu', true, false, data);
            };
            // Gamepad input setup
            game.input.gamepad.start();
            game.input.gamepad.pad1.onDownCallback = function (buttonCode, value) {
                if(timeRemaining) return;
                this.game.state.start('Menu', true, false, data);
            };
        }
    };
});