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
    create: function (spec) {

        var isVO = spec.valueObject === undefined ? false : spec.valueObject;
        var errors = [];

        var optionalFields = [],
            requiredFields = [],
            valueObjects = {},
            customValidation = spec.validate;
        _.each(_.keys(spec.attrs), function (key) {
            if (spec.attrs[key].required)
                requiredFields.push(key);
            else
                optionalFields.push(key);
        });
        _.each(_.keys(spec.attrs), function (key) {
            if (!_.contains(languageTypes, spec.attrs[key].type)) {
                if (typeof spec.attrs[key].type.create !== 'function')
                    errors.push('Invalid type specified for: ' + key);
                else if (spec.attrs[key].type.isValueObject()) {
                    valueObjects[key] = spec.attrs[key].type;
                }
            }
        });
        if (errors.length > 0) {
            throw {
                name: "Model Definition Error",
                message: errors.toString()
            }
        }

        function doCreate(attributes, validate) {
            var id = undefined;

            if (validate) {
                var errors = [];

                _.each(requiredFields, function (field) {
                    if (!_.has(attributes, field)) {
                        errors.push('Required field: ' + field);
                    }
                });

                if (customValidation)
                    try {
                        customValidation(attributes);
                    }
                    catch (e) {
                        errors.push(e)
                    }

                if (errors.length > 0) {
                    throw {
                        name: "Validation Error",
                        message: errors.toString()
                    }
                }
            }

            // replace data intended for VO construction with constructed VO
            _.each(_.keys(attributes), function (key) {
                if (_.contains(_.keys(valueObjects), key) && (typeof attributes[key].create !== 'function')) {
                    if (validate)
                        attributes[key] = valueObjects[key].create(attributes[key]);
                    else
                        attributes[key] = valueObjects[key].reconstitute(attributes[key]);
                }
            });

            var result = {
                toJSON: function () {
                    return JSON.stringify(this.toData());
                },
                toData: function () {
                    var resultAttributes = {};
                    _.each(_.keys(attributes), function (key) {
                        if (typeof attributes[key].toData === 'function')
                            resultAttributes[key] = attributes[key].toData();
                        else
                            resultAttributes[key] = _.clone(attributes[key]); // underscore's clone will return primitive w/o cloning
                    });
                    if (id)
                        resultAttributes.id = id;
                    return resultAttributes;
                }
            };

            if (!isVO) {
                result.getId = function () {
                    return id;
                };
                result.setId = function (_id) {
                    id = _id;
                }
            }

            return result;

        }

        return {
            create: function (attributes) {
                return doCreate(attributes, true)
            },
            isValueObject: function () {
                return isVO;
            },
            reconstitute: function (spec) {
                return doCreate(spec, false);
            }
        }
    }
};

var ModelFactory = {
    create: function () {

        return {
            create: function (spec) {
                return Model.create(spec);
            }
        }
    }
};

module.exports = {
    create: function (spec) {
        return ModelFactory.create(spec);
    }
};

