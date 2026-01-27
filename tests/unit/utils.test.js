'use strict'

const test = require('brittle')
const { isTransformerPM } = require('../../workers/lib/utils')

test('isTransformerPM returns true for valid transformer positions', (t) => {
  // Test various transformer position formats
  t.ok(isTransformerPM({ info: { pos: 'tr1' } }))
  t.ok(isTransformerPM({ info: { pos: 'tr10' } }))
  t.ok(isTransformerPM({ info: { pos: 'tr123' } }))
  t.ok(isTransformerPM({ info: { pos: 'tr0' } }))
  t.ok(isTransformerPM({ info: { pos: 'tr999' } }))
})

test('isTransformerPM returns false for invalid transformer positions', (t) => {
  // Test non-transformer positions
  t.not(isTransformerPM({ info: { pos: 'site' } }))
  t.not(isTransformerPM({ info: { pos: 'rack1' } }))
  t.not(isTransformerPM({ info: { pos: 'tr' } })) // No number
  t.not(isTransformerPM({ info: { pos: 'tr1a' } })) // Contains letters
  t.not(isTransformerPM({ info: { pos: '1tr' } })) // Number before tr
  t.not(isTransformerPM({ info: { pos: 'tr-1' } })) // Contains dash
  t.not(isTransformerPM({ info: { pos: 'tr_1' } })) // Contains underscore
  t.not(isTransformerPM({ info: { pos: 'TR1' } })) // Uppercase
  t.not(isTransformerPM({ info: { pos: 'Tr1' } })) // Mixed case
})

test('isTransformerPM returns false for missing or invalid entry', (t) => {
  // Test missing or invalid entries
  t.not(isTransformerPM(null))
  t.not(isTransformerPM(undefined))
  t.not(isTransformerPM({}))
  t.not(isTransformerPM({ info: {} }))
  t.not(isTransformerPM({ info: null }))
  t.not(isTransformerPM({ info: undefined }))
  t.not(isTransformerPM({ info: { pos: null } }))
  t.not(isTransformerPM({ info: { pos: undefined } }))
  t.not(isTransformerPM({ info: { pos: '' } }))
})

test('isTransformerPM handles edge cases', (t) => {
  // Test very large numbers
  t.ok(isTransformerPM({ info: { pos: 'tr999999' } }))

  // Test single digit
  t.ok(isTransformerPM({ info: { pos: 'tr5' } }))

  // Test with extra properties (should still match)
  t.ok(isTransformerPM({
    info: {
      pos: 'tr42',
      other: 'value',
      nested: { prop: 'test' }
    }
  }))

  // Test with non-string pos (should not match)
  t.not(isTransformerPM({ info: { pos: 123 } }))
  t.not(isTransformerPM({ info: { pos: true } }))
  t.not(isTransformerPM({ info: { pos: {} } }))
  t.not(isTransformerPM({ info: { pos: [] } }))
})

test('isTransformerPM regex pattern is correct', (t) => {
  // Test that the regex pattern matches expected format: tr followed by one or more digits
  const validPatterns = [
    'tr1', 'tr10', 'tr123', 'tr0', 'tr999', 'tr999999'
  ]

  const invalidPatterns = [
    'tr', 'tr1a', '1tr', 'tr-1', 'tr_1', 'TR1', 'Tr1', 'site', 'rack1'
  ]

  validPatterns.forEach(pattern => {
    t.ok(isTransformerPM({ info: { pos: pattern } }), `Should match: ${pattern}`)
  })

  invalidPatterns.forEach(pattern => {
    t.not(isTransformerPM({ info: { pos: pattern } }), `Should not match: ${pattern}`)
  })
})
