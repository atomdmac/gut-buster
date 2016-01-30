define(
['phaser'], 
function (Phaser) {
	
	function StateMachine () {
		this.currentState = null;
		this.states = {};
		this.onStateChange = new Phaser.Signal();
		this.onHandle = new Phaser.Signal();
	}

	StateMachine.extend = function (parent) {
		var sm = parent.stateMachine = new StateMachine();
		sm.parent = parent;
	};

	StateMachine.prototype.setState = function (name) {
		if (!this.states[name]) throw ('State "' + name + '" does not exist.');
		
		// Call old state's _onExit handler if present.
		if(typeof this.states[name]._onExit === 'function') {
			this.states[name]._onExit.call(this.parent || this, name);
		}

		var oldState = this.currentState;
		this.currentState = name;

		// Call new state's _onEnter handler if present.
		if(typeof this.states[name]._onEnter === 'function') {
			this.states[name]._onEnter.call(this.parent || this, oldState);
		}

		// Make listeners aware of the state change.
		this.onStateChange.dispatch(this, name);
	};

	StateMachine.prototype.getState = function () {
		return this.currentState;
	};

	StateMachine.prototype.handle = function (method) {
		if(typeof this.states[this.currentState][method] === 'function') {
			var args = Array.prototype.slice.call(arguments, 1);
			this.states[this.currentState][method].call(this.parent || this, args);
			this.onHandle.dispatch(this, method);
		}
	};

	return StateMachine;

});