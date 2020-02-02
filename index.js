var Service;
var Characteristic;
var HomebridgeAPI;
var http = require('http');

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    HomebridgeAPI = homebridge;

    homebridge.registerAccessory("homebridge-Esp-ContactSensor", "Esp-ContactSensor", EspContactSensor);
};


function EspContactSensor(log, config) {
    this.log = log;
    this.name = config.name;
    this.port = config.port;
    this.motionDetected = false;
    this.timeout = null;
    this.bind_ip = config.bind_ip || "0.0.0.0";

    this.repeater = config.repeater || [];

    var that = this;
    this.server = http.createServer(function(request, response) {
        that.httpHandler(that);
        response.end('Successfully requested: ' + request.url);
    });



    // info service
    this.informationService = new Service.AccessoryInformation();

    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, "Torac")
        .setCharacteristic(Characteristic.Model, config.model || "Doorsensor")
        .setCharacteristic(Characteristic.SerialNumber, config.serial || "4BD53931-D4A9-4850-8E7D-8A51A842FA29");




    this.service = new Service.ContactSensor(this.name);

    this.service.getCharacteristic(Characteristic.ContactSensorState)
        .on('get', this.getState.bind(this));

    this.server.listen(this.port, this.bind_ip, function(){
        that.log("Motion sensor server listening on: http://<your ip goes here>:%s", that.port);
    });
}


EspContactSensor.prototype.getState = function(callback) {
    callback(null, this.motionDetected);
};

EspContactSensor.prototype.httpHandler = function(that) {
    that.log("motion detected");

    that.isClosed = true;
    that.service.getCharacteristic(Characteristic.ContactSensorState)
        .updateValue(that.isClosed, null, "httpHandler");
    if (that.timeout) clearTimeout(that.timeout);
    that.timeout = setTimeout(function() {
        that.isClosed = false;
        that.service.getCharacteristic(Characteristic.ContactSensorState)
            .updateValue(that.isClosed, null, "httpHandler");
        that.timeout = null;
    }, 1 * 1000);
};


EspContactSensor.prototype.getServices = function() {
    return [this.informationService, this.service];
};
