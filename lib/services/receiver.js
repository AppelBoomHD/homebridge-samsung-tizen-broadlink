let BroadLink = require('broadlinkjs-rm');
let Hap;

module.exports = class Receiver {
  constructor(accessory, homebridge) {
    Hap = homebridge.hap;
    this.device = accessory.device;
    this.broadlink = new BroadLink();
    this.receiver = {};

    const { ip, port, mac, type, hexMute, hexVolUp, hexVolDown } =
      accessory.device.config.receiver;
    this.hexMute = hexMute;
    this.hexVolUp = hexVolUp;
    this.hexVolDown = hexVolDown;
    this.broadLink.addDevice({ address: ip, port: port }, mac, type);
    this.broadLink.on('deviceReady', (device) => {
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
      this.device.log.debug(error.stack);
      callback();
    }

    const hexBuffer = new Buffer.from(this.hexMute, 'hex');
    this.receiver.sendData(hexBuffer, true);
  }

  setVolume(value, callback) {
    if (!this.receiver) {
      this.device.log.debug(error.stack);
      callback();
    }

    const hexBuffer = new Buffer.from(
      value ? this.hexVolDown : this.hexVolUp,
      'hex'
    );
    this.receiver.sendData(hexBuffer, true);
  }
};
