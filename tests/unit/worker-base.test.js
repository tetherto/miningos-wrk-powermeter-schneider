'use strict'

const { EventEmitter } = require('events')
const test = require('brittle')
const WrkPowerMeterRack = require('../../workers/lib/worker-base')
const { randomIP } = require('../util')

test('WrkPowerMeterRack getThingType appends schneider suffix', (t) => {
  const result = WrkPowerMeterRack.prototype.getThingType.call({})
  t.is(result, 'powermeter-schneider')
})

test('WrkPowerMeterRack init registers svc-facs-modbus fac', (t) => {
  const Parent = require('@tetherto/miningos-tpl-wrk-powermeter/workers/rack.powermeter.wrk')
  const origInit = Parent.prototype.init
  Parent.prototype.init = function () {}
  try {
    let captured = null
    const mockThis = {
      setInitFacs (fac) {
        captured = fac
      }
    }
    WrkPowerMeterRack.prototype.init.call(mockThis)
    t.ok(captured)
    t.is(captured.length, 1)
    t.is(captured[0][1], '@tetherto/svc-facs-modbus')
  } finally {
    Parent.prototype.init = origInit
  }
})

test('WrkPowerMeterRack collectThingSnap delegates to ctrl.getSnap', async (t) => {
  const snap = { site_power_w: 100 }
  const thg = {
    ctrl: {
      getSnap: async () => snap
    }
  }
  const result = await WrkPowerMeterRack.prototype.collectThingSnap.call({}, thg)
  t.is(result, snap)
})

test('WrkPowerMeterRack _createInstance throws ERR_NO_IMPL', (t) => {
  t.exception(() => {
    WrkPowerMeterRack.prototype._createInstance.call({}, {})
  }, /ERR_NO_IMPL/)
})

test('WrkPowerMeterRack getThingTags returns schneider tag', (t) => {
  const prototype = WrkPowerMeterRack.prototype
  const result = prototype.getThingTags.call({})

  t.alike(result, ['schneider'])
})

test('WrkPowerMeterRack selectThingInfo returns connection info', (t) => {
  const prototype = WrkPowerMeterRack.prototype

  const mockThg = {
    opts: {
      address: randomIP(),
      port: 502,
      unitId: 1
    }
  }

  const result = prototype.selectThingInfo.call({}, mockThg)

  t.is(result.address, mockThg.opts.address)
  t.is(result.port, 502)
  t.is(result.unitId, 1)
})

test('WrkPowerMeterRack selectThingInfo handles missing opts', (t) => {
  const prototype = WrkPowerMeterRack.prototype

  const mockThg = {}
  const result = prototype.selectThingInfo.call({}, mockThg)

  t.is(result.address, undefined)
  t.is(result.port, undefined)
  t.is(result.unitId, undefined)
})

test('WrkPowerMeterRack connectThing returns 0 for missing required opts', async (t) => {
  const prototype = WrkPowerMeterRack.prototype

  // Create a mock object with _createInstance method
  const mockWorker = {
    _createInstance: () => { throw new Error('Should not be called') }
  }

  // Missing address
  const thg1 = { opts: { port: 502, unitId: 1 } }
  const result1 = await prototype.connectThing.call(mockWorker, thg1)
  t.is(result1, 0)

  // Missing port
  const thg2 = { opts: { address: '127.0.0.1', unitId: 1 } }
  const result2 = await prototype.connectThing.call(mockWorker, thg2)
  t.is(result2, 0)

  // Missing unitId
  const thg3 = { opts: { address: '127.0.0.1', port: 502 } }
  const result3 = await prototype.connectThing.call(mockWorker, thg3)
  t.is(result3, 0)

  // unitId is undefined
  const thg4 = { opts: { address: '127.0.0.1', port: 502, unitId: undefined } }
  const result4 = await prototype.connectThing.call(mockWorker, thg4)
  t.is(result4, 0) // Should return 0 because unitId === undefined
})

test('WrkPowerMeterRack connectThing returns 0 for unitId undefined', async (t) => {
  const prototype = WrkPowerMeterRack.prototype
  const mockWorker = {
    _createInstance: () => { throw new Error('Should not be called') }
  }

  const thg = {
    opts: {
      address: '127.0.0.1',
      port: 502,
      unitId: undefined
    }
  }

  const result = await prototype.connectThing.call(mockWorker, thg)
  t.is(result, 0)
})

test('WrkPowerMeterRack connectThing assigns ctrl and forwards errors', async (t) => {
  const prototype = WrkPowerMeterRack.prototype
  const powermeter = new EventEmitter()
  let debugCalled = false
  const mockWorker = {
    _createInstance: () => powermeter,
    debugThingError: (thg, err) => {
      debugCalled = true
      t.ok(err)
      t.is(err.message, 'modbus-fail')
    }
  }
  const thg = {
    id: 'pm-1',
    opts: { address: '192.168.1.10', port: 502, unitId: 2 }
  }

  const result = await prototype.connectThing.call(mockWorker, thg)
  t.is(result, 1)
  t.is(thg.ctrl, powermeter)

  powermeter.emit('error', new Error('modbus-fail'))
  t.ok(debugCalled)
})
