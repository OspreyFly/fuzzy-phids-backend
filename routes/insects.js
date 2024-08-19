"use strict";

/** Routes for insects. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Insect = require("../models/insect");

const insectNewSchema = require("../schemas/insectNew.json");
const insectUpdateSchema = require("../schemas/insectUpdate.json");
const insectSearchSchema = require("../schemas/insectSearch.json");

const router = new express.Router();


/** POST / { insect } =>  { insect }
 *
 * insect should be { species, price, logoUrl }
 *
 * Returns { id, species, price, logoUrl }
 *
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, insectNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const insect = await Insect.create(req.body);
    return res.status(201).json({ insect });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { insects: [ { id, species, price, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minPrice
 * - maxPrice
 * - speciesLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  const q = req.query;
  // arrive as strings from querystring, but we want as ints
  if (q.minPrice !== undefined) q.minPrice = +q.minPrice;
  if (q.maxPrice !== undefined) q.maxPrice = +q.maxPrice;

  try {
    const validator = jsonschema.validate(q, insectSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const insects = await Insect.findAll(q);
    return res.json({ insects });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  =>  { insect }
 *
 *  insect is { id, species, price, logoUrl }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    console.log("ID: ", req.params.id);
    const insect = await Insect.get(req.params.id);
    return res.json({ insect });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { insect }
 *
 * Patches insect data.
 *
 * fields can be: { price, url_image }
 *
 * Returns { id, species, price, url_image }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, insectUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const insect = await Insect.update(req.params.id, req.body);
    return res.json({ insect });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    await Insect.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;