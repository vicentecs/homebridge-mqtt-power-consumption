# homebridge-mqtt-power-meter
An homebridge plugin that create an HomeKit power consumption accessory mapped on MQTT topics.

# Installation
Follow the instruction in [homebridge](https://www.npmjs.com/package/homebridge) for the homebridge server installation.
The plugin is published through [NPM](https://www.npmjs.com/package/homebridge-mqtt-power-meter) and should be installed "globally" by typing:

    npm install -g homebridge-mqtt-power-meter

# Configuration
Remember to configure the plugin in config.json in your home directory inside the .homebridge directory. Configuration parameters:
```javascript
{
  "accessory": "mqtt-power-meter",
  "name": "<name of the power-meter>",
  "url": "<url of the broker>", // i.e. "http://mosquitto.org:1883"
  "username": "<username>",
  "password": "<password>",
  "topics": {
    "volts": "<topic to get the volts power >",
    "amps": "<topic to get the amps power>",
    "watts": "<topic to get the watts power>"
  }
}
```

# Info
Uses special characteristics of the eve power outlet. Apples Home app does not show special characteristic, power consumption
will only be displayed in the eve app.
