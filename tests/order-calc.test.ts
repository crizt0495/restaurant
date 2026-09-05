import { describe, it } from "node:test"
import assert from "node:assert/strict"

// Pure business logic replicated from the POS calculation flow.
// These must match the server-side atomic RPC expectations.
function applyDiscount(subtotal: number, itemDiscount: number, globalDiscount: number) {
  return Math.max(0, subtotal - itemDiscount - globalDiscount)
}

function applyServiceCharge(base: number, percent: number) {
  return (base * percent) / 100
}

function applyTax(base: number, percent: number) {
  return (base * percent) / 100
}

function computeOrder(
  subtotal: number,
  itemDiscount: number,
  globalDiscount: number,
  servicePercent: number,
  taxPercent: number
) {
  const afterDiscount = applyDiscount(subtotal, itemDiscount, globalDiscount)
  const service = applyServiceCharge(afterDiscount, servicePercent)
  const tax = applyTax(afterDiscount + service, taxPercent)
  const total = afterDiscount + service + tax
  return { subtotal, afterDiscount, service, tax, total }
}

describe("POS order calculation", () => {
  it("basic order no discount", () => {
    const r = computeOrder(100000, 0, 0, 5, 11)
    assert.equal(r.afterDiscount, 100000)
    assert.equal(r.service, 5000)
    assert.equal(r.tax, 11550)
    assert.equal(r.total, 116550)
  })

  it("global discount reduces tax base", () => {
    const r = computeOrder(100000, 0, 10000, 5, 11)
    assert.equal(r.afterDiscount, 90000)
    assert.equal(r.service, 4500)
    assert.equal(r.tax, 10395)
    assert.equal(r.total, 104895)
  })

  it("global discount cannot exceed subtotal", () => {
    const r = computeOrder(50000, 2000, 60000, 5, 11)
    // discount capped at net = 48000, so afterDiscount = 0
    assert.equal(applyDiscount(50000, 2000, 60000), 0)
    assert.equal(r.total, 0)
  })

  it("item discount reduces taxable amount", () => {
    const r = computeOrder(100000, 15000, 0, 5, 11)
    assert.equal(r.afterDiscount, 85000)
    assert.equal(r.service, 4250)
  })
})