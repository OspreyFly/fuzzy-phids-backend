"use strict";

/** Routes for orders. */

const jsonschema = require("jsonschema");

const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Order = require("../models/order");
const orderNewSchema = require("../schemas/orderNew.json");
const ordersearchSchema = require("../schemas/orderSearch.json");

const router = express.Router({ mergeParams: true });


/** POST / { order } => { order }
 *
 * order should be { phone, delivery_address, submit_time, items, total, user_order_id }
 *
 * Returns { id, phone, delivery_address, submit_time, items, total, user_order_id  }
 *
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, orderNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const order = await Order.create(req.body);
    return res.status(201).json({ order });
  } catch (err) {
    return next(err);
  }
});

/** GET / =>
 *   { orders: [ { id, phone, delivery_address, submit_time, items, total, user_order_id }, ...] }
 *
 * Can provide search filter in query:
 * - minTotal (total greater than minimum)
 * - maxTotal (total less than maximum)
 * - user_order_id (will find match);

 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  const q = req.query;
  // arrive as strings from querystring, but we want as int/bool
  if (q.minTotal !== undefined) q.minTotal = +q.minTotal;
  if (q.maxTotal !== undefined) q.maxTotal = +q.maxTotal;

  try {
    const validator = jsonschema.validate(q, ordersearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const orders = await Order.findAll(q);
    return res.json({ orders });
  } catch (err) {
    return next(err);
  }
});

/** GET /[orderId] => { order }
 *
 * Returns { id, phone, delivery_address, submit_time, items, total, user_order_id }
 *   where items is [{ id, species, price, url_image }, ...]
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const order = await Order.get(req.params.id);
    return res.json({ order });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization required: admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    await Order.remove(req.params.id);
    return res.json({ deleted: +req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;