var assert = require('assert'),
	_ = require('underscore'),
	hyper = require('./../'),
	Model = hyper.Model,
	errors = hyper.errors;

function disableErrors() {
	_.each(errors, function(value, key) {
		errors[key] = function() {};
	})
}
disableErrors();

suite('model:', function() {
	setup(function() {
		this.Person = Model.extend({
			types: {
				name: String,
				employed_at: Date,
				salary: Number
			},
			properties: [
				'gender',
				'age'
			]
		});

		this.Department = Model.extend({
			idAttribute: '_id',
			types: {
				id: String,
				name: String,
				leader: this.Person
			}
		});

		this.Office = Model.extend({
			types: {
				address: String,
				boss: this.Person,
				development: this.Department,
				marketing: this.Department
			}
		});
	});

	test('attributes via set/get', function() {
		var person = new this.Person();

		person.set('name', 'John');
		assert.equal(person.get('name'), 'John');

		person.set('employed_at', new Date(1234567890123));
		assert.equal(person.get('employed_at').toISOString(),
			'2009-02-13T23:31:30.123Z');

		person.set('salary', 123456);
		assert.equal(person.get('salary'), 123456);

		person.set('gender', 'male');
		assert.equal(person.get('gender'), 'male');

		person.set('age', 35);
		assert.equal(person.get('age'), 35);
	});

	test('attributes via setters/getters', function() {
		var person = new this.Person(),
			dep = new this.Department();

		person.name = 'John';
		assert.equal(person.name, 'John');

		person.employed_at = new Date(1234567890123);
		assert.equal(person.employed_at.toISOString(),
			'2009-02-13T23:31:30.123Z');

		person.salary = 123456;
		assert.equal(person.salary, 123456);

		person.gender = 'male';
		assert.equal(person.gender, 'male');

		person.age = 35;
		assert.equal(person.age, 35);

		dep.id = 'marketing';
		assert.equal(dep.id, 'marketing');
	});

	suite('type casting', function() {
		test('via setters', function() {
			var person = new this.Person();

			person.name = 123;
			assert.equal(typeof person.name, 'string');
			assert.equal(person.name, '123');

			person.employed_at = '2013-12-11 20:21:22';
			assert.ok(person.employed_at instanceof Date);
			assert.equal(person.employed_at.toISOString(),
				'2013-12-11T20:21:22.000Z');

			person.employed_at = 1234567890123;
			assert.ok(person.employed_at instanceof Date);
			assert.equal(person.employed_at.toISOString(),
				'2009-02-13T23:31:30.123Z');

			person.salary = '123456';
			assert.equal(typeof person.salary, 'number');
			assert.equal(person.salary, 123456);

			person.age = '35';
			assert.equal(typeof person.age, 'string');
			assert.equal(person.age, '35');
		});

		test('from JSON', function() {
			var person = new this.Person({
					name: 123,
					employed_at: '2013-12-11T20:21:22Z',
					salary: '123456',
					age: '35'
				});

			assert.equal(typeof person.name, 'string');
			assert.equal(person.name, '123');

			assert.ok(person.employed_at instanceof Date);
			assert.equal(person.employed_at.toISOString(),
				'2013-12-11T20:21:22.000Z');

			assert.equal(typeof person.salary, 'number');
			assert.equal(person.salary, 123456);
		});

		test('to JSON', function() {
			var person = new this.Person({
					name: 123,
					employed_at: '2013-12-11T20:21:22Z',
					salary: '123456',
					age: '35'
				}),
				json = person.toJSON();

			assert.equal(json.name, '123');
			assert.equal(json.employed_at, '2013-12-11T20:21:22.000Z');
			assert.equal(json.salary, 123456);
			assert.equal(json.age, '35');
		});
	});

	suite('nested', function() {
		test('via set/get', function() {
			var person = new this.Person(),
				dep = new this.Department();

			person.set('name', 'John');
			person.set('employed_at', new Date(1234567890123));
			person.set('salary', 123456);

			dep.set('id', 'marketing');
			dep.set('name', 'Markting FTW');
			dep.set('leader', person);

			assert.equal(dep.get('id'), 'marketing');

			assert.ok(dep.get('leader') instanceof this.Person);
			assert.equal(dep.get('leader').get('name'), 'John');
			assert.equal(dep.get('leader').get('employed_at').toISOString(),
				'2009-02-13T23:31:30.123Z');
			assert.equal(dep.get('leader').get('salary'), 123456);
		});

		test('via setters/getters', function() {
			var person = new this.Person(),
				dep = new this.Department();

			person.name = 'John';
			person.employed_at = new Date(1234567890123);
			person.salary = 123456;

			dep.id = 'marketing';
			dep.name = 'Markting FTW';
			dep.leader = person;

			assert.equal(dep.id, 'marketing');

			assert.ok(dep.leader instanceof this.Person);
			assert.equal(dep.leader.name, 'John');
			assert.equal(dep.leader.employed_at.toISOString(),
				'2009-02-13T23:31:30.123Z');
			assert.equal(dep.leader.salary, 123456);
		});

		test('from JSON', function() {
			var dep = new this.Department({
					id: 'marketing',
					name: 'Markting FTW',
					leader: {
						name: 123,
						employed_at: '2013-12-11T20:21:22Z',
						salary: '123456'
					}
				});

			assert.equal(dep.id, 'marketing');

			assert.ok(dep.leader instanceof this.Person);
			assert.equal(dep.leader.name, '123');
			assert.equal(dep.leader.employed_at.toISOString(),
				'2013-12-11T20:21:22.000Z');
			assert.equal(dep.leader.salary, 123456);
		});

		test('deep from/to JSON', function() {
			var office = new this.Office({
					name: 'Foobar LTD',
					boss: {
						name: 'John',
						salary: 234567
					},
					development: {
						id: 'dev',
						name: 'Development Geeks'
					},
					marketing: {
						id: 'marketing',
						name: 'Markting FTW',
						leader: {
							name: 123,
							employed_at: '2013-12-11T20:21:22Z',
							salary: '123456'
						}
					}
				}),
				json = office.toJSON();

			assert.ok(office.boss instanceof this.Person);
			assert.ok(office.development instanceof this.Department);
			assert.ok(office.marketing instanceof this.Department);

			assert.equal(json.name, 'Foobar LTD');
			assert.equal(json.boss.name, 'John');
			assert.equal(json.boss.salary, 234567);
			assert.equal(json.marketing.leader.name, '123');
			assert.equal(json.marketing.leader.employed_at, '2013-12-11T20:21:22.000Z');
			assert.equal(json.marketing.leader.salary, 123456);
		});
	});

	suite('errors', function() {
		teardown(disableErrors);

		test('property conflicts', function() {
			var errorList = [],
				TestModel;

			errors.propertyConflict = function(context, name) {
				errorList.push(name);
			};

			TestModel = Model.extend({
				types: {
					cid: Number
				},
				properties: ['attributes']
			});

			assert.deepEqual(errorList, ['cid', 'attributes']);
		});

		test('unknown attribute', function() {
			var errorList = [],
				TestModel;

			errors.unknownAttribute = function(context, name) {
				errorList.push(name);
			};

			TestModel = Model.extend({});
			new TestModel({
				foo: 123,
				bar: 'ham'
			});

			assert.deepEqual(errorList, ['foo', 'bar']);
		});
	});
});
