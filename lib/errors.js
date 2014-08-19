/* istanbul ignore next */

/**
 * Property conflict error handler
 *
 * @param  {Model} context Model object which triggered the error
 * @param  {String} key The attribute key which caused the conflict
 */
exports.propertyConflict = function(context, key) {
	console.error('[backbone-hyper-model error](extend) Property ' +
		key + ' conflicts with base class members');
};

/**
 * Unknown attribute error handler
 *
 * @param  {Model} context Model object which triggered the error
 * @param  {String} key The attribute key which does not have a type defined
 * @param  {Mixed} value The value of the attribute key
 */
exports.unknownAttribute = function(context, key, value) {
	console.error('[backbone-hyper-model error](set) Attribute "' +
		key + '" has no type.', value, 'In model', context);
};
