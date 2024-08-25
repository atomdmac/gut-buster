(function () {
    'use strict';

    requirejs.config({
        baseUrl: "src/",
        
        paths: {
            'phaser': 'lib/phaser.min',
            'phaser-transition': 'lib/phaser-state-transition-plugin.min'
        },

        shim: {
            'phaser': {
                exports: 'Phaser'
            },
            'phaser-transition': {
                deps: ['phaser']
            }
        }
    });
 
    require(['phaser', 'game'], function (Phaser, Game) {
        var game = new Game();
        game.start();
    });
}());
