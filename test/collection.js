var assert = require('assert'),
	_ = require('underscore'),
	hyper = require('./../'),
	Model = hyper.Model,
	Type = hyper.Type,
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
			],
			parse: function(data) {
				data.nameDouble = data.name + ' ' + data.name;
				return data;
			}
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

		this.HR = Model.extend({
			typesDeep: {
				marketing: {
					employees: Type.of(this.Employees)
				},
				oursource: {
					development: {
						employees: Type.of(this.Employees)
					}
				}
			}
		})

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

		this.assertPerson1 = function(person) {
			assert.ok(person instanceof this.Person);
			assert.equal(person.get('name'), 'John');
			assert.equal(person.get('employed_at').toISOString(),
				'2009-02-13T23:31:30.123Z');
			assert.equal(person.get('salary'), 234567);
			assert.equal(person.get('age'), 31);
		};
		this.assertPerson2 = function(person) {
			assert.ok(person instanceof this.Person);
			assert.equal(person.get('name'), '123');
			assert.equal(person.get('employed_at').toISOString(),
				'2013-12-11T20:21:22.000Z');
			assert.equal(person.get('salary'), 123456);
			assert.equal(person.get('age'), '35');
		};
	});

	test('init', function() {
		var employees = new this.Employees([
				new this.Person(this.personJSON1),
				new this.Person(this.personJSON2)
			]);

		assert.equal(employees.length, 2);
		this.assertPerson1(employees.at(0));
		this.assertPerson2(employees.at(1));
	});

	suite('type casting', function() {
		test('via setters', function() {
			var department = new this.Department({
					id: 'marketing',
					name: 'Marketing'
				});

			department.employees = [
				this.personJSON1,
				this.personJSON2
			];

			assert.ok(department.employees instanceof this.Employees);
			assert.equal(department.employees.length, 2);
			this.assertPerson1(department.employees.at(0));
			this.assertPerson2(department.employees.at(1));
		});

		test('from JSON', function() {
			var department = new this.Department({
					id: 'marketing',
					name: 'Marketing',
					employees: [
						this.personJSON1,
						this.personJSON2
					]
				}, {
					parse: true
				});

			assert.ok(department.employees instanceof this.Employees);
			assert.equal(department.employees.length, 2);
			this.assertPerson1(department.employees.at(0));
			this.assertPerson2(department.employees.at(1));
			assert.equal(department.employees.at(0).get('nameDouble'), 'John John');
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

			assert.ok(!(json.employees instanceof this.Employees));
			assert.equal(json.employees[0].name, 'John');
			assert.equal(json.employees[0].employed_at, '2009-02-13T23:31:30.123Z');
			assert.equal(json.employees[0].salary, 234567);
			assert.equal(json.employees[0].age, 31);
		});
	});

	suite('type casting in deep objects', function() {
		test('via setters', function() {
			var hr = new this.HR({});

			hr.set('marketing', {
				employees: [
					this.personJSON1,
					this.personJSON2
				]
			});

			assert.ok(hr.get('marketing').employees instanceof this.Employees);
			assert.equal(hr.get('marketing').employees.length, 2);
			this.assertPerson1(hr.get('marketing').employees.at(0));
			this.assertPerson2(hr.get('marketing').employees.at(1));
		});

		test('from JSON', function() {
			var hr = new this.HR({
					marketing: {
						employees: [
							this.personJSON1,
							this.personJSON2
						]
					}
				}, {
					parse: true
				});

			assert.ok(hr.get('marketing').employees instanceof this.Employees);
			assert.equal(hr.get('marketing').employees.length, 2);
			this.assertPerson1(hr.get('marketing').employees.at(0));
			this.assertPerson2(hr.get('marketing').employees.at(1));
			assert.equal(hr.get('marketing').employees.at(0).get('nameDouble'), 'John John');
		});

		test('to JSON', function() {
			var hr = new this.HR({
					marketing: {
						employees: [
							this.personJSON1
						]
					},
					outsource: {
						development: {
							employees: [
								this.personJSON2
							]
						}
					}
				}),
				json = hr.toJSON();

			assert.ok(json.marketing);
			assert.ok(json.marketing.employees);
			assert.ok(!(json.marketing.employees instanceof this.Employees));
			assert.equal(json.marketing.employees[0].name, 'John');

			assert.ok(json.outsource);
			assert.ok(json.outsource.development);
			assert.ok(json.outsource.development.employees);
			assert.ok(!(json.outsource.development.employees instanceof this.Employees));
			assert.equal(json.outsource.development.employees[0].name, '123');
		});
	});
});
