function Type(ctor) {
	this.ctor = ctor;
}

/**
 * Initializer helper method
 *
 * @example
 *   var Hyper = require('backbone-hyper-model');
 *   var Type = Hyper.Type;
 *   Type.of(Date); // returns a new Type object
 *
 * @param  {Function} ctor
 * @return {Type}
 */
Type.of = function(ctor) {
	return new Type(ctor);
};

module.exports = Type;
