'use strict'

const test = require('brittle')
const PM5340PowerMeter = require('../../workers/lib/models/pm5340')
const { randomIP } = require('../util')

test('PM5340PowerMeter _prepInstantaneousValues with valid buffer', (t) => {
  const mockGetClient = () => ({ end: () => {} })
  const powermeter = new PM5340PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1
  })

  // Create a buffer with test data (224 bytes for 112 registers)
  const buffer = Buffer.alloc(224)

  // Current values (0-20)
  buffer.writeFloatBE(5.134, 0) // current_a_a
  buffer.writeFloatBE(5.299, 4) // current_b_a
  buffer.writeFloatBE(5.463, 8) // current_c_a
  buffer.writeFloatBE(0.0, 12) // current_n_a
  buffer.writeFloatBE(0.0, 16) // current_g_a
  buffer.writeFloatBE(5.299, 20) // current_avg_a

  // Current unbalance (24-36)
  buffer.writeFloatBE(3.111, 24) // current_unbalance_a_pct
  buffer.writeFloatBE(0.005, 28) // current_unbalance_b_pct
  buffer.writeFloatBE(3.106, 32) // current_unbalance_c_pct
  buffer.writeFloatBE(3.111, 36) // current_unbalance_worst_pct

  // Voltage values (40-72)
  buffer.writeFloatBE(391.293, 40) // voltage_a_b_v
  buffer.writeFloatBE(391.560, 44) // voltage_b_c_v
  buffer.writeFloatBE(390.302, 48) // voltage_c_a_v
  buffer.writeFloatBE(391.052, 52) // voltage_l_l_avg_v
  buffer.writeFloatBE(226.004, 56) // voltage_a_n_v
  buffer.writeFloatBE(225.339, 60) // voltage_b_n_v
  buffer.writeFloatBE(225.993, 64) // voltage_c_n_v
  buffer.writeFloatBE(225.779, 72) // voltage_l_n_avg_v

  // Voltage unbalance (76-104)
  buffer.writeFloatBE(0.061, 76) // voltage_unbalance_a_b_pct
  buffer.writeFloatBE(0.130, 80) // voltage_unbalance_b_c_pct
  buffer.writeFloatBE(0.191, 84) // voltage_unbalance_c_a_pct
  buffer.writeFloatBE(0.191, 88) // voltage_unbalance_l_l_worst_pct
  buffer.writeFloatBE(0.099, 92) // voltage_unbalance_a_n_pct
  buffer.writeFloatBE(0.194, 96) // voltage_unbalance_b_n_pct
  buffer.writeFloatBE(0.094, 100) // voltage_unbalance_c_n_pct
  buffer.writeFloatBE(0.194, 104) // voltage_unbalance_l_n_worst_pct

  // Power values (108-184)
  buffer.writeFloatBE(1.5, 108) // active_power_a_w (will be * 1000)
  buffer.writeFloatBE(2.0, 112) // active_power_b_w (will be * 1000)
  buffer.writeFloatBE(2.5, 116) // active_power_c_w (will be * 1000)
  buffer.writeFloatBE(6.0, 120) // active_power_total_w (will be * 1000)
  buffer.writeFloatBE(-1.0, 124) // reactive_power_a_var (will be * 1000)
  buffer.writeFloatBE(-1.5, 128) // reactive_power_b_var (will be * 1000)
  buffer.writeFloatBE(-2.0, 132) // reactive_power_c_var (will be * 1000)
  buffer.writeFloatBE(-4.5, 136) // reactive_power_total_var (will be * 1000)
  buffer.writeFloatBE(1.8, 140) // apparent_power_a_va (will be * 1000)
  buffer.writeFloatBE(2.3, 144) // apparent_power_b_va (will be * 1000)
  buffer.writeFloatBE(2.8, 148) // apparent_power_c_va (will be * 1000)
  buffer.writeFloatBE(6.9, 152) // apparent_power_total_va (will be * 1000)
  buffer.writeFloatBE(1.52, 156) // power_factor_a
  buffer.writeFloatBE(1.55, 160) // power_factor_b
  buffer.writeFloatBE(1.53, 164) // power_factor_c
  buffer.writeFloatBE(1.54, 168) // power_factor_total
  buffer.writeFloatBE(1.33, 172) // displacement_power_factor_a
  buffer.writeFloatBE(1.37, 176) // displacement_power_factor_b
  buffer.writeFloatBE(1.33, 180) // displacement_power_factor_c
  buffer.writeFloatBE(1.35, 184) // displacement_power_factor_total

  // Frequency (220)
  buffer.writeFloatBE(49.985, 220) // frequency_hz

  const result = powermeter._prepInstantaneousValues(buffer)

  // Test current values (with floating point tolerance)
  t.ok(Math.abs(result.current_a_a - 5.134) < 0.001)
  t.ok(Math.abs(result.current_b_a - 5.299) < 0.001)
  t.ok(Math.abs(result.current_c_a - 5.463) < 0.001)
  t.is(result.current_n_a, 0.0)
  t.is(result.current_g_a, 0.0)
  t.ok(Math.abs(result.current_avg_a - 5.299) < 0.001)

  // Test current unbalance
  t.ok(Math.abs(result.current_unbalance_a_pct - 3.111) < 0.001)
  t.ok(Math.abs(result.current_unbalance_b_pct - 0.005) < 0.001)
  t.ok(Math.abs(result.current_unbalance_c_pct - 3.106) < 0.001)
  t.ok(Math.abs(result.current_unbalance_worst_pct - 3.111) < 0.001)

  // Test voltage values
  t.ok(Math.abs(result.voltage_a_b_v - 391.293) < 0.001)
  t.ok(Math.abs(result.voltage_b_c_v - 391.560) < 0.001)
  t.ok(Math.abs(result.voltage_c_a_v - 390.302) < 0.001)
  t.ok(Math.abs(result.voltage_l_l_avg_v - 391.052) < 0.001)
  t.ok(Math.abs(result.voltage_a_n_v - 226.004) < 0.001)
  t.ok(Math.abs(result.voltage_b_n_v - 225.339) < 0.001)
  t.ok(Math.abs(result.voltage_c_n_v - 225.993) < 0.001)
  t.ok(Math.abs(result.voltage_l_n_avg_v - 225.779) < 0.001)

  // Test voltage unbalance
  t.ok(Math.abs(result.voltage_unbalance_a_b_pct - 0.061) < 0.001)
  t.ok(Math.abs(result.voltage_unbalance_b_c_pct - 0.130) < 0.001)
  t.ok(Math.abs(result.voltage_unbalance_c_a_pct - 0.191) < 0.001)
  t.ok(Math.abs(result.voltage_unbalance_l_l_worst_pct - 0.191) < 0.001)
  t.ok(Math.abs(result.voltage_unbalance_a_n_pct - 0.099) < 0.001)
  t.ok(Math.abs(result.voltage_unbalance_b_n_pct - 0.194) < 0.001)
  t.ok(Math.abs(result.voltage_unbalance_c_n_pct - 0.094) < 0.001)
  t.ok(Math.abs(result.voltage_unbalance_l_n_worst_pct - 0.194) < 0.001)

  // Test power values (multiplied by 1000)
  t.is(result.active_power_a_w, 1500) // 1.5 * 1000
  t.is(result.active_power_b_w, 2000) // 2.0 * 1000
  t.is(result.active_power_c_w, 2500) // 2.5 * 1000
  t.is(result.active_power_total_w, 6000) // 6.0 * 1000
  t.is(result.reactive_power_a_var, -1000) // -1.0 * 1000
  t.is(result.reactive_power_b_var, -1500) // -1.5 * 1000
  t.is(result.reactive_power_c_var, -2000) // -2.0 * 1000
  t.is(result.reactive_power_total_var, -4500) // -4.5 * 1000
  t.ok(Math.abs(result.apparent_power_a_va - 1800) < 1) // 1.8 * 1000
  t.ok(Math.abs(result.apparent_power_b_va - 2300) < 1) // 2.3 * 1000
  t.ok(Math.abs(result.apparent_power_c_va - 2800) < 1) // 2.8 * 1000
  t.ok(Math.abs(result.apparent_power_total_va - 6900) < 1) // 6.9 * 1000

  // Test power factors
  t.ok(Math.abs(result.power_factor_a - 1.52) < 0.01)
  t.ok(Math.abs(result.power_factor_b - 1.55) < 0.01)
  t.ok(Math.abs(result.power_factor_c - 1.53) < 0.01)
  t.ok(Math.abs(result.power_factor_total - 1.54) < 0.01)
  t.ok(Math.abs(result.displacement_power_factor_a - 1.33) < 0.01)
  t.ok(Math.abs(result.displacement_power_factor_b - 1.37) < 0.01)
  t.ok(Math.abs(result.displacement_power_factor_c - 1.33) < 0.01)
  t.ok(Math.abs(result.displacement_power_factor_total - 1.35) < 0.01)

  // Test frequency
  t.ok(Math.abs(result.frequency_hz - 49.985) < 0.001)
})

test('PM5340PowerMeter _readValues calls client.read with correct parameters', async (t) => {
  let readCalled = false
  const readCalls = []

  // Create a full 224-byte buffer with test data
  const fullBuffer = Buffer.alloc(224)
  fullBuffer.writeFloatBE(400.0, 40) // voltage_a_b_v
  fullBuffer.writeFloatBE(400.0, 44) // voltage_b_c_v
  fullBuffer.writeFloatBE(400.0, 48) // voltage_c_a_v
  fullBuffer.writeFloatBE(3.0, 120) // active_power_total_w

  const mockClient = {
    read: async (functionCode, address, quantity) => {
      readCalled = true
      readCalls.push({ functionCode, address, quantity })

      // Calculate the byte offset from register address
      const startRegister = 3000
      const byteOffset = (address - startRegister) * 2
      const byteLength = quantity * 2

      // Return the appropriate subarray of the buffer
      return fullBuffer.subarray(byteOffset, byteOffset + byteLength)
    },
    end: () => {}
  }

  const mockGetClient = () => mockClient
  const powermeter = new PM5340PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000
  })

  const result = await powermeter._readValues()

  t.ok(readCalled)
  t.is(readCalls[0].functionCode, 3) // READ_HOLDING_REGISTERS
  t.is(readCalls[0].address, 3000) // First chunk starts at 3000
  t.is(readCalls[0].quantity, 16) // First chunk is 16 registers
  t.ok(readCalls.length > 1, 'Should make multiple chunked reads')
  t.ok(result.stats)
  t.is(result.stats.power_w, 3000) // 3.0 * 1000
  t.ok(result.stats.tension_v) // tension_v should be present
  t.ok(result.stats.powermeter_specific)
  t.ok(result.stats.powermeter_specific.instantaneous_values)
  t.ok(result.config)
})

test('PM5340PowerMeter _readValues handles timeout', async (t) => {
  const mockGetClient = () => ({
    read: async () => {
      throw new Error('TIMEOUT')
    },
    end: () => {}
  })

  const powermeter = new PM5340PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 1000
  })

  await t.exception(async () => {
    await powermeter._readValues()
  }, /TIMEOUT/)
})

test('PM5340PowerMeter _readValues caches result', async (t) => {
  const mockClient = {
    read: async () => {
      const buffer = Buffer.alloc(224)
      buffer.writeFloatBE(4.0, 120) // active_power_total_w
      return buffer
    },
    end: () => {}
  }

  const mockGetClient = () => mockClient
  const powermeter = new PM5340PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1
  })

  const result1 = await powermeter._readValues()
  const result2 = await powermeter._readValues()

  t.ok(powermeter.cache)
  t.alike(result1, result2)
  t.alike(powermeter.cache, result1)
})

test('PM5340PowerMeter _prepSnap uses cache when readFromCache=true', async (t) => {
  const mockGetClient = () => ({ end: () => {} })
  const powermeter = new PM5340PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1
  })

  // Set cache data
  powermeter.cache = {
    stats: { power_w: 5000 },
    config: { test: true }
  }

  const result = await powermeter._prepSnap(true)

  t.ok(result.success)
  t.is(result.stats.power_w, 5000)
  t.ok(result.config.test)
})
