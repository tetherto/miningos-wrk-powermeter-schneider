'use strict'

const P3U30PowerMeter = require('./lib/models/p3u30')
const WrkPowerMeterRack = require('./lib/worker-base')

class WrkPowerMeterRackP3U30 extends WrkPowerMeterRack {
  getThingType () {
    return super.getThingType() + '-p3u30'
  }

  _createInstance (thg) {
    return new P3U30PowerMeter({
      ...thg.opts,
      getClient: this.modbus_0.getClient.bind(this.modbus_0),
      conf: this.conf.thing.powermeter || {}
    })
  }
}

module.exports = WrkPowerMeterRackP3U30
