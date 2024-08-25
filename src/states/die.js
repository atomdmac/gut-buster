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

            console.log('Die gets data: ', data);
        },

        update: function () {
            timeRemaining = totalTimeout - (game.time.now - openTime);
            if(timeRemaining < 0) timeRemaining = 0;
            if(timeRemaining === 0) {
                dieTimeoutText.text = 'Press A to Continue\nPress B to Restart';
            } else {
                dieTimeoutText.text = 'Restart in ' + Math.round(timeRemaining/1000);
            }
        },
        
        // Main
        create: function () {
            openTime = game.time.now;
            totalTimeout = 3000;

            dieText = game.add.text(game.width / 2, game.height / 2, 'You died :(', {align: 'center', fill: '#ff0000'});
            dieText.anchor.set(0.5);

            dieTimeoutText = game.add.text(game.width / 2, (game.height / 2) + 50, '', {align: 'left', fill: '#ff0000'});
            dieTimeoutText.anchor.set(0.5);

            game.input.keyboard.onPressCallback = function () {
                if(timeRemaining) return;
                game.input.keyboard.onPressCallback = null;
                console.log('Restarting and passing data: ', data);
                this.game.state.start('Play', false, true, data);
            };
            // Gamepad input setup
            game.input.gamepad.start();
            game.input.gamepad.pad1.onDownCallback = function (buttonCode, value) {
                if(timeRemaining) return;
                switch(buttonCode) {
                    case Phaser.Gamepad.XBOX360_A:
                        this.game.state.start('Play', false, true, data);
                        break;
                        
                    case Phaser.Gamepad.XBOX360_B:
                        this.game.state.start('Play', false, true);
                        break;
                    default:
                }
            };
        }
    };
});