var ProtoValidator = require('..');

var path = require('path');
var ProtoBuf = require('protobufjs');

var builder = ProtoBuf.protoFromFile(path.join(__dirname, 'messages.proto'));

var aReflect = builder.lookup('A');
var messages = builder.build();

var expect = require('chai').expect;

describe('protobufjs-validator', function () {
    it('allows valid objects', function () {
        var validator = new ProtoValidator(builder.lookup('C'));
        var c = new messages.C({
            name: 'c'
        });
        expect(function () {
            validator.validate(c);
        }).not.to.throw();
    });

    it('validates simple messages', function () {
        var validator = new ProtoValidator(aReflect);
        var a = new messages.A();
        expect(function () {
            validator.validate(a);
        }).to.throw();
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
        }).to.throw();
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
        // Missig name
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
    })
})