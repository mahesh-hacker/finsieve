import { query } from "../config/database.js";

/**
 * Get all global indices
 */
export const getGlobalIndices = async (filters = {}) => {
  try {
    const { country, search, limit = 50, offset = 0 } = filters;

    // DISTINCT ON (LOWER(name)) deduplicates rows with the same index name
    // (e.g. NIFTY / NIFTY50 both named "NIFTY 50"), keeping the most-recently updated one.
    let conditions = [`1=1`];
    const params = [];
    let paramCount = 1;

    if (country) {
      conditions.push(`LOWER(country) = LOWER($${paramCount})`);
      params.push(country);
      paramCount++;
    }

    if (search) {
      conditions.push(`(LOWER(name) LIKE LOWER($${paramCount}) OR LOWER(symbol) LIKE LOWER($${paramCount}))`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.join(" AND ");

    let queryText = `
      SELECT DISTINCT ON (LOWER(name))
        id, symbol, name, country,
        current_value, change, change_percent,
        previous_close, open, high, low, last_updated
      FROM global_indices
      WHERE ${whereClause}
      ORDER BY LOWER(name), last_updated DESC
    `;

    // Wrap in subquery so we can apply country/symbol ordering and pagination
    queryText = `
      SELECT * FROM (${queryText}) AS deduped
      ORDER BY country, symbol
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM global_indices WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (country) {
      countQuery += ` AND LOWER(country) = LOWER($${countParamIndex})`;
      countParams.push(country);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (LOWER(name) LIKE LOWER($${countParamIndex}) OR LOWER(symbol) LIKE LOWER($${countParamIndex}))`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return {
      data: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + result.rows.length < total,
      },
    };
  } catch (error) {
    console.error("Get global indices error:", error);
    throw error;
  }
};

/**
 * Get index by symbol
 */
export const getIndexBySymbol = async (symbol) => {
  try {
    const result = await query(
      `SELECT 
        id,
        symbol,
        name,
        country,
        current_value,
        change,
        change_percent,
        previous_close,
        open,
        high,
        low,
        last_updated
      FROM global_indices
      WHERE LOWER(symbol) = LOWER($1)`,
      [symbol],
    );

    if (result.rows.length === 0) {
      throw new Error("Index not found");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Get index by symbol error:", error);
    throw error;
  }
};

/**
 * Get indices by country
 */
export const getIndicesByCountry = async (country) => {
  try {
    const result = await query(
      `SELECT * FROM (
        SELECT DISTINCT ON (LOWER(name))
          id, symbol, name, country,
          current_value, change, change_percent,
          previous_close, open, high, low, last_updated
        FROM global_indices
        WHERE LOWER(country) = LOWER($1)
        ORDER BY LOWER(name), last_updated DESC
      ) AS deduped
      ORDER BY symbol`,
      [country],
    );

    return result.rows;
  } catch (error) {
    console.error("Get indices by country error:", error);
    throw error;
  }
};

/**
 * Get major indices (featured/popular ones)
 * Indian: NIFTY 50, SENSEX (BSE), BANKNIFTY — rest from global seed/schedulers
 */
export const getMajorIndices = async () => {
  try {
    const majorSymbols = [
      "NIFTY",
      "SENSEX",
      "BANKNIFTY",
      "DJI",
      "SPX",
      "IXIC",
      "FTSE",
      "N225",
      "HSI",
    ];

    const result = await query(
      `SELECT 
        id,
        symbol,
        name,
        country,
        current_value,
        change,
        change_percent,
        previous_close,
        open,
        high,
        low,
        last_updated
      FROM global_indices
      WHERE symbol = ANY($1)
      ORDER BY CASE symbol
        WHEN 'NIFTY' THEN 1 WHEN 'SENSEX' THEN 2 WHEN 'BANKNIFTY' THEN 3
        WHEN 'DJI' THEN 4 WHEN 'SPX' THEN 5 WHEN 'IXIC' THEN 6
        WHEN 'FTSE' THEN 7 WHEN 'N225' THEN 8 WHEN 'HSI' THEN 9
        ELSE 10 END`,
      [majorSymbols],
    );

    return result.rows;
  } catch (error) {
    console.error("Get major indices error:", error);
    throw error;
  }
};

export default {
  getGlobalIndices,
  getIndexBySymbol,
  getIndicesByCountry,
  getMajorIndices,
};
