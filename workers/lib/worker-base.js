'use strict'

const WrkRack = require('miningos-tpl-wrk-powermeter/workers/rack.powermeter.wrk')

class WrkPowerMeterRack extends WrkRack {
  init () {
    super.init()

    this.setInitFacs([['fac', 'svc-facs-modbus', '0', '0', {}, 0]])
  }

  getThingType () {
    return super.getThingType() + '-schneider'
  }

  getThingTags () {
    return ['schneider']
  }

  async collectThingSnap (thg) {
    return thg.ctrl.getSnap()
  }

  selectThingInfo (thg) {
    return {
      address: thg.opts?.address,
      port: thg.opts?.port,
      unitId: thg.opts?.unitId
    }
  }

  _createInstance (thg) {
    throw new Error('ERR_NO_IMPL')
  }

  async connectThing (thg) {
    if (!thg.opts.address || !thg.opts.port || thg.opts.unitId === undefined) {
      return 0
    }

    const powermeter = this._createInstance(thg)

    powermeter.on('error', (e) => {
      this.debugThingError(thg, e)
    })

    thg.ctrl = powermeter

    return 1
  }
}

module.exports = WrkPowerMeterRack
