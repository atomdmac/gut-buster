define([
    'phaser',
    'player',
    'spawner',
    'enemy',
    'cthulbat',
    'worm',
    'dipteranura',
    'egg-sac',
    'villager',
    'commander-kavosic',
    'platform',
    'object-layer-helper',
    'health-display',
    'health-powerup',
    'character-trigger',
    'levels/test-map-1'
], function (Phaser, Player, Spawner, Enemy, Cthulbat, Worm, Dipteranura, EggSac, Villager, CommanderKavosic, Platform, ObjectLayerHelper, HealthDisplay, HealthPowerup, CharacterTrigger, TestMap1) { 
    'use strict';

    // Shortcuts
    var game, moveKeys, pad1, player, spawners, enemies, villagers, characters, map, collisionLayer, platforms, characterTriggers, exitDoor, healthDisplay, collectables, level, sounds;

    // Helper functions 

    // Used to determine if the user is pressing the key combo  on the keyboard 
    // to trigger falling through platforms.
    function keyboardJumpAndDownPressed() {
        return (moveKeys.wasd.down.isDown && moveKeys.wasd.up.isDown);
    }

    // Used to determine if the user isp ressing the button combo on the gamepad
    // to trigger falling through platforms.
    function gamepadJumpAndDownPressed() {
        return (pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) > 0.9 && pad1.isDown(Phaser.Gamepad.XBOX360_A));
    }

    return {
        // Intro
        init: function (mapName) {
            // Shortcut variables.
            game = this.game;
            
            // Set map name.
            map = mapName || 'Map1';
        },
        
        // Main
        create: function () {

            var self = this;

            // Player set-up
            player = new Player(game, 0, 0);
            player.events.onOutOfBounds.add(this.playerOutOfBounds, this);
            player.events.onDamage.add(this.onPlayerDamage);
            player.events.onHeal.add(this.onPlayerHeal);

            // Make player accessible via game object.
            game.player = player;
            
            game.spriteClassTypes = {
                'enemy': Enemy,
                'cthulbat': Cthulbat,
                'worm': Worm,
                'dipteranura': Dipteranura,
                'egg-sac': EggSac
            };

            // Create map.
            map = this.game.add.tilemap(map);
            
            // Add images to map.
            map.addTilesetImage('Sci-Fi-Tiles_A2', 'Sci-Fi-Tiles_A2');
            map.addTilesetImage('Sci-Fi-Tiles_A4', 'Sci-Fi-Tiles_A4');
            map.addTilesetImage('Sci-Fi-Tiles_A5', 'Sci-Fi-Tiles_A5');
            map.addTilesetImage('Sci-Fi-Tiles_B', 'Sci-Fi-Tiles_B');
            map.addTilesetImage('Sci-Fi-Tiles_C', 'Sci-Fi-Tiles_C');
            map.addTilesetImage('Sci-Fi-Tiles_D', 'Sci-Fi-Tiles_D');
            map.addTilesetImage('Sci-Fi-Tiles_E', 'Sci-Fi-Tiles_E');
            map.addTilesetImage('platformertiles', 'platformertiles');
            map.addTilesetImage('moon', 'moon');
            map.addTilesetImage('cave', 'cave');

            
            // Add layers to map.
            map.createLayer('backdrop')
               .resizeWorld(); // Base world size on the backdrop.
            map.createLayer('background-decoration');
            collisionLayer = map.createLayer('foreground-structure');

            // Make the collision layer globally accessiable via 'game'.
            game.collisionLayer = collisionLayer;

            // Insert Commander Kavosic
            characters = ObjectLayerHelper.createObjectsByType(game, 'commander-kavosic', map, 'characters', CommanderKavosic);
            //characters.forEach(this.registerEnemyEvents, this);
            game.add.existing(characters);
            
            // Spawn point
            var spawnPoint = ObjectLayerHelper.createObjectByName(game, 'player_spawn', map, 'spawns');

            // Insert player here?
            game.add.existing(player);
            player.x = spawnPoint.x;
            player.y = spawnPoint.y;

            // Insert enemies
            enemies = [];
            spawners = ObjectLayerHelper.createObjectsByType(game, 'spawner', map, 'spawners', Spawner);
            spawners.forEach(this.registerSpawnerEvents, this);
            game.add.existing(spawners);

            // Insert villagers
            villagers = ObjectLayerHelper.createObjectsByType(game, 'villager', map, 'villagers', Villager);
            game.add.existing(villagers);

            map.createLayer('foreground-decoration');

            // Physics engine set-up
            game.physics.startSystem(Phaser.Physics.ARCADE);
            game.physics.arcade.gravity.y = 1000;
            
            //  We check bounds collisions against all walls other than the bottom one
            game.physics.arcade.checkCollision.down = false;
            // Assign impasasble tiles for collision.
            map.setCollisionByExclusion([], true, 'foreground-structure');

            // Create character plot triggers
            level = new TestMap1();
            //game.add.existing(level);
            characterTriggers = ObjectLayerHelper.createObjectsByType(game, 'character-trigger', map, 'triggers', CharacterTrigger);
            game.add.existing(characterTriggers);

            // Create win trigger
            exitDoor = ObjectLayerHelper.createObjectByName(game, 'door_exit', map, 'triggers');
            game.physics.enable(exitDoor);
            exitDoor.body.allowGravity = false;
            exitDoor.body.immovable = true;
            game.add.existing(exitDoor);

            // Platforms
            platforms = ObjectLayerHelper.createObjectsByType(game, 'platform', map, 'platforms', Platform);
            game.add.existing(platforms);
            platforms.callAll('start');

            // Collectables
            collectables = ObjectLayerHelper.createObjectsByType(game, 'health-powerup', map, 'collectables', HealthPowerup);
            game.add.existing(collectables);
            
            // HUD
            healthDisplay = new HealthDisplay(game, 10, 10, 'health-bar-cap-left', 'health-bar-middle', 'health-bar-cap-right', 'health-bar-fill');
            game.add.existing(healthDisplay);
            healthDisplay.setMaxHealth(player.maxHealth);
            healthDisplay.updateDisplay(player.health);

            // Keyboard input set-up
            moveKeys = game.input.keyboard.createCursorKeys();
            moveKeys.wasd = {
                up: game.input.keyboard.addKey(Phaser.Keyboard.W),
                down: game.input.keyboard.addKey(Phaser.Keyboard.S),
                left: game.input.keyboard.addKey(Phaser.Keyboard.A),
                right: game.input.keyboard.addKey(Phaser.Keyboard.D)
            };
            moveKeys.wasd.up.onDown.add(function () {
                // As long as the player isn't intentionally attempting to fall
                // through a platform, attempt to jump.
                if(!keyboardJumpAndDownPressed()) player.jump();
            });
            moveKeys.wasd.up.onUp.add(function () {
                player.endJump();
            });
            game.input.keyboard.addKey(Phaser.Keyboard.COMMA).onDown.add(function () {
                player.attackSword();
            });
            game.input.keyboard.addKey(Phaser.Keyboard.PERIOD).onDown.add(function () {
                player.attackBow();
            });
            game.input.keyboard.addKey(Phaser.Keyboard.QUESTION_MARK).onDown.add(function () {
                player.attackClaw();
            });
            game.input.keyboard.addKey(Phaser.Keyboard.F).onDown.add(function() {
                if(game.scale.isFullScreen) {
                    game.scale.stopFullScreen();
                } else {
                    game.scale.startFullScreen();
                }
            });
            game.input.keyboard.addKey(Phaser.Keyboard.SPACE).onDown.add(function () {
                // Check to see if player has reached the exit door.
                if(game.physics.arcade.overlap(player, exitDoor)) {
                    self.playerExits();
                }
            });
            
            // Gamepad input setup
            game.input.gamepad.start();
            pad1 = game.input.gamepad.pad1;
            pad1.onDownCallback = function (buttonCode, value) {
                switch (buttonCode) {
                    case Phaser.Gamepad.XBOX360_A:
                        // HACK: Phaser has a bug where it doesn't update button
                        // down/up state of a button object until after it has
                        // fired the onDownCallback.  To get around this, we
                        // manually update the button state here.  A bug report
                        // has been filed here: https://github.com/photonstorm/phaser/issues/2159
                        pad1.getButton(buttonCode).start(null, value);

                        // As long as the player isn't intentionally attempting 
                        // to fall through a platform, attempt to jump.
                        if(!gamepadJumpAndDownPressed()) player.jump();
                        break;
                    case Phaser.Gamepad.XBOX360_B:
                        player.attackSword();
                        break;
                    case Phaser.Gamepad.XBOX360_X:
                        player.attackBow();
                        break;
                    case Phaser.Gamepad.XBOX360_Y:
                        player.attackClaw();
                        break;
                    case Phaser.Gamepad.XBOX360_RIGHT_BUMPER:
                        // Check to see if player has reached the exit door.
                        if(game.physics.arcade.overlap(player, exitDoor)) {
                            self.playerExits();
                        }
                        break;

                    default:
                        break;
                }
            };
            pad1.onUpCallback = function (buttonCode, value) {
                switch(buttonCode) {
                    case Phaser.Gamepad.XBOX360_A:
                        player.endJump();
                        break;
                    default:
                        break;
                }
            };
            
            // Camera
            game.camera.follow(player, Phaser.Camera.FOLLOW_PLATFORMER);
            
            // Aucio
            sounds = [
                game.add.audio('clearing-minds')
            ];
            
            //  Being mp3 files these take time to decode, so we can't play them instantly
            //  Using setDecodedCallback we can be notified when they're ALL ready for use.
            //  The audio files could decode in ANY order, we can never be sure which it'll be.
            game.sound.setDecodedCallback(sounds, self.startLoopSound, self);
        },
        
        startLoopSound: function(sound) {
            sounds[0].loopFull(0.6);
        },

        /*
        render: function () {
            var body = player.weapon.getCollidables();
            if(body) game.debug.body(body);
            enemies.forEach(function (enemy) {
                if (enemy.behavior.hunter) game.debug.geom(enemy.behavior.hunter.lineHunting);
            });
        },
        */

        update: function () {
            // Collide with platforms unless the user presses jump+down on the
            // keyboard *or* the controller (but not both).
            if(!keyboardJumpAndDownPressed() && !gamepadJumpAndDownPressed()) {
                game.physics.arcade.collide(player, platforms);
            }

            // Check weapon collisions.
            var currentWeapon;
            for(var w=0; w<player.weapons.length; w++) {
                currentWeapon = player.weapons[w];
                
                // Check to see if weapons are colliding with enemies.
                game.physics.arcade.overlap(currentWeapon.getCollidables(), enemies, currentWeapon.onHit);
                game.physics.arcade.overlap(currentWeapon.getCollidables(), villagers, currentWeapon.onHit);
                // Check to see if weapons are colliding with collectables.
                game.physics.arcade.overlap(currentWeapon.getCollidables(), collectables, currentWeapon.onHit);
                // Check to see if weapons are colliding collision layer.
                game.physics.arcade.collide(currentWeapon.getCollidables(), collisionLayer, currentWeapon.onHitTerrain);
            }

            // Collide player + enemies.
            game.physics.arcade.overlap(player, enemies, this.onPlayerCollidesEnemy);
            
            // Check overlap of player + character triggers.
            game.physics.arcade.overlap(player, characterTriggers, this.onPlayerOverlapCharacterTrigger);
            
            // Collide player + collectables.
            game.physics.arcade.overlap(player, collectables, this.onPlayerCollidesCollectable);

            // Collide objects with map.  Do this after other collision checks
            // so objects aren't pushed through walls.
            game.physics.arcade.collide(player, collisionLayer);
            game.physics.arcade.collide(characters, collisionLayer);
            game.physics.arcade.collide(enemies, collisionLayer);
            game.physics.arcade.collide(villagers, collisionLayer);
            game.physics.arcade.collide(collectables, collisionLayer);

            // Player movement controls
            if(moveKeys.wasd.left.isDown ||
               pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_LEFT) ||
               pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) < -0.6) {
                player.moveLeft();
            } else if (moveKeys.wasd.right.isDown ||
               pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_RIGHT) ||
               pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) > 0.6) {
                player.moveRight();
            } else {
                player.stopMoving();
            }
        },

        shutdown: function () {
            // This prevents occasional momentary "flashes" during state transitions.
            game.camera.unfollow();
            pad1.onDownCallback = undefined;
        },
        
        registerSpawnerEvents: function (spawner) {
            spawner.sprites.forEach(this.registerEnemyEvents, this);
            spawner.events.onSpawn.add(this.onSpawnerSpawn, this);
        },
        
        
        registerEnemyEvents: function (enemy) {
            enemies.push(enemy);
            enemy.events.onDeath.add(this.onEnemyDeath, this);
            enemy.events.onDrop.add(this.onEnemyDrop, this);
            if (enemy.events.onSpawnChild) enemy.events.onSpawnChild.add(this.onSpawnerSpawn, this);
        },
        
        registerVillagerEvents: function (villager) {
            villager.events.onDeath.add(this.onVillagerDeath, this);
        },
        
        onPlayerOverlapCharacterTrigger: function (player, characterTrigger) {
            characters.forEach( function(character) {
                if (character.name === characterTrigger.properties.characterTriggerTarget) {
                    level.handleTrigger(character, characterTrigger.properties.key, characterTrigger.properties);
                }
            });
        },
        
        onSpawnerSpawn: function(spawner, sprite) {
            this.registerEnemyEvents(sprite);
        },
        
        onPlayerCollidesEnemy: function (player, enemy) {
            if(!enemy.invulnerable && !enemy.dying) player.damage(4, enemy);
        },
        
        onEnemyDeath: function (enemy) {},

        onEnemyDrop: function (enemy, item) {
            collectables.add(item);
        },
        
        onVillagerDeath: function (villager) {},

        onPlayerDamage: function (totalHealth, amount) {
            console.log('health: ', totalHealth);

            // Update HUD
            healthDisplay.updateDisplay(player.health);

            // Is the player dead?
            if(totalHealth <= 0) {
                game.camera.unfollow();
                game.stateTransition.to('Die', true);
            }
        },

        onPlayerHeal: function (totalHealth, amount) {
            console.log('health: ', totalHealth);

            // Update HUD
            healthDisplay.updateDisplay(player.health);
        },
            
        onPlayerCollidesCollectable: function (player, collectable) {
            collectable.useOn(player);
            collectable.destroy();
        },
        
        playerOutOfBounds: function() {
            // Switch to the "death" state.
            game.stateTransition.to('Die', true);
        },

        playerExits: function () {
            // Switch to the "win" state.
            game.stateTransition.to('Play', true, false, exitDoor.properties.mapLink);
        }
    };
});