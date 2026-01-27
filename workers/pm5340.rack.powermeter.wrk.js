'use strict'

const PM5340PowerMeter = require('./lib/models/pm5340')
const WrkPowerMeterRack = require('./lib/worker-base')

class WrkPowerMeterRackPM5340 extends WrkPowerMeterRack {
  getThingType () {
    return super.getThingType() + '-pm5340'
  }

  _createInstance (thg) {
    return new PM5340PowerMeter({
      ...thg.opts,
      getClient: this.modbus_0.getClient.bind(this.modbus_0),
      conf: this.conf.thing.powermeter || {}
    })
  }
}

module.exports = WrkPowerMeterRackPM5340
