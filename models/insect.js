"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Insect {
     /** Create a insect (from data), update db, return new insect data.
   *
   * data should be { species, price, url_image }
   *
   * Returns { id, species, price, url_image }
   *
   * Throws BadRequestError if insect already in database.
   * */
  static async create({ species, price, url_image }) {
    const duplicateCheck = await db.query(
          `SELECT species
           FROM insects
           WHERE species = $1`,
        [species]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate insect: ${species}`);

    const result = await db.query(
          `INSERT INTO insects
           (species, price, url_image)
           VALUES ($1, $2, $3)
           RETURNING id, species, price, url_image`,
        [
            species, price, url_image
        ],
    );
    const insect = result.rows[0];

    return insect;
  }

  /** Find all companies (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - minPrice
   * - maxPrice
   * - species (will find case-insensitive, partial matches)
   *
   * Returns [{ id, species, price, url_image }, ...]
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT id,
                        species,
                        price,
                        url_image
                 FROM insects`;
    let whereExpressions = [];
    let queryValues = [];

    const { minPrice, maxPrice, species } = searchFilters;

    if (minPrice > maxPrice) {
      throw new BadRequestError("Min price cannot be greater than max");
    }

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (minPrice !== undefined) {
      queryValues.push(minPrice);
      whereExpressions.push(`price >= $${queryValues.length}`);
    }

    if (maxPrice !== undefined) {
      queryValues.push(maxPrice);
      whereExpressions.push(`price <= $${queryValues.length}`);
    }

    if (species) {
      queryValues.push(`%${species}%`);
      whereExpressions.push(`species ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    // Finalize query and return results

    query += " ORDER BY species";
    const insectsRes = await db.query(query, queryValues);
    return insectsRes.rows;
  }

  /** Given an insect id, return data about insect.
   *
   * Returns { id, salary, price, url_image }
   *   
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const insectRes = await db.query(
          `SELECT id,
                  species,
                  price,
                  url_image
           FROM insects
           WHERE id = $1`,
        [id]);

    const insect = insectRes.rows[0];

    if (!insect) throw new NotFoundError(`No insect: ${id}`);

    return insect;
  }

  /** Update insect data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {species, price, url_image}
   *
   * Returns {id, species, price, url_image}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
            price: "price",
            url_image: "url_image",
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE insects 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                species, 
                                price, 
                                url_image
                                `;
    const result = await db.query(querySql, [...values, id]);
    const insect = result.rows[0];

    if (!insect) throw new NotFoundError(`No insect: ${id}`);

    return insect;
  }

  /** Delete given insect from database; returns undefined.
   *
   * Throws NotFoundError if insect not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM insects
           WHERE id = $1
           RETURNING id`,
        [id]);
    const insect = result.rows[0];

    if (!insect) throw new NotFoundError(`No insect: ${id}`);
  }
}

module.exports = Insect;