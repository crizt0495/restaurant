import { test } from "node:test"
import assert from "node:assert/strict"
import { slugify, truncate, generateOrderNumber, generatePONumber } from "/home/chris/Documents/Aplikasi/restourant/src/lib/utils.ts"

test("slugify", () => {
  assert.equal(slugify("Nasi Goreng"), "nasi-goreng")
  assert.equal(slugify("Es Teh!!"), "es-teh")
})

test("truncate", () => {
  assert.equal(truncate("hello", 3), "hel...")
  assert.equal(truncate("hi", 5), "hi")
})

test("order number format", () => {
  const n = generateOrderNumber()
  assert.match(n, /^ORD-\d{8}-\d{4}$/)
})

test("po number format", () => {
  const n = generatePONumber()
  assert.match(n, /^PO-\d{8}-\d{4}$/)
})
