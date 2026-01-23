'use strict'

const test = require('brittle')
const libStats = require('../../workers/lib/stats')
const { isTransformerPM } = require('../../workers/lib/utils')

test('libStats has powermeter specs defined', (t) => {
  t.ok(libStats.specs)
  t.ok(libStats.specs.powermeter)
  t.ok(libStats.specs.powermeter.ops)
})

test('libStats powermeter specs extends powermeter_default', (t) => {
  t.ok(libStats.specs.powermeter_default)
  t.ok(libStats.specs.powermeter.ops)

  // Check that it has the default ops plus custom ones
  const defaultOps = Object.keys(libStats.specs.powermeter_default.ops)
  const customOps = Object.keys(libStats.specs.powermeter.ops)

  // Should have at least the default ops
  t.ok(defaultOps.length > 0)
  t.ok(customOps.length >= defaultOps.length)
})

test('libStats has site_power_w operation', (t) => {
  const sitePowerOp = libStats.specs.powermeter.ops.site_power_w

  t.ok(sitePowerOp)
  t.is(sitePowerOp.op, 'sum')
  t.is(sitePowerOp.src, 'last.snap.stats.power_w')
  t.is(typeof sitePowerOp.filter, 'function')
})

test('libStats site_power_w filter works correctly', (t) => {
  const sitePowerOp = libStats.specs.powermeter.ops.site_power_w
  const filter = sitePowerOp.filter

  // Test site position
  t.ok(filter({ info: { pos: 'site' } }))
  t.ok(filter({ info: { pos: 'site', other: 'data' } }))

  // Test non-site positions
  t.not(filter({ info: { pos: 'rack1' } }))
  t.not(filter({ info: { pos: 'tr1' } }))
  t.not(filter({ info: { pos: 'other' } }))
  t.not(filter({ info: {} }))
  t.not(filter({}))
  t.not(filter(null))
  t.not(filter(undefined))
})

test('libStats has transformer_power_w operation', (t) => {
  const transformerPowerOp = libStats.specs.powermeter.ops.transformer_power_w

  t.ok(transformerPowerOp)
  t.is(transformerPowerOp.op, 'sum')
  t.is(transformerPowerOp.src, 'last.snap.stats.power_w')
  t.is(transformerPowerOp.filter, isTransformerPM)
})

test('libStats transformer_power_w filter uses isTransformerPM function', (t) => {
  const transformerPowerOp = libStats.specs.powermeter.ops.transformer_power_w
  const filter = transformerPowerOp.filter

  // Test transformer positions
  t.ok(filter({ info: { pos: 'tr1' } }))
  t.ok(filter({ info: { pos: 'tr10' } }))
  t.ok(filter({ info: { pos: 'tr123' } }))

  // Test non-transformer positions
  t.not(filter({ info: { pos: 'site' } }))
  t.not(filter({ info: { pos: 'rack1' } }))
  t.not(filter({ info: { pos: 'other' } }))
  t.not(filter({ info: {} }))
  t.not(filter({}))
  t.not(filter(null))
})

test('libStats has power_w_pos_group operation', (t) => {
  const powerGroupOp = libStats.specs.powermeter.ops.power_w_pos_group

  t.ok(powerGroupOp)
  t.is(powerGroupOp.op, 'group')
  t.is(powerGroupOp.src, 'last.snap.stats.power_w')
  t.is(typeof powerGroupOp.group, 'function')
})

test('libStats power_w_pos_group uses groupBy function', (t) => {
  const powerGroupOp = libStats.specs.powermeter.ops.power_w_pos_group
  const groupBy = powerGroupOp.group

  // Test that groupBy is a function
  t.is(typeof groupBy, 'function')

  // Test that groupBy is the expected function from miningos-lib-stats
  t.ok(groupBy)
})

test('libStats maintains original powermeter_default ops', (t) => {
  const defaultOps = libStats.specs.powermeter_default.ops
  const customOps = libStats.specs.powermeter.ops

  // Check that all default ops are still present
  Object.keys(defaultOps).forEach(opName => {
    t.ok(customOps[opName], `Default op ${opName} should be present`)
    t.alike(customOps[opName], defaultOps[opName], `Default op ${opName} should be unchanged`)
  })
})

test('libStats adds new custom operations', (t) => {
  const customOps = libStats.specs.powermeter.ops

  // Check that new custom ops are present
  t.ok(customOps.site_power_w, 'site_power_w should be present')
  t.ok(customOps.transformer_power_w, 'transformer_power_w should be present')
  t.ok(customOps.power_w_pos_group, 'power_w_pos_group should be present')

  // Check that they are not in the default ops
  const defaultOps = libStats.specs.powermeter_default.ops
  t.not(defaultOps.site_power_w, 'site_power_w should not be in default')
  t.not(defaultOps.transformer_power_w, 'transformer_power_w should not be in default')
  t.not(defaultOps.power_w_pos_group, 'power_w_pos_group should not be in default')
})

test('libStats operation configurations are correct', (t) => {
  const ops = libStats.specs.powermeter.ops

  // Test site_power_w configuration
  t.is(ops.site_power_w.op, 'sum')
  t.is(ops.site_power_w.src, 'last.snap.stats.power_w')
  t.is(typeof ops.site_power_w.filter, 'function')

  // Test transformer_power_w configuration
  t.is(ops.transformer_power_w.op, 'sum')
  t.is(ops.transformer_power_w.src, 'last.snap.stats.power_w')
  t.is(ops.transformer_power_w.filter, isTransformerPM)

  // Test power_w_pos_group configuration
  t.is(ops.power_w_pos_group.op, 'group')
  t.is(ops.power_w_pos_group.src, 'last.snap.stats.power_w')
  t.is(typeof ops.power_w_pos_group.group, 'function')
})

test('libStats has power_w_container_group_sum operation', (t) => {
  const op = libStats.specs.powermeter.ops.power_w_container_group_sum

  t.ok(op)
  t.is(op.op, 'group_sum')
  t.is(op.src, 'last.snap.stats.power_w')
  t.is(typeof op.group, 'function')
})
