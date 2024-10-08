"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username, email, is_admin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    try {
      // Query the database for the user
      const result = await db.query(
        `SELECT username,
                password,
                email,
                is_admin AS "isAdmin"
         FROM users
         WHERE username = $1`,
        [username]
      );
  
      // Check if the user was found
      if (result.rows.length === 0) {
        throw new UnauthorizedError('User not found');
      }
  
      // Destructure the user row
      const { password: storedPassword, isAdmin } = result.rows[0];
  
      // Compare the provided password with the stored hashed password
      const isMatch = await bcrypt.compare(password, storedPassword);
  
      if (!isMatch) {
        throw new UnauthorizedError('Wrong password');
      }
  
      // If everything checks out, return the user details
      return {
        username,
        email: result.rows[0].email,
        isAdmin,
      };
    } catch (error) {
      // Rethrow the error to be handled by the caller
      throw error;
    }
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
      { username, password, email, isAdmin }) {
    const duplicateCheck = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`,
        [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
          `INSERT INTO users
           (username,
            password,
            email,
            is_admin,
            orders)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING username, password, email, is_admin AS "isAdmin"`,
        [
          username,
          hashedPassword,
          email,
          isAdmin,
          []
        ],
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, password, email, is_admin, orders }, ...]
   **/

  static async findAll() {
    const result = await db.query(
          `SELECT username,
                  password,
                  email,
                  is_admin AS "isAdmin",
                  orders
           FROM users
           ORDER BY username`,
    );

    return result.rows;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, password, email, is_admin, orders }
   *   where orders is { id, phone, delivery_address, submit_time, items, user_order_id }
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
          `SELECT id,
                  username,
                  password,
                  email,
                  is_admin AS "isAdmin",
                  orders
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    const userOrdersRes = await db.query(
          `SELECT id, phone, delivery_address, submit_time, items, user_order_id
           FROM orders
           WHERE user_order_id = $1`, [user.id]);

    user.orders = userOrdersRes.rows;
    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { username, password, email }
   *
   * Returns { username, password, email }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          username: "username",
          password: "password",
          isAdmin: "isAdmin",
        });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                "password",
                                email,
                                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
          `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
        [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }
}


module.exports = User;