define([
    'phaser',
    'player'
], function (Phaser, Player) { 
    'use strict';

    // Shortcuts
    var game, moveKeys, player, map, collisionLayer;

    return {
        // Intro
        init: function () {
            // Shortcut variables.
            game = this.game;
        },
        
        // Main
        create: function () {
            // Player set-up
            player = new Player(game, 144, 736);
            player.events.onOutOfBounds.add(this.playerOutOfBounds, this);
            
            // Create map.
            map = this.game.add.tilemap('Map1');
            
            // Add images to map.
            map.addTilesetImage('Sci-Fi-Tiles_A2', 'Sci-Fi-Tiles_A2');
            map.addTilesetImage('Sci-Fi-Tiles_A4', 'Sci-Fi-Tiles_A4');
            map.addTilesetImage('Sci-Fi-Tiles_A5', 'Sci-Fi-Tiles_A5');
            map.addTilesetImage('Sci-Fi-Tiles_B', 'Sci-Fi-Tiles_B');
            map.addTilesetImage('Sci-Fi-Tiles_C', 'Sci-Fi-Tiles_C');
            map.addTilesetImage('Sci-Fi-Tiles_D', 'Sci-Fi-Tiles_D');
            map.addTilesetImage('Sci-Fi-Tiles_E', 'Sci-Fi-Tiles_E');
            
            // Add layers to map.
            map.createLayer('backdrop')
               .resizeWorld(); // Base world size on the backdrop.
            map.createLayer('background-decoration');
            collisionLayer = map.createLayer('foreground-structure');
            // Insert player here?
            game.add.existing(player);
            map.createLayer('foreground-decoration');
            
            // Physics engine set-up
            game.physics.startSystem(Phaser.Physics.ARCADE);
            game.physics.arcade.gravity.y = 1000;
            
            //  We check bounds collisions against all walls other than the bottom one
            game.physics.arcade.checkCollision.down = false;
            // Assign impasasble tiles for collision.
            map.setCollisionByExclusion([], true, 'foreground-structure');

            // Keyboard input set-up
            moveKeys = game.input.keyboard.createCursorKeys();

            // Camera
            game.camera.follow(player, Phaser.Camera.FOLLOW_LOCKON); 
        },

        update: function () {

            // Collide player with map.
            game.physics.arcade.collide(player, collisionLayer);

            // Player movement controls
            if(moveKeys.up.isDown) {
                player.jump();
            }
            if(moveKeys.left.isDown) {
                player.moveLeft();
            } else if (moveKeys.right.isDown) {
                player.moveRight();
            } else {
                player.stopMoving();
            }
        },
        
        playerOutOfBounds: function() {
            game.state.start('Die');
        }
    };
});