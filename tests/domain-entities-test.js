var should = require("should"),
    _ = require("underscore");

var ModelFactory = require("../lib/domain-entities");

describe('model creation', function () {
    it('should throw error when "type" is not a Date, String, or Number and is not a model with a create function', function () {
        var modelFactory = ModelFactory.create({});
        modelFactory.create.bind(modelFactory, {
            attrs: {
                homeAddress: {
                    type: 'Address'
                }
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
    it('should have a constructor function named "reconstitute" (intended for repositories)', function () {
        var modelFactory = ModelFactory.create({});
        var Model = modelFactory.create({});
        (typeof Model.reconstitute === 'function').should.be.true;
    });
    describe('entity creation', function () {
        describe('invalid object construction', function () {
            it('should execute custom validation in addition to internal validation (based on field specs), including all validation errors in thrown exception', function () {
                var modelFactory = ModelFactory.create({});
                var Person = modelFactory.create({
                    attrs: {
                        firstName: {
                            required: true,
                            type: String
                        }
                    },
                    validate: function (attrs) {
                        throw 'custom validation failed'
                    }
                });
                Person.create.bind(Person, {firstName: 'bob'}).should.throw('custom validation failed');
                Person.create.bind(Person, {}).should.throw('Required field: firstName,custom validation failed');
            });
            it('should throw error when required field is missing', function () {
                var modelFactory = ModelFactory.create({});
                var Person = modelFactory.create({
                    attrs: {
                        firstName: {
                            required: true,
                            type: String
                        }
                    }
                });
                Person.create.bind(Person, {}).should.throw('Required field: firstName');
            });
            it('should bubble up error from invalid VO creation when data is passed for VO attribute', function () {
                var modelFactory = ModelFactory.create({});
                var Address = modelFactory.create({
                    valueObject: true,
                    attrs: {
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
                    }
                });
                var Person = modelFactory.create({
                    attrs: {
                        homeAddress: {
                            type: Address
                        }
                    }
                });

                Person.create.bind(Person, {
                    homeAddress: {
                        street: '123 1st St.',
                        city: 'anywhere',
                        state: 'ohio'
                        // missing country
                    }
                }).should.throw('Required field: country');
            })
        });

        describe('valid object construction', function () {
            it('should allow dates to be passed as constructor arg or as Date type');
            it('should allow value objects (dates or VOs defined in ModelFactory creation) passed as constructor attributes or as VO type');
        })
    })
    describe('entity reconstitution', function () {
        it('excluding related entities, it should create an object with the same attributes as create', function () {
            var modelFactory = ModelFactory.create({});
            var Address = modelFactory.create({
                valueObject: true,
                attrs: {
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
                }
            });
            var Person = modelFactory.create({
                attrs: {
                    homeAddress: {
                        type: Address
                    },
                    firstName: {
                        type: String
                    }
                }
            });
            var person1 = Person.create({
                homeAddress: {
                    street: '123 1st St.',
                    city: 'anywhere',
                    state: 'ohio',
                    country: 'US'
                },
                firstName: 'bob'
            });
            var person2 = Person.reconstitute({
                homeAddress: {
                    street: '123 1st St.',
                    city: 'anywhere',
                    state: 'ohio',
                    country: 'US'
                },
                firstName: 'bob'
            });

//            person1.should.eql(person2);
            person1.toData().should.eql(person2.toData())
        });
        it('should execute neither custom validation nor field-specified validation', function(){
                var modelFactory = ModelFactory.create({});
                var Address = modelFactory.create({
                    valueObject: true,
                    attrs: {
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
                    }
                });
                var Person = modelFactory.create({
                    attrs: {
                        homeAddress: {
                            type: Address
                        },
                        firstName: {
                            type: String,
                            required: true
                        }
                    }
                });

                Person.reconstitute.bind(Person, {
                    homeAddress: {
                        street: '123 1st St.',
                        city: 'anywhere',
                        state: 'ohio'
                    }
                }).should.not.throwError();
        })

    })
});

describe('created value object', function () {
    it('should not allow an id to be set or retrieved if not part of the VO\'s attributes', function () {
        var modelFactory = ModelFactory.create({});
        var Address = modelFactory.create({
            valueObject: true,
            attrs: {
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
            }
        });
        var address = Address.create({
            country: "US"
        });
        (address.getId === undefined).should.be.true;
        (address.setId === undefined).should.be.true;
    });
});
describe('created entity', function () {
    it('should not have directly visible attributes', function () {
        var modelFactory = ModelFactory.create({});
        var Person = modelFactory.create({
            attrs: {
                firstName: {
                    required: true,
                    type: String
                }
            }
        });
        var sam = Person.create({firstName: 'sam'});
        (sam.firstName === undefined).should.be.true;
    });
    it('should include simple attributes in toJSON result, toData result', function () {
        var modelFactory = ModelFactory.create({});
        var Person = modelFactory.create({
            attrs: {
                firstName: {
                    required: true,
                    type: String
                }
            }
        });
        var sam = Person.create({firstName: 'sam'});
        JSON.parse(sam.toJSON()).should.eql({
            firstName: 'sam'
        });
        sam.toData().should.eql({
            firstName: 'sam'
        })
    });
    it('should allow an id (string or number) to be set on it and retrieved from it', function () {
        var modelFactory = ModelFactory.create({});
        var Person = modelFactory.create({
            attrs: {
                firstName: {
                    type: String
                }
            }
        });

        var person = Person.create({});
        person.setId("1234");
        person.getId().should.eql("1234");

        person.setId(1234);
        person.getId().should.eql(1234);

//        person.setId({
//            id: 1234
//        });
//        person.getId().should.eql({
//            id: 1234
//        });

    });
    it('should not expose an id directly', function () {
        var modelFactory = ModelFactory.create({});
        var Person = modelFactory.create({
            attrs: {
                firstName: {
                    type: String
                }
            }
        });

        var person = Person.create({});
        person.setId("1234");
        person.getId().should.eql("1234");

        person.setId(1234);
        person.getId().should.eql(1234);

        person.setId({
            id: 1234
        });
        (person.id === undefined).should.be.true;
    });
    it('should include id in toJSON result, toData result', function () {
        var modelFactory = ModelFactory.create({});
        var Person = modelFactory.create({
            attrs: {
                firstName: {
                    type: String
                }
            }
        });
        var person = Person.create({
            firstName: "Bob"
        });
        person.setId("1234");
        person.toData().should.eql({
            firstName: "Bob",
            id: "1234"
        });
        JSON.parse(person.toJSON()).should.eql({
            firstName: "Bob",
            id: "1234"
        })
    })
    it('should include value object attributes in toJSON result, toData result', function () {
        var modelFactory = ModelFactory.create({});

        var Address = modelFactory.create({
            valueObject: true,
            attrs: {
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
            }
        });

        var Person = modelFactory.create({
            attrs: {
                homeAddress: {
                    type: Address
                }
            }
        });
        var personWithAddress = Person.create({
            homeAddress: {
                street: '123 1st St.',
                city: 'anywhere',
                state: 'ohio',
                country: 'US'
            }
        });
        personWithAddress.toData().should.eql({
            homeAddress: {
                street: '123 1st St.',
                city: 'anywhere',
                state: 'ohio',
                country: 'US'
            }
        });
        JSON.parse(personWithAddress.toJSON()).should.eql({
            homeAddress: {
                street: '123 1st St.',
                city: 'anywhere',
                state: 'ohio',
                country: 'US'
            }
        });
    })
});