/**
 * Watchlist Service
 * CRUD operations for user watchlists with real-time price updates
 */

import { query } from "../config/database.js";

class WatchlistService {
  /**
   * Get all watchlists for a user
   */
  async getUserWatchlists(userId) {
    const result = await query(
      `SELECT w.*, 
        (SELECT COUNT(*) FROM watchlist_items WHERE watchlist_id = w.id) as item_count
       FROM watchlists w 
       WHERE w.user_id = $1 
       ORDER BY w.is_default DESC, w.created_at ASC`,
      [userId],
    );
    return result.rows;
  }

  /**
   * Get a single watchlist with all items
   */
  async getWatchlistById(watchlistId, userId) {
    const watchlist = await query(
      `SELECT * FROM watchlists WHERE id = $1 AND user_id = $2`,
      [watchlistId, userId],
    );

    if (watchlist.rows.length === 0) {
      throw new Error("Watchlist not found");
    }

    const items = await query(
      `SELECT * FROM watchlist_items WHERE watchlist_id = $1 ORDER BY added_at DESC`,
      [watchlistId],
    );

    return {
      ...watchlist.rows[0],
      items: items.rows,
    };
  }

  /**
   * Create a new watchlist
   */
  async createWatchlist(userId, data) {
    const { name, description, color, icon } = data;

    // Check if user already has a default watchlist
    const existingDefault = await query(
      `SELECT id FROM watchlists WHERE user_id = $1 AND is_default = true`,
      [userId],
    );

    const isDefault = existingDefault.rows.length === 0;

    const result = await query(
      `INSERT INTO watchlists (user_id, name, description, color, icon, is_default) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        userId,
        name,
        description || null,
        color || "#2563eb",
        icon || "bookmark",
        isDefault,
      ],
    );

    return result.rows[0];
  }

  /**
   * Update a watchlist
   */
  async updateWatchlist(watchlistId, userId, data) {
    const { name, description, color, icon } = data;

    const result = await query(
      `UPDATE watchlists 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           icon = COALESCE($4, icon),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6 
       RETURNING *`,
      [name, description, color, icon, watchlistId, userId],
    );

    if (result.rows.length === 0) {
      throw new Error("Watchlist not found");
    }

    return result.rows[0];
  }

  /**
   * Delete a watchlist
   */
  async deleteWatchlist(watchlistId, userId) {
    const result = await query(
      `DELETE FROM watchlists WHERE id = $1 AND user_id = $2 RETURNING id`,
      [watchlistId, userId],
    );

    if (result.rows.length === 0) {
      throw new Error("Watchlist not found");
    }

    return { deleted: true };
  }

  /**
   * Add an instrument to a watchlist
   */
  async addItem(watchlistId, userId, data) {
    // Verify watchlist ownership
    const watchlist = await query(
      `SELECT id FROM watchlists WHERE id = $1 AND user_id = $2`,
      [watchlistId, userId],
    );

    if (watchlist.rows.length === 0) {
      throw new Error("Watchlist not found");
    }

    const {
      symbol,
      name,
      asset_class,
      exchange,
      notes,
      target_price,
      alert_above,
      alert_below,
    } = data;

    const result = await query(
      `INSERT INTO watchlist_items 
        (watchlist_id, symbol, name, asset_class, exchange, notes, target_price, alert_above, alert_below) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       ON CONFLICT (watchlist_id, symbol, asset_class) DO UPDATE SET
         notes = COALESCE(EXCLUDED.notes, watchlist_items.notes),
         target_price = COALESCE(EXCLUDED.target_price, watchlist_items.target_price),
         alert_above = COALESCE(EXCLUDED.alert_above, watchlist_items.alert_above),
         alert_below = COALESCE(EXCLUDED.alert_below, watchlist_items.alert_below)
       RETURNING *`,
      [
        watchlistId,
        symbol,
        name || symbol,
        asset_class,
        exchange || null,
        notes || null,
        target_price || null,
        alert_above || null,
        alert_below || null,
      ],
    );

    // Update watchlist updated_at
    await query(
      `UPDATE watchlists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [watchlistId],
    );

    return result.rows[0];
  }

  /**
   * Remove an instrument from a watchlist
   */
  async removeItem(watchlistId, itemId, userId) {
    // Verify watchlist ownership
    const watchlist = await query(
      `SELECT id FROM watchlists WHERE id = $1 AND user_id = $2`,
      [watchlistId, userId],
    );

    if (watchlist.rows.length === 0) {
      throw new Error("Watchlist not found");
    }

    const result = await query(
      `DELETE FROM watchlist_items WHERE id = $1 AND watchlist_id = $2 RETURNING id`,
      [itemId, watchlistId],
    );

    if (result.rows.length === 0) {
      throw new Error("Item not found in watchlist");
    }

    return { deleted: true };
  }

  /**
   * Get all items across all watchlists for a user (for quick lookup)
   */
  async getAllUserItems(userId) {
    const result = await query(
      `SELECT wi.*, w.name as watchlist_name, w.color as watchlist_color
       FROM watchlist_items wi 
       JOIN watchlists w ON w.id = wi.watchlist_id 
       WHERE w.user_id = $1 
       ORDER BY wi.added_at DESC`,
      [userId],
    );
    return result.rows;
  }

  /**
   * Check if an instrument is in any of user's watchlists
   */
  async isInWatchlist(userId, symbol, assetClass) {
    const result = await query(
      `SELECT wi.id, wi.watchlist_id, w.name as watchlist_name
       FROM watchlist_items wi 
       JOIN watchlists w ON w.id = wi.watchlist_id 
       WHERE w.user_id = $1 AND wi.symbol = $2 AND wi.asset_class = $3`,
      [userId, symbol, assetClass],
    );
    return {
      isInWatchlist: result.rows.length > 0,
      watchlists: result.rows,
    };
  }
}

export default new WatchlistService();
