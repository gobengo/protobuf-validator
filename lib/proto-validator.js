'use strict';

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
        if (field.required && (value === null || value === undefined)) {
            this.error(this._fieldPrefix + field.name + ' is required');
        }
        // If this field is another message, we'll recurse
        if (field.resolvedType && value) {
            // Will restore state when called
            var up = function (upReflect, upMessage, upFieldPrefix) {
                this._fieldPrefix = upFieldPrefix;
                this._reflect = upReflect;
                this._message = upMessage;
            }.bind(this, this._reflect, this._message, this._fieldPrefix);

            // down and recurse
            this._fieldPrefix += field.name + '.';
            this._reflect = field.resolvedType;
            this._message = value;
            this.hasRequiredFields();

            // up and restore state
            up.call(this);
        }
    }.bind(this));
};

/**
 * Report an error in validation. By default, throw.
 * Overriding this is reasonable, for example if you
 * want to collect all errors when validating.
 */
ProtoValidator.prototype.error = function (err) {
    throw new ProtoValidator.ValidatorError(err);
};

/**
 * A Custom Error subclass
 * @constructor
 */
ProtoValidator.ValidatorError = function(msg) {
    Error.captureStackTrace(this, this);
    this.name = 'ValidatorError';
    this.message = msg;
};

module.exports = ProtoValidator;