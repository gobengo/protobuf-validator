'use strict';

var util = require('util');

/**
 * An object that validates Objects based on a
 * protobuf.js message reflection.
 * @constructor
 * @param reflect {object} A Protobuf.js Reflect object
 * @param opts {object}
 * @param opts.fieldPrefix {string} A string with which to prefix
 * error messages
 */
function ProtoValidator (reflect, opts) {
    opts = opts || {};
    this._reflect = reflect;
    this._fieldPrefix = opts.fieldPrefix || '';
}

/**
 * Validate an object that should be like reflected
 * protobuf message
 * @param message {object} A Protobuf.js message, or other
 * object that is similar to one
 */
ProtoValidator.prototype.validate = function (message) {
    this._message = typeof message === 'object' ? message : {};
    return this;
};

/**
 * Validate whether all required fields are present
 * If a field is a submessage, it checks that recursively.
 * @param field {object} A Protobuf.js reflect field
 * @param value {object} The value of the field that
 * should be validated based on the field definition
 */
ProtoValidator.prototype.hasRequiredFields = function () {
    this._reflect.getChildren().forEach(function (field) {
        var value = this._message[field.name];
        var err;

        if (field.required && (value === null || value === undefined)) {
            err = new ProtoValidator.RequiredFieldError(
                this._fieldPrefix + field.name + ' is required',
                field,
                value);
            this.error(err);
        }

        // If this is a repeated field and the value is an empty list
        // then that's valid
        if (field.repeated) {
            if ( ! value || value.length === 0) {
                return;
            }
        }

        // If this field is another message, we'll recurse
        if (field.resolvedType && value) {
            if (field.repeated) {
                // Check each value in the repeated list
                return value.forEach(validateSubValue.bind(null, this, field));
            }
            // not repeated, value is a single object
            validateSubValue(this, field, value);
        }
    }.bind(this));
    return this;
};

// Use a validator to validate a subvalue against a field
// It does this by temporarily changing the validator
// state of what it is validating, check required fields,
// then resetting to the previous state
function validateSubValue(validator, field, value) {
    // Will restore state when called
    var up = function (upReflect, upMessage, upFieldPrefix) {
        this._fieldPrefix = upFieldPrefix;
        this._reflect = upReflect;
        this._message = upMessage;
    }.bind(validator, validator._reflect, validator._message, validator._fieldPrefix);

    // down and recurse
    validator._fieldPrefix += field.name + '.';
    validator._reflect = field.resolvedType;
    validator._message = value;
    validator.hasRequiredFields();

    // up and restore state
    up();
}

/**
 * Validate whether there are reasonable values for all fields
 */
ProtoValidator.prototype.hasValidValues = function () {
    var validator = this;
    var message = this._message;
    this._reflect.getChildren().forEach(function (field) {
        validateField(validator, field, message);
    });
    return this;
};

/**
 * Validate a field on a message
 */
function validateField(validator, field, message) {
    var value = message[field.name];
    var verifiedValue;
    var err;
    // If this is just a message definition and not a submessage, ignore
    if (typeof field.getChildren === 'function') {
        return;
    }
    if (typeof field.verifyValue !== 'function') {
        throw new Error("Cannot verify value of field with no .verifyValue method");
    }
    try {
        verifiedValue = field.verifyValue(value);
    } catch (rawError) {
        // Cast errors to InvalidValueError for users of validator
        err = new ProtoValidator.InvalidValueError(
            rawError.message,
            field,
            value);
        validator.error(err);
    }
}

/**
 * Report an error in validation. By default, throw.
 * Overriding this is reasonable, for example if you
 * want to collect all errors when validating.
 */
ProtoValidator.prototype.error = function (err) {
    throw err;
};

/**
 * A Custom Error subclass for ProtobufValidator
 * @constructor
 */
function ValidatorError(msg) {
    Error.captureStackTrace(this, this);
    this.name = 'ValidatorError';
    this.message = msg;
}
util.inherits(ValidatorError, Error);

/**
 * An Error signifying a required field was missing
 */
function RequiredFieldError(msg, field, value) {
    ValidatorError.call(this, msg);
    this.name = 'RequiredFieldError';
    this.field = field;
    this.value = value;
}
util.inherits(RequiredFieldError, ValidatorError);

/**
 * An Error signifying that a field has an invalid value
 * e.g. a string value was passed for an int32 Field
 */
function InvalidValueError(msg, field, value) {
    ProtoValidator.ValidatorError.call(this, msg);
    this.name = 'InvalidValueError';
    this.field = field;
    this.value = value;
}
util.inherits(InvalidValueError, ValidatorError);

module.exports = ProtoValidator;
module.exports.ValidatorError = ValidatorError;
module.exports.RequiredFieldError = RequiredFieldError;
module.exports.InvalidValueError = InvalidValueError;