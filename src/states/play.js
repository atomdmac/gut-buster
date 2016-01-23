define([
    'phaser',
    'game-group',
    'player',
    'pause-menu',
    'spawner',
    'enemy',
    'cthulbat',
    'worm',
    'dipteranura',
    'egg-sac',
    'commander-kavosic',
    'platform',
    'object-layer-helper',
    'health-display',
    'stomach-meter',
    'damage-display',
    'lives-display',
    'health-powerup',
    'food-powerup',
    'checkpoint',
    'character-trigger',
    'levels/test-map-1'


], function (Phaser, GameGroup, Player, PauseMenu, Spawner, Enemy, Cthulbat, Worm, Dipteranura, EggSac, CommanderKavosic, Platform, ObjectLayerHelper, HealthDisplay, StomachMeter, DamageDisplay, LivesDisplay, HealthPowerup, FoodPowerup, Checkpoint, CharacterTrigger, TestMap1) { 
    'use strict';
    
    // Shortcuts
    var game, playState, moveKeys, attackKeys, pad1, player, pauseMenu, spawners, enemies, characters, map, collisionLayer, platforms, characterTriggers, exitDoor, healthDisplay, stomachMeter, damageDisplay, livesDisplay, collectables, checkpoints, level;

    // Default starting properties/state of the game world. These properties
    // can be overridden by passing a data object to the Play state.
    var initialState,
        defaultInitialState = {
            map: {
                name: 'Map1',
                checkpoint: null
            },
            player: {
                health: null,
                maxHealth: null,
                lives: null,
                maxLives: null
            }
        };

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
        init: function (data) {

            // Shortcut variables.
            game = this.game;
            playState = this;

            // Generate initial game world state data.
            initialState = Phaser.Utils.extend(true, {}, defaultInitialState, data);

        },
        
        // Main
        create: function () {

            var self = this;

            // Player set-up
            player = new Player(game, 0, 0);
            player.events.onOutOfBounds.add(this.onPlayerOutOfBounds, this);
            player.events.onDamage.add(this.onPlayerDamage);
            player.events.onHeal.add(this.onPlayerHeal);
            player.events.onPuke.add(this.onPlayerPuke);
            player.events.onEat.add(this.onPlayerEat);
            player.events.onDeath.add(this.onPlayerDeath);

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
            map = this.game.add.tilemap(initialState.map.name);
            
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

            // Create win trigger
            exitDoor = ObjectLayerHelper.createObjectByName(game, 'door_exit', map, 'triggers');
            game.physics.enable(exitDoor);
            exitDoor.body.allowGravity = false;
            exitDoor.body.immovable = true;
            game.add.existing(exitDoor);

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

            // Apply prior player state (if it exists).
            player.health    = initialState.player.health ? initialState.player.health : player.health;
            player.maxHealth = initialState.player.maxHealth ? initialState.player.maxHealth : player.maxHealth;
            player.lives     = initialState.player.lives ? initialState.player.lives : player.lives;
            player.maxLives  = initialState.player.maxLives ? initialState.player.maxLives : player.maxLives;

            // Add checkpoints
            checkpoints = ObjectLayerHelper.createObjectsByType(game, 'checkpoint', map, 'checkpoints', Checkpoint);
            game.add.existing(checkpoints);

            // Drop player at last checkpoint (if necessary).
            if(initialState.map.checkpoint) {
                player.x = initialState.map.checkpoint.x;
                player.y = initialState.map.checkpoint.y;
            }

            // Insert enemies
            enemies = [];
            spawners = new GameGroup(game);
            spawners = ObjectLayerHelper.createObjectsByType(game, 'spawner', map, 'spawners', Spawner, spawners);
            spawners.forEach(this.registerSpawnerEvents, this);
            game.add.existing(spawners);

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


            // Platforms
            platforms = new GameGroup(game);
            platforms = ObjectLayerHelper.createObjectsByType(game, 'platform', map, 'platforms', Platform, platforms);
            game.add.existing(platforms);
            platforms.callAll('start');

            // Collectables
            collectables = new GameGroup(game);
            collectables = ObjectLayerHelper.createObjectsByType(game, 'health-powerup', map, 'collectables', HealthPowerup, collectables);
            ObjectLayerHelper.createObjectsByType(game, 'food-powerup', map, 'collectables', FoodPowerup, collectables);
            game.add.existing(collectables);
            
            // HUD
            damageDisplay = new DamageDisplay(game, 0, 0);
            game.add.existing(damageDisplay);
            damageDisplay.setMaxHealth(player.maxHealth);
            damageDisplay.updateDisplay(player.health);

            healthDisplay = new HealthDisplay(game, 10, 10, 'health-bar-cap-left', 'health-bar-middle', 'health-bar-cap-right', 'health-bar-fill');
            game.add.existing(healthDisplay);
            healthDisplay.setMaxHealth(player.maxHealth);
            healthDisplay.updateDisplay(player.health);
            
            stomachMeter = new StomachMeter(game, 0, 0);
            game.add.existing(stomachMeter);
            stomachMeter.updateDisplay(player.fullness / player.maxFullness);

            livesDisplay = new LivesDisplay(game, 20, 20, 'life', 'empty-life');
            game.add.existing(livesDisplay);
            livesDisplay.updateDisplay(player.lives, player.maxLives);

            // Pause Menu
            pauseMenu = new PauseMenu(game);
            game.add.existing(pauseMenu);
            // Disable pauseMenu by default.
            pauseMenu.disable();
            
            // Keyboard input set-up
            moveKeys = game.input.keyboard.createCursorKeys();
            moveKeys.wasd = {
                up: game.input.keyboard.addKey(Phaser.Keyboard.W),
                down: game.input.keyboard.addKey(Phaser.Keyboard.S),
                left: game.input.keyboard.addKey(Phaser.Keyboard.A),
                right: game.input.keyboard.addKey(Phaser.Keyboard.D)
            };
            moveKeys.wasd.up.onDown.add(function () {
                // Direct input to player if not paused.
                if (!player.paused) {
                    // As long as the player isn't intentionally attempting to fall
                    // through a platform, attempt to jump.
                    if(!keyboardJumpAndDownPressed()) player.jump();
                }
            });
            moveKeys.wasd.up.onUp.add(function () {
                // Direct input to player if not paused.
                if (!player.paused) {
                    player.endJump();
                }
            });
            attackKeys = {
                sword: game.input.keyboard.addKey(Phaser.Keyboard.COMMA),
                puker: game.input.keyboard.addKey(Phaser.Keyboard.PERIOD),
                claw: game.input.keyboard.addKey(Phaser.Keyboard.QUESTION_MARK)
            };
            attackKeys.sword.onDown.add(function () {
                // Direct input to player if not paused.
                if (!player.paused) {
                    player.attackSword();
                }
            });
            attackKeys.puker.onDown.add(function () {
                // Direct input to player if not paused.
                if (!player.paused) {
                    player.attackPuker();
                }
            });
            attackKeys.claw.onDown.add(function () {
                // Direct input to player if not paused.
                if (!player.paused) {
                    player.attackClaw();
                }
            });
            game.input.keyboard.addKey(Phaser.Keyboard.F).onDown.add(function() {
                if(game.scale.isFullScreen) {
                    game.scale.stopFullScreen();
                } else {
                    game.scale.startFullScreen();
                }
            });
            game.input.keyboard.addKey(Phaser.Keyboard.SPACE).onDown.add(function () {
                // Direct input to player if not paused.
                if (!player.paused) {
                    // Check to see if player has reached the exit door.
                    if(game.physics.arcade.overlap(player, exitDoor)) {
                        self.playerExits();
                    }
                }
            });

            game.input.keyboard.addKey(Phaser.Keyboard.P).onDown.add(this.togglePause);
            
            // Gamepad input setup
            game.input.gamepad.start();
            pad1 = game.input.gamepad.pad1;
            pad1.onDownCallback = function (buttonCode, value) {
                
                // Direct input to player if not paused.
                if (!player.paused) {
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
                            player.attackPuker();
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
                        case Phaser.Gamepad.XBOX360_START:
                            playState.togglePause();
                            break;
    
                        default:
                            break;
                    }
                }
                // Direct input to pauseMenu when paused.
                else {
                    switch (buttonCode) {
                        case Phaser.Gamepad.XBOX360_START:
                            playState.togglePause();
                            break;
    
                        default:
                            break;
                    }
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

        },

        render: function () {
            //var body = player.weapons.sword.getCollidables();
            //if(body) game.debug.body(body);
            /*)enemies.forEach(function (enemy) {
                if (enemy.behavior.hunter) game.debug.geom(enemy.behavior.hunter.lineHunting);
            });*/
        },

        update: function () {
            // Direct input to player and do all the map and collision stuff.
            if (!player.paused) {
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
                    // Check to see if weapons are colliding collision layer.
                    game.physics.arcade.collide(currentWeapon.getCollidables(), collisionLayer, currentWeapon.onHitTerrain);
                }
    
                // Check to see if weapons are colliding with collectables.
                game.physics.arcade.overlap(player.weapons.clawArm.getCollidables(), collectables, currentWeapon.onHit);
    
                // Collide player + enemies.
                game.physics.arcade.overlap(player, enemies, this.onPlayerCollidesEnemy);
                
                // Check overlap of player + character triggers.
                game.physics.arcade.overlap(player, characterTriggers, this.onPlayerOverlapCharacterTrigger);
                
                // Collide player + collectables.
                game.physics.arcade.overlap(player, collectables, this.onPlayerCollidesCollectable);
    
                game.physics.arcade.overlap(player, checkpoints, this.onPlayerCollidesCheckpoint);
    
                // Collide objects with map.  Do this after other collision checks
                // so objects aren't pushed through walls.
                game.physics.arcade.collide(player, collisionLayer);
                game.physics.arcade.collide(characters, collisionLayer);
                game.physics.arcade.collide(enemies, collisionLayer);
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
                
                if (attackKeys.puker.isDown ||
                    pad1.isDown(Phaser.Gamepad.XBOX360_X)) {
                    player.attackPuker();
                }
            }
            // Direct input to PauseMenu when paused.
            else {
                
            }
        },

        shutdown: function () {
            // This prevents occasional momentary "flashes" during state transitions.
            game.camera.unfollow();
            pad1.onDownCallback = undefined;
        },

        togglePause: function () {
            if(player.paused) {
                player.paused = false;
                collectables.paused = false;
                platforms.paused = false;
                
                // This is dumb. Enemies should just be a GameGroup, but I'm lazy.
                for (var lcv = 0; lcv < enemies.length; lcv++) {
                    enemies[lcv].paused = false;
                }
                
                // Disable pauseMenu.
                pauseMenu.disable();
            } else {
                player.paused = true;
                collectables.paused = true;
                platforms.paused = true;
                
                // This is dumb. Enemies should just be a GameGroup, but I'm lazy.
                for (var lcv = 0; lcv < enemies.length; lcv++) {
                    enemies[lcv].paused = true;
                }
                
                // Enable pauseMenu.
                pauseMenu.enable();
            }
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
            if(!enemy.invulnerable && !enemy.dying) player.damage(0.5, enemy);
        },

        onPlayerCollidesCheckpoint: function (player, checkpoint) {
            console.log('colliding checkpoint');
            initialState.map.checkpoint = checkpoint;
        },
        
        onEnemyDeath: function (enemy) {},

        onEnemyDrop: function (enemy, item) {
            collectables.add(item);
        },

        onPlayerDamage: function (totalHealth, amount) {
            console.log('health: ', totalHealth);

            // Update HUD
            healthDisplay.updateDisplay(player.health);

            // Update damage display.
            damageDisplay.updateDisplay(player.health);
        },

        onPlayerHeal: function (totalHealth, amount) {
            console.log('health: ', totalHealth);

            // Update HUD
            healthDisplay.updateDisplay(player.health);
            damageDisplay.updateDisplay(player.health);
        },
        
        onPlayerPuke: function () {
            // Update HUD
            stomachMeter.updateDisplay(player.fullness / player.maxFullness);
        },
        
        onPlayerEat: function () {
            // Update HUD
            stomachMeter.updateDisplay(player.fullness / player.maxFullness);
        },

        onPlayerDeath: function (player) {
            game.camera.unfollow();

            // Player has more lives and will get another chance!
            if(player.lives > 1) {
                // Decrement player lives.
                player.removeLife();

                game.stateTransition.to('Die', true, false, {
                    map: {
                        name: initialState.map.name,
                        checkpoint: initialState.map.checkpoint
                    },
                    player: {
                        // Start w/ maximum health
                        health: player.maxHealth,
                        maxHealth: player.maxHealth,
                        lives: player.lives,
                        maxLives: player.maxLives
                    }
                });
            }

            // Player has no more lives left :(.  Game over.
            else {
                game.stateTransition.to('GameOver', true, false);
            }
        },
            
        onPlayerCollidesCollectable: function (player, collectable) {
            collectable.useOn(player);
            collectable.destroy();
        },
        
        onPlayerOutOfBounds: function() {
            game.camera.unfollow();
        },

        playerExits: function () {
            // Switch to the "win" state.
            game.camera.unfollow();
            game.stateTransition.to('Play', true, false, {
                map: {
                    name: exitDoor.properties.mapLink
                },
                player: {
                    // Start w/ same health on next map as player has now.
                    health: player.health,
                    maxHealth: player.maxHealth,
                    lives: player.lives,
                    maxLives: player.maxLives
                }
            });
        }
    };
});