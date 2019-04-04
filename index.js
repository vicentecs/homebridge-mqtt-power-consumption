'use strict';
var inherits = require('util').inherits;
var Service, Characteristic;
var mqtt = require('mqtt');

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory('homebridge-mqtt-power-meter', 'mqtt-power-meter', MqttPowerMeterAccessory);
};

function MqttPowerMeterAccessory(log, config) {
    this.log = log;
    this.name = config['name'];
    this.url = config['url'];
    this.client_Id = 'mqttjs_' + Math.random().toString(16).substr(2, 8);
    this.options = {
        keepalive: 10,
        clientId: this.client_Id,
        protocolId: 'MQTT',
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        will: {
            topic: 'WillMsg',
            payload: 'Connection Closed abnormally..!',
            qos: 0,
            retain: false
        },
        username: config['username'],
        password: config['password'],
        rejectUnauthorized: false
    };

    this.voltsConsumption = 0;
    this.ampsConsumption = 0;
    this.wattsConsumption = 0;
    this.topics = config['topics'];

    var EveVoltsConsumption = function() {
        Characteristic.call(this, 'Volts', 'F208B4F8-51CF-49F1-A893-E94ED9636C54');
        this.setProps({
            format: Characteristic.Formats.UINT16,
            unit: 'volts',
            maxValue: 254,
            minValue: 0,
            minStep: 1,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(EveVoltsConsumption, Characteristic);

    var EveAmpsConsumption = function() {
        Characteristic.call(this, 'Amps', 'E99525EC-E068-408F-9F6F-75BC4141F520');
        this.setProps({
            format: Characteristic.Formats.FLOAT,
            unit: 'amps',
            maxValue: 1000,
            minValue: 0,
            minStep: 0.1,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(EveAmpsConsumption, Characteristic);

    var EveWattsConsumption = function() {
        Characteristic.call(this, 'Watts', 'EAF81118-0168-4B42-BC90-3DA56902DC5B');
        this.setProps({
            format: Characteristic.Formats.UINT16,
            unit: 'watts',
            maxValue: 10000,
            minValue: 0,
            minStep: 1,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(EveWattsConsumption, Characteristic);

    var PowerMeterService = function(displayName, subtype) {
        Service.call(this, displayName, '00000001-0000-1777-8000-775D67EC4377', subtype);
        this.addCharacteristic(EveVoltsConsumption);
        this.addOptionalCharacteristic(EveAmpsConsumption);
        this.addOptionalCharacteristic(EveWattsConsumption);
    };

    inherits(PowerMeterService, Service);

    this.service = new PowerMeterService(this.options['name']);
    this.service.getCharacteristic(EveVoltsConsumption).on('get', this.getVoltsConsumption.bind(this));
    this.service.addCharacteristic(EveAmpsConsumption).on('get', this.getAmpsConsumption.bind(this));
    this.service.addCharacteristic(EveWattsConsumption).on('get', this.getWattsConsumption.bind(this));

    this.client = mqtt.connect(this.url, this.options);

    var self = this;

    this.client.on('error', function (err) {
        self.log('Error event on MQTT:', err);
    });

    this.client.on('message', function (topic, message) {
        if (topic == self.topics['power']) {
            self.voltsConsumption = parseFloat(message.toString());
            self.service.getCharacteristic(EveVoltsConsumption).setValue(self.voltsConsumption, undefined, undefined);
        }

        if (topic == self.topics['amps']) {
            self.ampsConsumption = parseFloat(message.toString());
            self.service.getCharacteristic(EveAmpsConsumption).setValue(self.ampsConsumption, undefined, undefined);
        }

        if (topic == self.topics['watts']) {
            self.wattsConsumption = parseFloat(message.toString());
            self.service.getCharacteristic(EveWattsConsumption).setValue(self.wattsConsumption, undefined, undefined);
        }
    });

    this.client.subscribe(self.topics['volts']);
    this.client.subscribe(self.topics['watts']);
    this.client.subscribe(self.topics['amps']);
}

MqttPowerMeterAccessory.prototype.getVoltsConsumption = function (callback) {
    callback(null, this.voltsConsumption);
};

MqttPowerMeterAccessory.prototype.getAmpsConsumption = function (callback) {
    callback(null, this.ampsConsumption);
};

MqttPowerMeterAccessory.prototype.getWattsConsumption = function (callback) {
    callback(null, this.wattsConsumption);
};

MqttPowerMeterAccessory.prototype.getServices = function () {
    return [this.service];
};
