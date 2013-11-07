'use strict';

var ProtobufValidator = require('..').ProtobufValidator;
var path = require('path');
var ProtoBuf = require('protobufjs');
var expect = require('chai').expect;

var builder = ProtoBuf.protoFromFile(path.join(__dirname, 'messages.proto'));
var reflects = builder.lookup().children.reduce(function (prev, cur) {
    prev[cur.name] = cur;
    return prev;
}, {});

var messages = builder.build();

describe('protobufjs-validator', function () {
    it('.validate(obj) saves ._message', function () {
        var validator = new ProtobufValidator(reflects.C);
        var c = new messages.C({});
        expect(function () {
            validator.validate(c);
        }).not.to.throw();
        expect(validator._message).to.equal(c);
    });

    describe('.hasValidValues()', function () {
        it('is a method on ProtobufValidator', function () {
            var validator = new ProtobufValidator(reflects.HasInt32);
            expect(typeof validator.hasValidValues).to.equal('function');
        });

        it('allows objects with valid values, and returns this', function () {
            var validator = new ProtobufValidator(reflects.HasInt32);
            var m = {
                int32: 1234
            };
            var ret;
            expect(function () {
                ret = validator.validate(m).hasValidValues();
            }).not.to.throw(ProtobufValidator.InvalidValueError);
            expect(ret).to.equal(validator);
        });

        it('rejects strings passed to int32 fields', function () {
            var validator = new ProtobufValidator(reflects.HasInt32);
            var m = {
                int32: 'not an int32'
            };
            expect(function () {
                validator.validate(m).hasValidValues();
            }).to.throw(ProtobufValidator.InvalidValueError);
        });

        xit('rejects floats passed to int32 fields', function () {
            var validator = new ProtobufValidator(reflects.HasInt32);
            var m = {
                int32: 3.1415
            };
            // FIXME: Fails! ProtoBuf.js coerces to `3`
            expect(function () {
                validator.validate(m).hasValidValues();
            }).to.throw(ProtobufValidator.InvalidValueError);
        });
    });

    describe('.hasRequiredFields()', function () {
        it('throws RequiredFieldErrors with useful properties', function () {
            var validator = new ProtobufValidator(reflects.C);
            var c = new messages.C();
            var err;
            try {
                validator.validate(c).hasRequiredFields();
            } catch (error) {
                err = error;
            }
            expect(err).not.to.equal(undefined);
            expect(err.field.name).to.equal('name');
            expect(err.value).to.equal(null);
        });

        it('allows messages with all fields and returns this', function () {
            var validator = new ProtobufValidator(reflects.C);
            var c = new messages.C({
                name: 'c'
            });
            var ret;
            expect(function () {
                ret = validator.validate(c).hasRequiredFields();
            }).not.to.throw();
            expect(ret).to.equal(validator);
        });

        it('allows objects with all fields', function () {
            var validator = new ProtobufValidator(reflects.C);
            var c = {
                name: 'c'
            };
            expect(function () {
                validator.validate(c).hasRequiredFields();
            }).not.to.throw();
        });

        it('rejects messages without all fields', function () {
            var validator = new ProtobufValidator(reflects.A);
            var a = new messages.A();
            expect(function () {
                validator.validate(a).hasRequiredFields();
            }).to.throw(ProtobufValidator.RequiredFieldError);
        });

        it('rejects objects without all fields', function () {
            var validator = new ProtobufValidator(reflects.A);
            var a = {};
            expect(function () {
                validator.validate(a).hasRequiredFields();
            }).to.throw(ProtobufValidator.RequiredFieldError);
        });

        it('rejects nested messages without all fields', function () {
            var validator = new ProtobufValidator(reflects.A);
            var b = new messages.B();
            var a = new messages.A({
                name: 'A',
                b: b
            });
            expect(function () {
                validator.validate(a).hasRequiredFields();
            }).to.throw(ProtobufValidator.RequiredFieldError);
        });

        it('rejects nested objects without all fields', function () {
            var validator = new ProtobufValidator(reflects.A);
            var b = {};
            var a = {
                name: 'A',
                b: b
            };
            expect(function () {
                validator.validate(a).hasRequiredFields();
            }).to.throw(ProtobufValidator.RequiredFieldError);
        });
    });

    it('can overwrite .error to store errors', function () {
        var validator = new ProtobufValidator(reflects.A);
        validator._errors = [];
        validator.error = function (err) {
            this._errors.push(err);
        };
        validator.getErrors = function () {
            return this._errors;
        };
        // Missing name
        var a = new messages.A({
            // Missing name
            b: new messages.B({
                // Missing name
                c: new messages.C()
            })
        });
        expect(function () {
            validator.validate(a).hasRequiredFields();
        }).not.to.throw();
        // 3 missing names === 3 errors
        var errors = validator.getErrors();
        expect(errors.length).to.equal(3);
        expect(errors[2].message).to.equal('b.c.name is required');
    });
});