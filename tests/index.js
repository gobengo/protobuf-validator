'use strict';

var ProtoValidator = require('..');
var path = require('path');
var ProtoBuf = require('protobufjs');
var expect = require('chai').expect;

var builder = ProtoBuf.protoFromFile(path.join(__dirname, 'messages.proto'));
var aReflect = builder.lookup('A');
var messages = builder.build();

describe('protobufjs-validator', function () {
    it('allows valid messages', function () {
        var validator = new ProtoValidator(builder.lookup('C'));
        var c = new messages.C({
            name: 'c'
        });
        expect(function () {
            validator.validate(c);
        }).not.to.throw();
    });

    it('allows valid objects that look like the message', function () {
        var validator = new ProtoValidator(builder.lookup('C'));
        var c = {
            name: 'c'
        };
        expect(function () {
            validator.validate(c);
        }).not.to.throw();
    });

    it('validates simple messages', function () {
        var validator = new ProtoValidator(aReflect);
        var a = new messages.A();
        expect(function () {
            validator.validate(a);
        }).to.throw(ProtoValidator.ValdatorError);
    });

    it('validates objects that look like messages', function () {
        var a = {};
        expect(function () {
            validator.validate(a);
        }).to.throw(ProtoValidator.ValdatorError);
    });

    it('validates nested messages', function () {
        var validator = new ProtoValidator(aReflect);
        var b = new messages.B();
        var a = new messages.A({
            name: 'A',
            b: b
        });
        expect(function () {
            validator.validate(a);
        }).to.throw(ProtoValidator.ValdatorError);
    });

    it('validates nested objects that look like nested messages', function () {
        var validator = new ProtoValidator(aReflect);
        var b = {};
        var a = {
            name: 'A',
            b: b
        };
        expect(function () {
            validator.validate(a);
        }).to.throw(ProtoValidator.ValdatorError);
    });

    it('can overwrite .error to store errors', function () {
        var validator = new ProtoValidator(aReflect);
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
            validator.validate(a);
        }).not.to.throw();
        // 3 missing names === 3 errors
        expect(validator.getErrors().length).to.equal(3);
    });
});