let broadLink = require('../helpers/broadlink');
let delayForDuration = require('../helpers/delayForDuration');
let catchDelayCancelError = require('../helpers/catchDelayCancelError');
let Hap;

module.exports = class Receiver {
  constructor(accessory, homebridge) {
    Hap = homebridge.hap;
    this.device = accessory.device;
    this.receiver = {};

    const {
      ip,
      port,
      mac,
      type,
      hexMute,
      hexVolUp,
      hexVolDown,
      repeat,
      interval,
    } = accessory.device.config.receiver;
    this.hexMute = hexMute;
    this.hexVolUp = hexVolUp;
    this.hexVolDown = hexVolDown;
    this.repeat = repeat;
    this.interval = interval;

    this.device.log.debug(ip, port, mac, type);
    broadLink.addDevice({ address: ip, port: port }, mac, type);
    broadLink.on('deviceReady', (device) => {
      this.device.log.debug(device);
      this.receiver = device;
    });

    this.createService();
  }

  createService() {
    this.service = new Hap.Service.TelevisionSpeaker(
      this.device.config.name + ' Volume'
    ).setCharacteristic(
      Hap.Characteristic.VolumeControlType,
      Hap.Characteristic.VolumeControlType.ABSOLUTE
    );

    this.service
      .getCharacteristic(Hap.Characteristic.Mute)
      .on('set', this.setMute.bind(this));

    this.service
      .getCharacteristic(Hap.Characteristic.VolumeSelector)
      .on('set', this.setVolume.bind(this));

    this.service.linked = true;
  }

  setMute(value, callback) {
    if (!this.receiver) {
      this.device.log.debug('Receiver not initialized');
      callback();
    }

    const hexBuffer = new Buffer.from(this.hexMute, 'hex');
    this.receiver.sendData(hexBuffer);
    callback();
  }

  setVolume(value, callback) {
    if (!this.receiver) {
      this.device.log.debug('Receiver not initialized');
      callback();
    }
    const hexBuffer = new Buffer.from(
      value ? this.hexVolDown : this.hexVolUp,
      'hex'
    );
    const sendCount = this.repeat || 1;
    if (sendCount > 1) {
      this.interval = this.interval / 10 || 0.1;
    }

    catchDelayCancelError(() => {
      for (let index = 0; index < sendCount; index++) {
        this.receiver.sendData(hexBuffer);

        if (interval && index < sendCount - 1) {
          this.intervalTimeoutPromise = delayForDuration(this.interval);
          this.intervalTimeoutPromise.then();
        }
      }
    }).then(() => callback());
  }
};
