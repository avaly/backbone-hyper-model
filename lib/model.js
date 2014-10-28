var Backbone = require('backbone'),
	_ = require('underscore'),
	extend = require('node.extend'),
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

function createNativeProperty(ModelProto, name) {
	if (name === 'cid' || name === 'attributes') {
		errors.propertyConflict(ModelProto, name);
	}

	Object.defineProperty(ModelProto, name, getPropertyDescriptor(name));
}

function createNativeProperties(Model, protoProps) {
	if (protoProps._types) {
		_.each(protoProps._types, function(Type, name) {
			createNativeProperty(Model.prototype, name);
		});
	}

	if (protoProps._properties) {
		_.each(protoProps._properties, function(name) {
			createNativeProperty(Model.prototype, name);
		});
	}
}

function setAttribute(key, value, Type, options) {
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
				value = new Type(value, options);
			}
		}
	}
	else if (Type !== null) {
		errors.unknownAttribute(this, key, value);
	}

	return value;
}

function setDeepAttribute(typesDeep, keys, value, options) {
	var self = this,
		lastKey = _.last(keys);

	if (!value) {
		return value;
	}

	_.each(typesDeep, function(typeValue, typeKey) {
		var keysClone = _.clone(keys).concat([typeKey]);

		// Found a deep type attribute at this level
		if (typeValue instanceof Type) {
			value[typeKey] = setAttribute.call(self,
				keysClone.join('.'),
				value[typeKey],
				typeValue.ctor,
				options
			);
		}
		// Need to go a level deeper in the deep types definition
		else if (_.isObject(typeValue)) {
			value[typeKey] = setDeepAttribute.call(self,
				typeValue,
				keysClone,
				value[typeKey],
				options
			);
		}
	});

	return value;
}

function toJSONAttribute(value) {
	return value && value.toJSON ? value.toJSON() : value;
}

function toJSONDeepAttribute(typesDeep, keys, value) {
	var self = this,
		lastKey = _.last(keys);

	if (!value) {
		return value;
	}

	_.each(typesDeep, function(typeValue, typeKey) {
		var keysClone = _.clone(keys).concat([typeKey]);

		// Found a deep type attribute at this level
		if (typeValue instanceof Type) {
			value[typeKey] = toJSONAttribute.call(self, value[typeKey]);
		}
		// Need to go a level deeper in the deep types definition
		else if (_.isObject(typeValue)) {
			value[typeKey] = toJSONDeepAttribute.call(self,
				typeValue,
				keysClone,
				value[typeKey]
			);
		}
	});

	return value;
}

HyperModel = OriginalModel.extend({

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
					self._typesDeep[attrKey], [attrKey], attrValue, options);
			}
			// Normal attribute set
			else {
				attrs[attrKey] = setAttribute.call(self,
					attrKey, attrValue, self._types[attrKey], options);
			}
		});

		return originalSet.call(self, attrs, options);
	},

	toJSON: function() {
		var self = this,
			result = {};

		_.each(self.attributes, function(value, key) {
			// Check for deep object types
			if (self._typesDeep[key]) {
				result[key] = toJSONDeepAttribute.call(self, self._typesDeep[key], [key], value);
			}
			// Normal attribute toJSON
			else {
				result[key] = toJSONAttribute.call(self, value);
			}
		});

		return result;
	}

});

/**
 * Extends the Model with the following features defined via `protoProps`:
 *
 * - `types`: an object hash defining the types and attributes name which should be used for conversion when setting the values of those attributes
 * - `typesDeep`: an deep object hash defining which deep object attributes should be converted; the individual deep properties types should be defined using `Type.of(Constructor)`
 * - `properties`: an array of attribute names which are just created as native properties on the Model
 *
 * @example
 *   var Hyper = require('backbone-hyper-model');
 *   var Person = Hyper.Model.extend({
 *     types: {
 *       name: String,
 *       employed_at: Date,
 *       salary: Number
 *     }
 *   });
 *   var person = new Person();
 *
 *   // Types are created as native properties on the Model and are converted to their specific types
 *   person.name = 'John';
 *   person.employed_at = '2013-06-23 12:14:00';
 *   console.log(person.employed_at.getTime()); // Attribute was converted to Date
 *   person.salary = '123456';
 *   console.log(typeof person.salary); // Number
 *
 * @example
 *   var Hyper = require('backbone-hyper-model');
 *   var Person = Hyper.Model.extend({
 *     properties: ['gender', 'age']
 *   });
 *   var person = new Person();
 *
 *   // Properties are just created as native properties on the Model
 *   person.gender = 'male';
 *   person.age = 35;
 *
 * @example
 *   var Hyper = require('backbone-hyper-model');
 *   var Type = Hyper.Type;
 *   var Person = Hyper.Model.extend({
 *     typesDeep: {
 *       dates: {
 *         employed_at: Type.of(Date),
 *         other: {
 *           fired_at: Type.of(Date)
 *         }
 *       }
 *     }
 *   });
 *   var person = new Person({
 *     dates: {
 *       employed_at: '2013-06-23 12:14:00',
 *       other: {
 *         fired_at: '2014-03-16 15:25:00'
 *       }
 *     }
 *   });
 *
 *   // Deep types are only converted to their specific types
 *   console.log(person.get('dates').employed_at.getTime()); // Attribute was converted to Date
 *   console.log(person.get('dates').other.fired_at.getTime()); // Attribute was converted to Date
 *
 * @param  {Object} protoProps
 * @param  {Object} staticProps
 * @return {HyperModel}
 */
HyperModel.extend = function(protoProps, staticProps) {
	var BaseProto = this.prototype;

	protoProps._types = extend(true, {}, BaseProto._types || {});
	if (protoProps.types) {
		protoProps._types = extend(true, protoProps._types, protoProps.types);
		delete protoProps.types;
	}

	protoProps._typesDeep = extend(true, {}, BaseProto._typesDeep || {});
	if (protoProps.typesDeep) {
		protoProps._typesDeep = extend(true, protoProps._typesDeep, protoProps.typesDeep);
		delete protoProps.typesDeep;
	}

	protoProps._properties = (BaseProto._properties ? BaseProto._properties.slice() : []);
	if (protoProps.properties) {
		protoProps._properties = protoProps._properties.concat(protoProps.properties);
		delete protoProps.properties;
	}

	var Model = originalExtend.call(this, protoProps, staticProps);

	createNativeProperties(Model, protoProps);

	return Model;
};

module.exports = HyperModel;
