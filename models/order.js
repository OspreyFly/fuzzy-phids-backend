"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

class Order {
    /** Create a order (from data), update db, return new order data.
   *
   * data should be { phone, delivery_address, submit_time, items, total, user_order_id }
   *
   * Returns { id, phone, delivery_address, submit_time, items, total, user_order_id }
   *
   * Throws BadRequestError if order already in database.
   * */
  static async create({ phone, delivery_address, submit_time, items, total, user_order_id }) {
    const duplicateCheck = await db.query(
          `SELECT user_order_id, submit_time
           FROM orders
           WHERE user_order_id = $1, submit_time = $2`,
        [user_order_id, submit_time]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate order: ${user_order_id + "@" + submit_time}`);

    const result = await db.query(
          `INSERT INTO orders
           (phone, delivery_address, submit_time, items, total, user_order_id)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, phone, delivery_address, submit_time, items, total, user_order_id`,
        [
            phone, delivery_address, submit_time, items, total, user_order_id
        ],
    );
    const order = result.rows[0];

    return order;
  }

  /** Find all orders (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * 
   * - minTotal (minimum total cost for the order)
   * - maxTotal (maximum total cost for the order)
   * - user_order_id (will find case-insensitive, partial matches)
   *
   * Returns [{ id, phone, delivery_address, submit_time, items, total, user_order_id }, ...]
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT id,
                        phone,
                        delivery_address,
                        submit_time,
                        items,
                        total,
                        user_order_id
                 FROM orders`;
    let whereExpressions = [];
    let queryValues = [];

    const { minTotal, maxTotal, user_order_id } = searchFilters;

    if (minPrice > maxPrice) {
      throw new BadRequestError("Min total cannot be greater than max");
    }

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (minTotal !== undefined) {
      queryValues.push(minTotal);
      whereExpressions.push(`total >= $${queryValues.length}`);
    }

    if (maxTotal !== undefined) {
      queryValues.push(maxTotal);
      whereExpressions.push(`total <= $${queryValues.length}`);
    }

    if (user_order_id) {
      queryValues.push(`%${user_order_id}%`);
      whereExpressions.push(`user_order_id = $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    // Finalize query and return results

    query += " ORDER BY submit_time";
    const ordersRes = await db.query(query, queryValues);
    return ordersRes.rows;
  }

  /** Given a order id, return data about order.
   *
   * Returns { id, phone, delivery_address, submit_time, items, total, user_order_id }
   *   where items is [{ id, species, price, url_image }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const orderRes = await db.query(
          `SELECT id, phone, delivery_address, submit_time, items, total, user_order_id
           FROM orders
           WHERE id = $1`,
        [id]);

    const order = orderRes.rows[0];

    if (!order) throw new NotFoundError(`No order: ${id}`);

    const itemsRes = await db.query(
          `SELECT id, species, price, url_image
           FROM insects
           WHERE id = $1
           ORDER BY species`,
        [id],
    );

    order.items = itemsRes.rows;

    return order;
  }

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM orders
           WHERE id = $1
           RETURNING id`,
        [id]);
    const order = result.rows[0];

    if (!order) throw new NotFoundError(`No order: ${id}`);
  }

  /** Calculate the total cost of an order after applying standard sales tax.
     *
     * @param {number} orderId - The ID of the order to calculate the total for.
     * @returns {Promise<number>} A promise that resolves to the total cost of the order.
     */
  static async getTotal(orderId) {
    const orderRes = await db.query(
        `SELECT items FROM orders WHERE id = $1`,
        [orderId]
    );

    const order = orderRes.rows[0];
    if (!order) throw new NotFoundError(`No order found with ID: ${orderId}`);

    const items = order.items;
    let totalCost = 0;

    // Assuming each item has a price and quantity property
    for (let item of items) {
        const itemTotal = item.price;  //* item.quantity;  Calculate subtotal for each item
        const taxRate = 0.10; // Standard sales tax rate (10%)
        const taxedAmount = itemTotal * (1 + taxRate); // Apply sales tax
        totalCost += taxedAmount; // Add to total cost
    }

    return Math.round(totalCost); // Round to nearest whole number and return
}
}

module.exports = Order;