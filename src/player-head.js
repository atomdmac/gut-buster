define([
    'phaser',
    'game-sprite',
    'puker',
    'utilities/state-machine'
], function (Phaser, GameSprite, Puker, StateMachine) { 
    'use strict';

    // Shortcuts
    var game, self;

    function PlayerHead (_game, x, y, key, frame) {

        game = _game;
        self = this;

        // Initialize sprite
        Phaser.Sprite.call(this, game, x, y, 'player-head', 0);
        this.anchor.set(0.5);

        // Create puker
        this.puker = new Puker(game, 25, 14);
        this.puker.anchor.set(0.5);
        this.addChild(this.puker);

        // Enable physics.
        game.physics.enable(this);
        this.body.immovable = true;
        this.body.allowGravity = false;
        // this.body.collideWorldBounds = true;

        // Set up animations.
        this.animations.add('puke', [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,13,12,11,10,9,8,7,6,5,4,3,2,1], 60, true);

        // Set up state machine.
        this.stateMachine = new StateMachine();
        this.stateMachine.parent = this;
        this.stateMachine.states = {
            'smiling': {
                _onEnter: function (oldState) {
                    this.animations.stop();
                    this.frame = 0;
                },
                startPuking: function () {
                    if(self.frame === 0) {
                        this.stateMachine.setState('puking');
                        return true;
                    }
                    return false;
                }
            },
            'puking': {
                _onEnter: function (oldState) {
                    this.animations.play('puke', null, false);
                },
                update: function () {
                    var anim = self.animations.currentAnim;
                    if(anim.name == 'puke' && anim.isFinished) {
                        this.stateMachine.setState('smiling');
                    } else if(anim.name == 'puke' && anim.frame > 5) {
                        this.puker.use();
                    }
                },
                stopPuking: function () {
                    if(self.animations.currentAnim.isFinished) {
                        this.stateMachine.setState('smiling');
                        return true;
                    }
                    return false;
                }
            }
        };
        this.stateMachine.setState('smiling');
        
    }

    PlayerHead.prototype = Object.create(Puker.prototype);
    PlayerHead.prototype.constructor = PlayerHead;

    PlayerHead.prototype.update = function () {
        this.stateMachine.handle('update');
        Puker.prototype.update.call(this);
    };

    PlayerHead.prototype.use = function () {
        return this.stateMachine.handle('startPuking');
    };
    PlayerHead.prototype.smile = function () {
        return this.stateMachine.handle('stopPuking');
    };
    PlayerHead.prototype.getCollidables = function () {
        return this.puker.getCollidables();
    };

    return PlayerHead;

});