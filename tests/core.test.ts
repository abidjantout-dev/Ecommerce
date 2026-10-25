import { test } from "node:test";
import assert from "node:assert/strict";
import { telephone, paliersValides } from "../src/lib/validation";
import { calcul, margeBrute } from "../src/lib/pricing";
import { versWhatsapp } from "../src/lib/format";
import type { Product } from "../src/lib/types";
const product = { tiers: [{qty: 1, price: 5000, free_delivery: false}, {qty: 2, price: 9000, free_delivery: true}], delivery_fee: 1000, cost_price: 465, delivery_cost: 1000 } as Product;
test("numéros ivoiriens : conserver le zéro national", () => {
  for (const n of ["07 00 00 00 00", "+2250700000000", "002250700000000"]) assert.equal(telephone(n), "2250700000000");
  assert.equal(versWhatsapp("0700000000"), "2250700000000");
  for (const n of ["12345678", "225700000000", "0700000000abc", ""]) assert.equal(telephone(n), null);
});
test("tarifs exacts, pas de pack sous-facturé", () => {
  assert.equal(calcul(product, 1).total, 6000);
  assert.equal(calcul(product, 2).total, 9000);
  for (const qty of [0, -1, 1.5, 3]) assert.throws(() => calcul(product, qty));
  assert.equal(margeBrute(product, {qty: 2, total: 9000}), 7070);
});
test("validation des paliers", () => {
  assert.ok(paliersValides(product.tiers));
  assert.equal(paliersValides([]), false);
  assert.equal(paliersValides([...product.tiers, product.tiers[0]]), false);
  assert.equal(paliersValides([{qty: 1, price: -1, free_delivery: false}]), false);
});
