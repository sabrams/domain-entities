var should = require("should"),
    _ = require("underscore");

var ModelFactory = require("../lib/domain-entities");

describe('model creation', function () {
    it('should throw error when "type" is not a Date, String, or Number and is not a model with a create function', function () {
        var modelFactory = ModelFactory.create({});
        modelFactory.create.bind(modelFactory, {
            homeAddress: {
                type: 'Address'
            }
        }).should.throw('Invalid type specified for: homeAddress');
    })
})

describe('created model', function () {
    it('should have a constructor function named "create"', function () {
        var modelFactory = ModelFactory.create({});
        var Model = modelFactory.create({});
        (typeof Model.create === 'function').should.be.true;
    });
    describe('entity creation', function () {
        describe('invalid object construction', function () {
            it('should throw error when required field is missing', function () {
                var modelFactory = ModelFactory.create({});
                var Person = modelFactory.create({
                    firstName: {
                        required: true,
                        type: String
                    }
                });
                Person.create.bind(Person, {}).should.throw('Required field: firstName');
            });
            it('should bubble up error from invalid VO creation when data is passed for VO attribute', function() {
                var modelFactory = ModelFactory.create({});
                var Address = modelFactory.create({
                    street: {
                        type: String
                    },
                    city: {
                        type: String
                    },
                    state: {
                        type: String
                    },
                    country: {
                        type: String,
                        required: true
                    }
                });
                var Person = modelFactory.create({
                    homeAddress: {
                        type: Address
                    }
                });

                Person.create.bind( Person, {homeAddress: {
                    street: '123 1st St.',
                    city: 'anywhere',
                    state: 'ohio'
                    // missing country
                }}).should.throw('Required field: country');
            })
        });

        describe('valid object construction', function () {
            it('should allow dates to be passed as constructor arg or as Date type');
            it('should allow value objects (dates or VOs defined in ModelFactory creation) passed as constructor attributes or as VO type');
        })
    })
});

describe('created entity', function () {
    it('should not have directly visible attributes', function () {
        var modelFactory = ModelFactory.create({});
        var Person = modelFactory.create({
            firstName: {
                required: true,
                type: String
            }
        });
        var sam = Person.create({firstName: 'sam'});
        (sam.firstName === undefined).should.be.true;
    });
    it('should include simple attributes in toJSON result, toData result', function () {
        var modelFactory = ModelFactory.create({});
        var Person = modelFactory.create({
            firstName: {
                required: true,
                type: String
            }
        });
        var sam = Person.create({firstName: 'sam'});
        JSON.parse(sam.toJSON()).should.eql({
            firstName: 'sam'
        })
        sam.toData().should.eql({
            firstName: 'sam'
        })
    });
    it('should include value object attributes in toJSON result, toData result', function () {
        var modelFactory = ModelFactory.create({});

        var Address = modelFactory.create({
            street: {
                type: String
            },
            city: {
                type: String
            },
            state: {
                type: String
            },
            country: {
                type: String
            }
        });

        var Person = modelFactory.create({
            homeAddress: {
                type: Address
            }
        });
        var personWithAddress = Person.create({homeAddress: {
            street: '123 1st St.',
            city: 'anywhere',
            state: 'ohio',
            country: 'US'
        }});
        personWithAddress.toData().should.eql({homeAddress: {
            street: '123 1st St.',
            city: 'anywhere',
            state: 'ohio',
            country: 'US'
        }})
        JSON.parse(personWithAddress.toJSON()).should.eql({homeAddress: {
            street: '123 1st St.',
            city: 'anywhere',
            state: 'ohio',
            country: 'US'
        }});
    })
});