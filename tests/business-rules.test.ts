import { describe, it } from "node:test"
import assert from "node:assert/strict"

// Replicate the discount cap logic from POS
function clampDiscount(subtotal: number, itemDiscount: number, globalDiscount: number) {
  return Math.max(0, subtotal - itemDiscount - globalDiscount)
}

function exclusiveCalc(subtotal: number, itemDiscount: number, globalDiscount: number, servicePct: number, taxPct: number) {
  const base = clampDiscount(subtotal, itemDiscount, globalDiscount)
  const service = (base * servicePct) / 100
  const tax = (base + service) * (taxPct / 100)
  return { base, service, tax, total: base + service + tax }
}

function inclusiveCalc(subtotal: number, itemDiscount: number, globalDiscount: number, servicePct: number, taxPct: number) {
  const base = clampDiscount(subtotal, itemDiscount, globalDiscount)
  const service = (base * servicePct) / 100
  const tax = base - base / (1 + taxPct / 100)
  return { base, service, tax, total: base + service }
}

describe("Order totals (exclusive tax)", () => {
  it("Rp 100,000 base no discount", () => {
    const r = exclusiveCalc(100000, 0, 0, 5, 11)
    assert.equal(r.base, 100000)
    assert.equal(r.service, 5000)
    assert.equal(r.tax, 11550)
    assert.equal(r.total, 116550)
  })
  it("Tax base respects global discount", () => {
    const r = exclusiveCalc(100000, 0, 10000, 5, 11)
    assert.equal(r.base, 90000)
  })
  it("Cannot go negative", () => {
    const r = exclusiveCalc(50000, 30000, 30000, 5, 11)
    assert.equal(r.base, 0)
    assert.equal(r.total, 0)
  })
})

describe("Order totals (inclusive tax)", () => {
  it("Total equals base + service when tax is inclusive", () => {
    const r = inclusiveCalc(100000, 0, 0, 5, 11)
    assert.equal(r.base, 100000)
    assert.equal(r.service, 5000)
    assert.equal(r.total, 105000)
    assert.ok(r.tax < 10000) // tax portion is extracted
  })
})

describe("Shift variance", () => {
  function computeVariance(opening: number, sales: number, refunds: number, actual: number) {
    const expected = opening + sales - refunds
    return { expected, difference: actual - expected }
  }
  it("Match", () => {
    const r = computeVariance(200000, 750000, 50000, 900000)
    assert.equal(r.difference, 0)
  })
  it("Short", () => {
    const r = computeVariance(200000, 750000, 50000, 850000)
    assert.equal(r.difference, -50000)
  })
  it("Over", () => {
    const r = computeVariance(200000, 750000, 50000, 950000)
    assert.equal(r.difference, 50000)
  })
})

describe("Refund business rules", () => {
  function validateRefund(paid: number, requested: number, status: string) {
    if (status === "REFUNDED") return { ok: false, reason: "ALREADY_REFUNDED" }
    if (paid <= 0) return { ok: false, reason: "UNPAID" }
    if (requested <= 0) return { ok: false, reason: "INVALID_AMOUNT" }
    if (requested > paid) return { ok: false, reason: "EXCEEDS_PAID" }
    return { ok: true }
  }
  it("valid full refund", () => {
    const r = validateRefund(100000, 100000, "COMPLETED")
    assert.equal(r.ok, true)
  })
  it("rejects negative", () => {
    const r = validateRefund(100000, -1000, "COMPLETED")
    assert.equal(r.ok, false)
  })
  it("rejects overpayment", () => {
    const r = validateRefund(100000, 150000, "COMPLETED")
    assert.equal(r.ok, false)
  })
  it("rejects already refunded", () => {
    const r = validateRefund(0, 0, "REFUNDED")
    assert.equal(r.ok, false)
  })
  it("rejects unpaid order", () => {
    const r = validateRefund(0, 1000, "NEW")
    assert.equal(r.ok, false)
  })
})