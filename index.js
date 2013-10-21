module.exports = ProtoValidator;

function ProtoValidator (reflect, opts) {
    opts = opts || {};
    this._reflect = reflect;
    this._fieldPrefix = opts.fieldPrefix || '';
}

ProtoValidator.prototype.validate = function (message) {
    var self = this;
    this._reflect.getChildren().forEach(function (field) {
        self.validateField(field, message[field.name]);
    });
}

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

ProtoValidator.prototype.error = function (err) {
    throw err;
}