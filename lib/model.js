var Backbone = require('backbone'),
	_ = require('underscore'),
	Type = require('./type'),
	errors = require('./errors'),
	OriginalModel = Backbone.Model,
	originalExtend = OriginalModel.extend,
	originalSet = OriginalModel.prototype.set,
	primitiveTypes = [String, Number, Boolean],
	HyperModel;

function getPropertyDescriptor(name) {
	return {
		get: function() {
			return this.attributes[name];
		},
		set: function(value) {
			this.set(name, value);
			return value;
		},
		enumerable: false
	};
}

function createNativeProperty(Model, name) {
	if (name in Model.prototype || name === 'cid' || name === 'attributes') {
		errors.propertyConflict(Model.prototype, name);
	}

	Object.defineProperty(Model.prototype, name, getPropertyDescriptor(name));
}

function createNativeProperties(Model, protoProps) {
	if (protoProps._types) {
		_.each(protoProps._types, function(Type, name) {
			createNativeProperty(Model, name);
		});
	}

	if (protoProps._properties) {
		_.each(protoProps._properties, function(name) {
			createNativeProperty(Model, name);
		});
	}
}

function setAttribute(key, value, Type) {
	if (Type && value != null) {
		if (primitiveTypes.indexOf(Type) > -1) {
			// use primitive types as is
			value = Type(value);
		}
		else if (!(value instanceof Type)) {
			if (Type.fromJSON) {
				// use fromJSON method to convert to type
				value = Type.fromJSON(value);
			}
			else {
				// use constructor to convert to type
				value = new Type(value);
			}
		}
	}
	else if (Type !== null) {
		errors.unknownAttribute(this, key, value);
	}

	return value;
}

function setDeepAttribute(typesDeep, keys, value) {
	var self = this,
		lastKey = _.last(keys);

	_.each(typesDeep, function(typeValue, typeKey) {
		var keysClone = _.clone(keys).concat([typeKey]);

		// Found a deep type attribute at this level
		if (typeValue instanceof Type) {
			value[typeKey] = setAttribute.call(self,
				keysClone.join('.'),
				value[typeKey],
				typeValue.ctor
			);
		}
		// Need to go a level deeper in the deep types definition
		else if (_.isObject(typeValue)) {
			value[typeKey] = setDeepAttribute.call(self,
				typeValue,
				keysClone,
				value[typeKey]
			);
		}
	});

	return value;
}

module.exports = HyperModel = OriginalModel.extend({

	set: function(key, value, options) {
		var self = this,
			attrs = key;

		if (!_.isObject(key)) {
			(attrs = {})[key] = value;
		}
		else {
			options = value;
		}

		_.each(attrs, function(attrValue, attrKey) {
			// Check for deep object types
			if (self._typesDeep[attrKey]) {
				attrs[attrKey] = setDeepAttribute.call(self,
					self._typesDeep[attrKey], [attrKey], attrValue);
			}
			// Normal attribute set
			else {
				attrs[attrKey] = setAttribute.call(self,
					attrKey, attrValue, self._types[attrKey]);
			}
		});

		return originalSet.call(self, attrs, options);
	},

	toJSON: function() {
		var result = {};

		_.each(this.attributes, function(value, key) {
			result[key] = value && value.toJSON ? value.toJSON() : value;
		});

		return result;
	}

});

HyperModel.extend = function(protoProps, staticProps) {
	protoProps._types = protoProps.types || {};
	if (protoProps.types) {
		delete protoProps.types;
	}
	protoProps._typesDeep = protoProps.typesDeep || {};
	if (protoProps.typesDeep) {
		delete protoProps.typesDeep;
	}
	protoProps._properties = protoProps.properties || {};
	if (protoProps.properties) {
		delete protoProps.properties;
	}

	var Model = originalExtend.call(this, protoProps, staticProps);

	createNativeProperties(Model, protoProps);

	return Model;
};
