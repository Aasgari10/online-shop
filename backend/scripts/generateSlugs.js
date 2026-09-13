const logger = require("../utils/logger");
// backend/scripts/generateSlugs.js
require('dotenv').config();

const pool = require('../config/db');
const slugify = require('slugify-persian'); // یا slugify

const generateUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;
  let exists = true;

  while (exists) {
    const [rows] = await pool.query(
      'SELECT id FROM products WHERE slug = ? AND id != ? AND deleted_at IS NULL',
      [slug, excludeId || 0]
    );
    if (rows.length === 0) {
      exists = false;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  return slug;
};

const regenerateSlugs = async () => {
  try {
    logger.info('🔄 شروع بازتولید slug برای همه محصولات...');
    const [products] = await pool.query('SELECT id, name FROM products WHERE deleted_at IS NULL');
    logger.info(`🔍 ${products.length} محصول یافت شد.`);

    for (const product of products) {
      const baseSlug = slugify(product.name);
      const uniqueSlug = await generateUniqueSlug(baseSlug, product.id);
      await pool.query('UPDATE products SET slug = ? WHERE id = ?', [uniqueSlug, product.id]);
      logger.info(`✅ محصول ${product.id} (${product.name}) -> ${uniqueSlug}`);
    }
    logger.info('✅ همه slugها بازتولید شدند.');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
};

regenerateSlugs();