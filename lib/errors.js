/**
 * Overrideable error handlers
 *
 * @type {Object}
 */
module.exports = {
	propertyConflict: function(context, key) {
		console.error('[backbone-hyper-model error](extend) Property ' +
			key + ' conflicts with base class members');
	},

	unknownAttribute: function(context, key, value) {
		console.error('[backbone-hyper-model error](set) Attribute "' +
			key + '" has no type.', value, 'In model', context);
	}
};
