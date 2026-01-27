'use strict'

const test = require('brittle')
const P3U30PowerMeter = require('../../workers/lib/models/p3u30')

test('P3U30PowerMeter _prepInstantaneousValues with valid buffer', (t) => {
  const mockGetClient = () => ({ end: () => {} })
  const powermeter = new P3U30PowerMeter({
    getClient: mockGetClient,
    address: '127.0.0.1',
    port: 502,
    unitId: 1
  })

  // Create a buffer with test data (22 bytes as expected)
  const buffer = Buffer.alloc(22)
  buffer.writeInt16BE(12000, 0) // line_voltage_a_b_v
  buffer.writeInt16BE(1222, 2) // line_voltage_b_c_v
  buffer.writeInt16BE(1303, 4) // line_voltage_c_a_v
  buffer.writeInt16BE(1783, 6) // phase_voltage_a_v
  buffer.writeInt16BE(938, 8) // phase_voltage_b_v
  buffer.writeInt16BE(1502, 10) // phase_voltage_c_v
  buffer.writeInt16BE(1203, 12) // residual_voltage
  buffer.writeInt16BE(3702, 14) // frequency_hz
  buffer.writeInt16BE(5, 16) // active_power_w (will be multiplied by 1000)
  buffer.writeInt16BE(2104, 18) // reactive_power_var (will be multiplied by 1000)
  buffer.writeInt16BE(3848, 20) // apparent_power_va (will be multiplied by 1000)

  const result = powermeter._prepInstantaneousValues(buffer)

  t.is(result.line_voltage_a_b_v, 12000)
  t.is(result.line_voltage_b_c_v, 1222)
  t.is(result.line_voltage_c_a_v, 1303)
  t.is(result.phase_voltage_a_v, 1783)
  t.is(result.phase_voltage_b_v, 938)
  t.is(result.phase_voltage_c_v, 1502)
  t.is(result.residual_voltage, 1203)
  t.is(result.frequency_hz, 3702)
  t.is(result.active_power_w, 5000) // 5 * 1000
  t.is(result.reactive_power_var, 2104000) // 2104 * 1000
  t.is(result.apparent_power_va, 3848000) // 3848 * 1000
})

test('P3U30PowerMeter _prepInstantaneousValues throws error for invalid data', (t) => {
  const mockGetClient = () => ({ end: () => {} })
  const powermeter = new P3U30PowerMeter({
    getClient: mockGetClient,
    address: '127.0.0.1',
    port: 502,
    unitId: 1
  })

  t.exception(() => {
    powermeter._prepInstantaneousValues(null)
  }, /ERR_DATA_INVALID: Expected a Buffer/)

  t.exception(() => {
    powermeter._prepInstantaneousValues('invalid')
  }, /ERR_DATA_INVALID: Expected a Buffer/)

  t.exception(() => {
    powermeter._prepInstantaneousValues(Buffer.alloc(10))
  }, /ERR_DATA_INSUFFICIENT: Expected 22 bytes but received 10/)
})

test('P3U30PowerMeter _readValues calls client.read with correct parameters', async (t) => {
  let readCalled = false
  let readParams = null
  const mockClient = {
    read: async (functionCode, address, quantity) => {
      readCalled = true
      readParams = { functionCode, address, quantity }
      // Return a buffer with test data
      const buffer = Buffer.alloc(22)
      buffer.writeInt16BE(400, 0) // line_voltage_a_b_v
      buffer.writeInt16BE(400, 2) // line_voltage_b_c_v
      buffer.writeInt16BE(400, 4) // line_voltage_c_a_v
      buffer.writeInt16BE(1000, 16) // active_power_w
      return buffer
    },
    end: () => {}
  }

  const mockGetClient = () => mockClient
  const powermeter = new P3U30PowerMeter({
    getClient: mockGetClient,
    address: '127.0.0.1',
    port: 502,
    unitId: 1,
    timeout: 5000
  })

  const result = await powermeter._readValues()

  t.ok(readCalled)
  t.is(readParams.functionCode, 3) // READ_HOLDING_REGISTERS
  t.is(readParams.address, 2014)
  t.is(readParams.quantity, 11)
  t.ok(result.stats)
  t.is(result.stats.power_w, 1000000) // 1000 * 1000
  t.ok(result.stats.tension_v) // tension_v should be present
  t.ok(result.stats.powermeter_specific)
  t.ok(result.stats.powermeter_specific.instantaneous_values)
  t.ok(result.config)
})

test('P3U30PowerMeter _readValues handles timeout', async (t) => {
  const mockGetClient = () => ({
    read: async () => {
      throw new Error('TIMEOUT')
    },
    end: () => {}
  })

  const powermeter = new P3U30PowerMeter({
    getClient: mockGetClient,
    address: '127.0.0.1',
    port: 502,
    unitId: 1,
    timeout: 1000
  })

  await t.exception(async () => {
    await powermeter._readValues()
  }, /TIMEOUT/)
})

test('P3U30PowerMeter _readValues caches result', async (t) => {
  const mockClient = {
    read: async () => {
      const buffer = Buffer.alloc(22)
      buffer.writeInt16BE(2000, 16) // active_power_w
      return buffer
    },
    end: () => {}
  }

  const mockGetClient = () => mockClient
  const powermeter = new P3U30PowerMeter({
    getClient: mockGetClient,
    address: '127.0.0.1',
    port: 502,
    unitId: 1
  })

  const result1 = await powermeter._readValues()
  const result2 = await powermeter._readValues()

  // Check that cache is set and results have same structure
  t.ok(powermeter.cache)
  t.alike(result1, result2) // Should have same content
  t.alike(powermeter.cache, result1)
})

test('P3U30PowerMeter _prepSnap uses cache when readFromCache=true', async (t) => {
  const mockGetClient = () => ({ end: () => {} })
  const powermeter = new P3U30PowerMeter({
    getClient: mockGetClient,
    address: '127.0.0.1',
    port: 502,
    unitId: 1
  })

  // Set cache data
  powermeter.cache = {
    stats: { power_w: 3000 },
    config: { test: true }
  }

  const result = await powermeter._prepSnap(true)

  t.ok(result.success)
  t.is(result.stats.power_w, 3000)
  t.ok(result.config.test)
})
