'use strict'

const test = require('brittle')
const WrkPowerMeterRack = require('../../workers/lib/worker-base')
const { randomIP } = require('../util')

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
