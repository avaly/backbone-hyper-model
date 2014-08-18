var assert = require('assert'),
	_ = require('underscore'),
	hyper = require('./../'),
	Type = hyper.Type;

suite('type:', function() {
	test('create via of', function() {
		var type = Type.of(String);
		assert.equal(type.ctor, String);
	});
});
