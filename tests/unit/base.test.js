'use strict'

const test = require('brittle')
const SchneiderPowerMeter = require('../../workers/lib/models/base')
const { randomIP } = require('../util')

test('SchneiderPowerMeter constructor initializes with valid getClient', (t) => {
  const mockGetClient = (opts) => ({
    address: opts.address,
    port: opts.port,
    unitId: opts.unitId,
    protocol: opts.protocol,
    timeout: opts.timeout,
    end: () => {}
  })

  const address = randomIP()
  const powermeter = new SchneiderPowerMeter({
    getClient: mockGetClient,
    address,
    port: 502,
    unitId: 1,
    timeout: 5000
  })

  t.ok(powermeter.client)
  t.is(powermeter.client.address, address)
  t.is(powermeter.client.port, 502)
  t.is(powermeter.client.unitId, 1)
  t.is(powermeter.client.timeout, 5000)
})

test('SchneiderPowerMeter close method calls client.end()', (t) => {
  let endCalled = false
  const mockGetClient = () => ({
    end: () => { endCalled = true }
  })

  const powermeter = new SchneiderPowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1
  })

  powermeter.close()
  t.ok(endCalled)
})

test('SchneiderPowerMeter _readValues throws error (abstract method)', async (t) => {
  const mockGetClient = () => ({ end: () => {} })
  const powermeter = new SchneiderPowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1
  })

  await t.exception(async () => {
    await powermeter._readValues()
  }, /ERR_READ_VALUES_NO_IMPL/)
})

test('SchneiderPowerMeter _prepSnap with readFromCache=false calls _readValues', async (t) => {
  const mockGetClient = () => ({ end: () => {} })
  const powermeter = new SchneiderPowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1
  })

  // Mock _readValues to return test data
  powermeter._readValues = async () => ({
    stats: { power_w: 1000 },
    config: {}
  })

  const result = await powermeter._prepSnap(false)

  t.ok(result.success)
  t.is(result.stats.power_w, 1000)
  t.ok(result.config)
})

test('SchneiderPowerMeter _prepSnap with readFromCache=true uses cache', async (t) => {
  const mockGetClient = () => ({ end: () => {} })
  const powermeter = new SchneiderPowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1
  })

  // Set cache data
  powermeter.cache = {
    stats: { power_w: 2000 },
    config: { test: true }
  }

  const result = await powermeter._prepSnap(true)

  t.ok(result.success)
  t.is(result.stats.power_w, 2000)
  t.ok(result.config.test)
})
