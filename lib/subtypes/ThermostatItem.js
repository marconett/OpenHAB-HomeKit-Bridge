/**
 * Copyright 2016 Henning Treu
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Accessory, Service, Characteristic, uuid } from 'hap-nodejs';
import request from 'request';
import debug from 'debug'; let logger = debug('Thermostat');

import { UpdateListener } from '../UpdateListener.js';

class ThermostatItem {
  constructor(name, url, state) {
    this.name = name;
    this.url = url;

    this.accessory = this.buildAccessory(state);
    this.updatingFromOpenHAB = false;

    // listen for OpenHAB updates
    let listener = undefined;
    this.registerOpenHABListener();
  }

  registerOpenHABListener() {
    this.listener = new UpdateListener(this.url, this.updateCharacteristics.bind(this));
    this.listener.startListener();
  };

  buildAccessory(state) {
    let position = state === 'Uninitialized' ? 100 : +state;
    let accessory = new Accessory(
      this.name, uuid.generate(this.constructor.name + this.name));

    let service = accessory.addService(Service.Thermostat, this.name);

    // Characteristic.CurrentHeatingCoolingState.OFF      Unit is set to off, neither heating nor cooling.
    // Characteristic.CurrentHeatingCoolingState.HEAT     Unit is set to heating.
    // Characteristic.CurrentHeatingCoolingState.COOL     Unit is set to cooling.
    let charactersiticCurrentHeatingCoolingState =
      service.getCharacteristic(Characteristic.CurrentHeatingCoolingState);
    charactersiticCurrentHeatingCoolingState.setValue(Characteristic.CurrentHeatingCoolingState.HEAT);
    charactersiticCurrentHeatingCoolingState.on('get', Characteristic.CurrentHeatingCoolingState.HEAT);

    // Characteristic.TargetHeatingCoolingState.OFF       Unit is set to off, neither heating nor cooling.
    // Characteristic.TargetHeatingCoolingState.HEAT      Unit is set to heating.
    // Characteristic.TargetHeatingCoolingState.COOL      Unit is set to cooling.
    // Characteristic.TargetHeatingCoolingState.AUTO      Unit is set to automatic.
    let charactersiticTargetHeatingCoolingState =
      service.getCharacteristic(Characteristic.TargetHeatingCoolingState);
    charactersiticTargetHeatingCoolingState.setValue(Characteristic.TargetHeatingCoolingState.AUTO);
    charactersiticTargetHeatingCoolingState.on('get', Characteristic.TargetHeatingCoolingState.AUTO);

    // The current temperature measured by the accessory. The value is a float in degrees Celsius.
    let charactersiticCurrentTemperature =
      service.getCharacteristic(Characteristic.CurrentTemperature);
    charactersiticCurrentTemperature.setValue('Uninitialized'); // TODO
    charactersiticCurrentTemperature.on('get',readOpenHabCurrentTemperatureState.bind(this));

    // The target temperature set for the accessory to achieve—for example on a thermostat. The value is a float in degrees Celsius.
    let charactersiticTargetTemperature =
      service.getCharacteristic(Characteristic.TargetTemperature);
    charactersiticTargetTemperature.setValue('Uninitialized'); // TODO
    charactersiticTargetTemperature.on('get', this.readOpenHabSetTemperatureState.bind(this));
    charactersiticTargetTemperature.on('set', this.updateOpenHabSetTemperature.bind(this));

    // Should display the temperature in the units chosen by the user. Note however that HomeKit always reports temperature values in degrees Celsius.
    let charactersiticTemperatureDisplayUnits =
      service.getCharacteristic(Characteristic.TemperatureDisplayUnits);
    charactersiticTemperatureDisplayUnits.setValue(Characteristic.TemperatureDisplayUnits.CELSIUS);
    charactersiticTemperatureDisplayUnits.on('get', Characteristic.TemperatureDisplayUnits.CELSIUS); // always return celcius

    // The current relative humidity measured by the accessory. The value is a float in percent.
    let charactersiticCurrentRelativeHumidity =
      service.getCharacteristic(Characteristic.CurrentRelativeHumidity);
    charactersiticCurrentRelativeHumidity.setValue('Uninitialized'); // TODO
    charactersiticCurrentRelativeHumidity.on('get', readOpenHabCurrentHumidityState.bind(this));

    return accessory;
  }

  updateOpenHabSetTemperature(value, callback) { // TODO
		logger('received rollershutter value from iOS: ' + value + ' for ' + this.name);
    if (this.updatingFromOpenHAB) {
      callback();
      return;
    }

    let command = '' + this.convertValue(value);

    request.post(
				this.url,
				{ body: command },
				function (error, response, body) {
            if (!error) {
              callback();
            }
				}
		);
	};

  readOpenHabCurrentTemperatureState(callback) { // TODO
    let widgetName = this.name;
    let widgetUrl = this.url;
    let _this = this;

		request(this.url + '/state?type=json', function (error, response, body) {
		  if (!error && response.statusCode === 200) {
        let value = _this.convertValue(body);
        /* istanbul ignore next */
        if (process.env.NODE_ENV !== 'test') {
          logger('read current position state: [' + body + '] ' + value + ' for ' + widgetName + ' from ' + widgetUrl);
        }
		    callback(false, value);
		  }
		});
  }

  readOpenHabCurrentHumidityState(callback) {
    // TODO
  }

  readOpenHabSetTemperatureState(callback) {
    // TODO
  }

  updateCharacteristics(message) {
    let position = this.convertValue(message);
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== 'test') {
      logger('current rollershutter position from openHAB: ' + message
        + ' for ' + this.name + ', updating iOS: ' + position + '');
    }

    this.updatingFromOpenHAB = true;
    this.accessory.getService(Service.Thermostat)
      .getCharacteristic(Characteristic.CurrentPosition)
        .setValue(position,
          function() { // callback to signal us iOS did process the update
            this.updatingFromOpenHAB = false;
          }.bind(this)
        );
	};
}

export { ThermostatItem };
