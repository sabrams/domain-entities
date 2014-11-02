/*
 * domain-entities
 * https://github.com/sabrams/domain-entities
 *
 * Copyright (c) 2014 Stephen Abrams
 * Licensed under the MIT license.
 */

'use strict';
var _ = require('underscore');

var languageTypes = [Date, String, Number];

var Model = {
    create: function (fieldDefs) {

        var errors = [];

        var optionalFields = [],
            requiredFields = [],
            valueObjects = {};
        _.each(_.keys(fieldDefs), function (key) {
            if (fieldDefs[key].required)
                requiredFields.push(key);
            else
                optionalFields.push(key);
        });
//        _.each(fieldDefs, function(def){
//            if (!_.contains(_.map(_.keys(definedTypes), function(key) {return key.toString()}), def.type) && !_.contains(languageTypes, def.type)) {
//                errors.push('Undefined type: ' + def.type);
//            }
//        });
        _.each(_.keys(fieldDefs), function (key) {
            if (!_.contains(languageTypes, fieldDefs[key].type)) {
                if (typeof fieldDefs[key].type.create !== 'function')
                    errors.push('Invalid type specified for: ' + key);
                else if (fieldDefs[key].type.isValueObject()) {     //(typeof fieldDefs[key].type.isValueObject === 'function') &&
                    valueObjects[key] = fieldDefs[key].type;
                }
            }
        });
        if (errors.length > 0) {
            throw {
                name: "Model Definition Error",
                message: errors.toString()
            }
        }

        return {
            create: function (attributes) {
                var errors = [];

                _.each(requiredFields, function (field) {
                    if (!_.has(attributes, field)) {
                        errors.push('Required field: ' + field);
                    }
                });

                if (errors.length > 0) {
                    throw {
                        name: "Validation Error",
                        message: errors.toString()
                    }
                }

                // replace data intended for VO construction with constructed VO
                _.each(_.keys(attributes), function (key) {
                    if (_.contains(_.keys(valueObjects), key) && (typeof attributes[key].create !== 'function')) {
                        attributes[key] = valueObjects[key].create(attributes[key]);
                    }
                });

                return {
                    toJSON: function () {
                        return JSON.stringify(this.toData());
                    },
                    toData: function () {
                        var resultAttributes = {};
                        _.each(_.keys(attributes), function(key) {
                            if (typeof attributes[key].toData === 'function')
                                resultAttributes[key] = attributes[key].toData();
                            else
                                resultAttributes[key] = _.clone(attributes[key]); // underscore's clone will return primitive w/o cloning
                        });
                       return resultAttributes;
                    }



                };
            },
            isValueObject: function() {      // todo spec to include attributes and other pieces
                return true;
            }
        }
    }
};

var ModelFactory = {
    create: function () {

        return {
            create: function (fieldDefs) {
                return Model.create(fieldDefs);
            }
        }
    }
};

module.exports = {
    create: function (spec) {
        return ModelFactory.create(spec);
    }
};

