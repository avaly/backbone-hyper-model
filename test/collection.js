var assert = require('assert'),
	_ = require('underscore'),
	hyper = require('./../'),
	Model = hyper.Model,
	Collection = require('backbone').Collection,
	errors = hyper.errors;

function disableErrors() {
	_.each(errors, function(value, key) {
		errors[key] = function() {};
	})
}
disableErrors();

suite('collection:', function() {
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

		this.Employees = Collection.extend({
			model: this.Person
		});

		this.Department = Model.extend({
			idAttribute: '_id',
			types: {
				id: String,
				name: String,
				leader: this.Person,
				employees: this.Employees
			}
		});

		this.personJSON1 = {
			name: 'John',
			employed_at: new Date(1234567890123),
			salary: 234567,
			age: 31
		};
		this.personJSON2 = {
			name: 123,
			employed_at: '2013-12-11T20:21:22Z',
			salary: '123456',
			age: '35'
		};
	});

	test('init', function() {
		var employees = new this.Employees([
				new this.Person(this.personJSON1),
				new this.Person(this.personJSON2)
			]);

		assert.equal(employees.length, 2);
		assert.ok(employees.at(0) instanceof this.Person);
		assert.ok(employees.at(1) instanceof this.Person);
	});

	suite('type casting', function() {
		test('via setters', function() {
			var department = new this.Department({
					id: 'marketing',
					name: 'Marketing'
				}),
				person;

			department.employees = [
				this.personJSON1,
				this.personJSON2
			];

			assert.equal(department.get('employees').length, 2);

			person = department.get('employees').at(0);

			assert.ok(person instanceof this.Person);
			assert.equal(person.get('name'), 'John');
			assert.equal(person.get('employed_at').toISOString(),
				'2009-02-13T23:31:30.123Z');
			assert.equal(person.get('salary'), 234567);
			assert.equal(person.get('age'), 31);
		});

		test('from JSON', function() {
			var department = new this.Department({
					id: 'marketing',
					name: 'Marketing',
					employees: [
						this.personJSON1,
						this.personJSON2
					]
				}),
				person;

			assert.equal(department.get('employees').length, 2);

			person = department.get('employees').at(0);

			assert.ok(person instanceof this.Person);
			assert.equal(person.get('name'), 'John');
			assert.equal(person.get('employed_at').toISOString(),
				'2009-02-13T23:31:30.123Z');
			assert.equal(person.get('salary'), 234567);
			assert.equal(person.get('age'), 31);
		});

		test('to JSON', function() {
			var department = new this.Department({
					id: 'marketing',
					name: 'Marketing',
					employees: [
						this.personJSON1,
						this.personJSON2
					]
				}),
				json = department.toJSON();

			assert.equal(json.name, 'Marketing');
			assert.equal(json.employees[0].name, 'John');
			assert.equal(json.employees[0].employed_at, '2009-02-13T23:31:30.123Z');
			assert.equal(json.employees[0].salary, 234567);
			assert.equal(json.employees[0].age, 31);
		});
	});
});
