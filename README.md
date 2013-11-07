# protobuf-validator

Validate Objects as [Protocol Buffer](https://developers.google.com/protocol-buffers/docs/proto) messages.

## Usage

Assuming you have a message `MyMessage` in a `messages.proto` file.

    message MyMessage {
        optional string name = 1;
        required int32 myNumber = 2;
    }

Make a ProtobufValidator

    var Protobuf = require('protobufjs');
    var ProtobufValidator = require('protobuf-validator').ProtobufValidator;

    // First, Get a ProtoBuf.js Reflect Instance for your message

    var builder = Protobuf.protoFromFile(path.join(__dirname, 'messages.proto'));
    var myMessageReflection = builder.lookup('MyMessage');
    
    // Then make a Validator
    var validator = ProtobufValidator(myMessageReflection);

Validate that an object has all required fields.    

    var message = {
        name: 'Wish I had a .myNumber'
    };
    
    // Will throw because 'myNumber' is missing yet required
    validator.validate(message).hasRequiredFields();

Validate that an object has valid values.

    var message = {
        myNumber: 'Wait this is not an int32...'
    };
    
    // Will throw because the value for '.myNumber' is not a Number
    validator.validate(message).hasValidValues();

By default, an Error will be thrown when encountered. But you are encouraged to override `.error` for alternative behavior. For example, to store a bunch of errors.

    validator.error = function (err) {
        this.errors = this.errors || [];
        this.errors.push(err);
    };
    
    // will not throw
    validator.validate({})
        .hasValidValues()
        .hasRequiredFields();
    
    validator.errors.length > 0; // true

