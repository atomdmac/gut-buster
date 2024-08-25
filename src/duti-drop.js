define([
    'phaser',
    'utilities/state-machine'
], function (Phaser, StateMachine) { 
    'use strict';

    // Shortcuts
    var game, self;

    function DutiDrop (_game, x, y, key, frame) {

        game = _game;
        self = this;

        // Initialize sprite
        Phaser.Sprite.call(this, game, x, y, key, frame);
        // this.anchor.set(0.5);

        // Enable physics.
        game.physics.enable(this);
        this.body.allowGravity = false;
        this.body.immovable = false;

        // Sprite animations
        // Door opening
        this.animations.add('open', [0, 1, 2, 3], 15);
        // Look terrible
        this.animations.add('stink', [4, 5, 6, 7, 8, 9, 10, 11, 12, 13], 15, true);

        // Create a mask to give the appearance of the player passing through 
        // the door.  This will be applied when the player has collided with the
        // DutiDrop and the "exit" animation is in progress.
        this.maskShape = game.add.graphics(this.x, this.y);
        
        // Don't actually draw the mask when it's not in use.  I mean, I don't 
        // wanna see that shit!  Gross!!
        this.maskShape.alpha = 0;
        
        // Shapes drawn to the Graphics object must be filled.
        this.maskShape.beginFill(0xffffff);

        // Draw the shape that will act as our mask.
        this.maskShape.drawRect(41, -64, 512, 128);

        // Create a statemachine to keep track of whether the DutiDrop is open or closed.
        this.stateMachine = new StateMachine();
        this.stateMachine.states = {
            'ruined': {
                _onEnter: function () {
                    self.animations.play('stink', 15, true);
                }
            },
            'closed': {
                'open': function () {
                    self.stateMachine.setState('opened');
                    self.animations.play('open');
                }
            },
            'opened': {
                'close': function () {
                    self.stateMachine.setState('closed');
                    self.animations.play('close');
                }
            }
        };
        this.stateMachine.setState('closed');
        
    }

    DutiDrop.prototype = Object.create(Phaser.Sprite.prototype);
    DutiDrop.prototype.constructor = DutiDrop;

    /*
     * Wreck the porta-potty.  Great.  Now no one can use it.
     */
    DutiDrop.prototype.ruin = function () {
        this.stateMachine.setState('ruined');
    };

    DutiDrop.prototype.open = function () {
        this.stateMachine.handle('open');
    };

    DutiDrop.prototype.close = function () {
        this.stateMachine.handle('close');
    };

    return DutiDrop;

});