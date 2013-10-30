module.exports = ProtoValidator;

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
    var self = this;
    this._reflect.getChildren().forEach(function (field) {
        self.validateField(field, message[field.name]);
    });
}

/**
 * Validate a single field on a message
 * @param field {object} A Protobuf.js reflect field
 * @param value {object} The value of the field that
 * should be validated based on the field definition
 */
ProtoValidator.prototype.validateField = function (field, value) {
    var self = this;
    if (field.required && value === null) {
        this.error(this._fieldPrefix + field.name + ' is required');
    }
    if (field.resolvedType && value) {
        var fieldValidator = new ProtoValidator(field.resolvedType, {
            fieldPrefix: this._fieldPrefix + field.name + '.'
        });
        fieldValidator.error = function () {
            self.error.apply(self, arguments);
        }
        fieldValidator.validate(value);
    }
}

/**
 * Report an error in validation. By default, throw.
 * Overriding this is reasonable, for example if you
 * want to collect all errors when validating.
 */
ProtoValidator.prototype.error = function (err) {
    throw new Error(err);
}