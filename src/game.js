define([
    'phaser',
    'phaser-transition',
    'states/menu',
    'states/play',
    'states/win',
    'states/die',
    'states/game-over'
], function (Phaser, PhaserState, Menu, Play, Win, Die, GameOver) { 
    'use strict';

    function Game() {    
        console.log('Making the Game');    
    }
    
    Game.prototype = {
        constructor: Game,

        start: function() {
            this.game = new Phaser.Game(800, 500, Phaser.AUTO, '', { 
                preload: this.preload, 
                create: this.create,
                init: this.init
            });

        },

        init: function () {
            this.game.stateTransition = this.game.plugins.add(Phaser.Plugin.StateTransition);

            this.game.stateTransition.configure({
                duration: Phaser.Timer.SECOND * 0.8,
                ease: Phaser.Easing.Exponential.InOut,
                properties: {
                    alpha: 0,
                    scale: {
                        x: 1.4,
                        y: 1.4
                    }
                }
            });

            // Keep my pixels crisp and crunchy!
            this.game.stage.smoothed = false;
        },

        preload: function() {
            this.game.load.tilemap('Map1', 'assets/maps/test-map-1.json', null, Phaser.Tilemap.TILED_JSON);
            this.game.load.tilemap('Map2', 'assets/maps/test-map-2.json', null, Phaser.Tilemap.TILED_JSON);
            this.game.load.tilemap('Map3', 'assets/maps/test-map-3.json', null, Phaser.Tilemap.TILED_JSON);
            
            this.game.load.image('moon', 'assets/tilesets/moon.png');
            this.game.load.image('Sci-Fi-Tiles_A2', 'assets/tilesets/Sci-Fi-Tiles_A2.png');
            this.game.load.image('Sci-Fi-Tiles_A4', 'assets/tilesets/Sci-Fi-Tiles_A4.png');
            this.game.load.image('Sci-Fi-Tiles_A5', 'assets/tilesets/Sci-Fi-Tiles_A5.png');
            this.game.load.image('Sci-Fi-Tiles_B',  'assets/tilesets/Sci-Fi-Tiles_B.png');
            this.game.load.image('Sci-Fi-Tiles_C',  'assets/tilesets/Sci-Fi-Tiles_C.png');
            this.game.load.image('Sci-Fi-Tiles_D',  'assets/tilesets/Sci-Fi-Tiles_D.png');
            this.game.load.image('Sci-Fi-Tiles_E',  'assets/tilesets/Sci-Fi-Tiles_E.png');
            this.game.load.image('platformertiles',  'assets/tilesets/platformertiles.png');
            this.game.load.image('cave',  'assets/tilesets/cave_32.png');
            
            // Pause Menu
            this.game.load.image('pause-background', 'assets/pause/background.png');
            
            // HUD;
            this.game.load.image('damage-overlay', 'assets/damage-overlay.png');
            this.game.load.atlas('health', 'assets/hud/health.png', 'assets/hud/health.json');
            this.game.load.atlas('stomach-meter', 'assets/hud/stomach-meter.png', 'assets/hud/stomach-meter.json');
            this.game.load.image('lives', 'assets/hud/lives.png');

            this.game.load.spritesheet('porta-potty', 'assets/sprites/porta-potty.png', 64, 64, 1);
            this.game.load.atlas('player', 'assets/sprites/blobman.png', 'assets/sprites/blobman.json');
            this.game.load.spritesheet('spawner', 'assets/sprites/spawner.png', 32, 32, 1);
            this.game.load.spritesheet('enemy', 'assets/sprites/enemy.png', 33, 27, 1);
            this.game.load.atlas('dipteranura', 'assets/sprites/dipteranura.png', 'assets/sprites/dipteranura.json');
            this.game.load.atlas('egg-sac', 'assets/sprites/egg-sac.png', 'assets/sprites/egg-sac.json');
            this.game.load.atlas('velma-worm', 'assets/sprites/velma-worm.png', 'assets/sprites/velma-worm.json');
            this.game.load.spritesheet('villager', 'assets/sprites/villager.png', 15, 24, 1);
            this.game.load.spritesheet('commander-kavosic', 'assets/sprites/commander-kavosic.png', 26, 30, 1);
            this.game.load.spritesheet('platform', 'assets/sprites/platform.png', 96, 8, 1);
            this.game.load.atlas('bow', 'assets/sprites/bow.png', 'assets/sprites/bow.json');
            this.game.load.atlas('puke', 'assets/sprites/puke.png', 'assets/sprites/puke.json');
            this.game.load.atlas('puke2', 'assets/sprites/puke2.png', 'assets/sprites/puke2.json');
            this.game.load.spritesheet('arrow', 'assets/sprites/arrow.png', 32, 7, 1);
            this.game.load.spritesheet('claw', 'assets/sprites/claw.png', 15, 27, 1);
            this.game.load.spritesheet('claw-arm-ball', 'assets/sprites/claw-arm-ball.png', 8, 8, 1);
            this.game.load.spritesheet('sword-swipe', 'assets/sprites/sword-swipe.png', 64, 128, 8);
            
            // Power-ups
            this.game.load.image('heal', 'assets/sprites/heal.png');
            this.game.load.spritesheet('health-powerup', 'assets/sprites/health-powerup.png', 32, 32, 6);
            this.game.load.image('eat', 'assets/sprites/eat.png');
            this.game.load.spritesheet('food-powerup', 'assets/sprites/food-powerup.png', 32, 32, 6);
            
            // Can be used for anything that doesn't need a sprite sheet.
            // Workaround for issue: https://github.com/photonstorm/phaser/issues/2173
            this.game.load.image('blank', 'assets/blank.png');
        },
        
        create: function() {
            // Add states to our game.
            this.game.state.add('Menu', Menu);
            this.game.state.add('Play', Play);
            this.game.state.add('Win', Win);
            this.game.state.add('Die', Die);
            this.game.state.add('GameOver', GameOver);

            // Now that everything is loaded, show the menu.
            this.game.state.start('Menu');
        }
    };
    
    return Game;
});