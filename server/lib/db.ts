import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
if (!isVercel) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const { Pool } = pg;

// Parse PostgreSQL INT8 (which is returned by COUNT()) as Number
pg.types.setTypeParser(20, (val) => {
  return parseInt(val, 10);
});

// Initialize PostgreSQL pool
const rawDatabaseUrl = process.env.DATABASE_URL?.trim();
const databaseUrl = rawDatabaseUrl
  ? rawDatabaseUrl.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim()
  : undefined;

let pgPool: pg.Pool | undefined;
let initError: Error | undefined;

if (!databaseUrl) {
  initError = new Error('DATABASE_URL is not set');
  console.error('[DB] DATABASE_URL is not set');
} else {
  pgPool = new Pool({
    connectionString: databaseUrl,
    ssl: isVercel ? { rejectUnauthorized: false } : undefined,
    max: isVercel ? 5 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pgPool.on('error', (err) => {
    console.error('[DB] Pool error', err);
  });
}

// Test connection and seed data
if (pgPool) {
  pgPool.connect()
    .then(async client => {
      console.log('[DB] Successfully connected to PostgreSQL (Supabase)');
      
      try {
        // Seed a default user and merchant for testing if empty
        const userCountRes = await client.query('SELECT COUNT(*) as count FROM users');
        const userCount = parseInt(userCountRes.rows[0].count, 10);
        
        let userId1 = 1, userId2 = 2;
        
        if (userCount === 0) {
          const defaultPasswordHash = '$2a$10$vXc5W9oNRG.T6wnq/qtz9e7Tz/JEFZ9vXG9O08CwKyHjN7/7/kAcC';
          
          await client.query(`
            INSERT INTO users (email, password_hash, name, role, avatar_url) VALUES
            ('user@example.com', '${defaultPasswordHash}', '普通用户', 'user', 'https://api.dicebear.com/7.x/notionists/svg?seed=user1&backgroundColor=ffd5dc'),
            ('merchant@example.com', '${defaultPasswordHash}', '商家老板', 'merchant', 'https://api.dicebear.com/7.x/notionists/svg?seed=merchant1&backgroundColor=ffdfbf'),
            ('admin@example.com', '${defaultPasswordHash}', '管理员', 'admin', 'https://api.dicebear.com/7.x/notionists/svg?seed=admin&backgroundColor=b6e3f4')
          `);
        }

        // Seed categories
        const categoryCountRes = await client.query('SELECT COUNT(*) as count FROM categories');
        const categoryCount = parseInt(categoryCountRes.rows[0].count, 10);
        if (categoryCount === 0) {
          await client.query(`
            INSERT INTO categories (name, icon, sort_order) VALUES
            ('吃得香', '🍜', 1),
            ('玩得嗨', '🎡', 2),
            ('美得很', '💇‍♀️', 3),
            ('住得爽', '🏨', 4)
          `);
        }

        // Seed merchants
        const merchantCountRes = await client.query('SELECT COUNT(*) as count FROM merchants');
        const merchantCount = parseInt(merchantCountRes.rows[0].count, 10);
        
        if (merchantCount === 0) {
          const usersRes = await client.query('SELECT id FROM users LIMIT 2');
          if (usersRes.rows.length >= 2) {
            userId1 = usersRes.rows[0].id;
            userId2 = usersRes.rows[1].id;
          }
          const categoriesRes = await client.query('SELECT id, name FROM categories');
          const categories = categoriesRes.rows;
          const merchantOwnerId = userId2;
          
          const realDataMap: Record<string, any[]> = {
          '吃得香': [
            { name: '广州酒家(文昌总店)', address: '荔湾区文昌南路2号', phone: '020-81380388', hours: '08:00-21:00', price: 120, img: 'traditional+cantonese+restaurant+exterior' },
            { name: '陶陶居(正佳广场店)', address: '天河区天河路228号正佳广场6楼', phone: '020-38331888', hours: '10:00-22:00', price: 150, img: 'dim+sum+restaurant' },
            { name: '炳胜品味(珠江新城店)', address: '天河区珠江新城冼村路2号', phone: '020-38035888', hours: '11:00-15:00, 17:00-22:00', price: 180, img: 'high+end+cantonese+food' },
            { name: '点都德(北京路店)', address: '越秀区惠福东路470号', phone: '020-83332888', hours: '08:00-22:00', price: 90, img: 'cantonese+tea+house' }
          ],
          '玩得嗨': [
            { name: '正佳极地海洋世界', address: '天河区天河路228号正佳广场西侧2-3层', phone: '020-38332222', hours: '10:00-22:00', price: 220, img: 'indoor+aquarium' },
            { name: '广州塔(小蛮腰)', address: '海珠区阅江西路222号', phone: '020-89338222', hours: '09:30-22:30', price: 150, img: 'canton+tower+night' },
            { name: '长隆欢乐世界', address: '番禺区汉溪大道东299号', phone: '400-883-0088', hours: '09:30-18:00', price: 250, img: 'amusement+park+rollercoaster' },
            { name: '珠江夜游(大沙头码头)', address: '越秀区沿江东路466号大沙头游船码头', phone: '020-83332222', hours: '18:30-22:30', price: 120, img: 'pearl+river+cruise+night' }
          ],
          '美得很': [
            { name: '八佰伴Hair Salon(天环广场店)', address: '天河区天河路218号天环广场L2', phone: '020-38888888', hours: '10:00-22:00', price: 300, img: 'high+end+hair+salon' },
            { name: '苏豪路易士·嘉玛发廊(太古汇店)', address: '天河区天河路383号太古汇MU层', phone: '020-38682222', hours: '10:00-22:00', price: 500, img: 'luxury+barbershop' },
            { name: '美丽田园(珠江新城高德店)', address: '天河区花城大道85号高德置地春广场', phone: '020-38832222', hours: '10:00-22:00', price: 800, img: 'spa+and+massage+room' },
            { name: 'Kraemer Paris 1895(igc店)', address: '天河区兴民路222号天汇广场igc L3', phone: '020-38833333', hours: '10:00-22:00', price: 400, img: 'french+style+hair+salon' }
          ],
          '住得爽': [
            { name: '广州四季酒店', address: '天河区珠江新城珠江西路5号', phone: '020-88833888', hours: '24小时营业', price: 2000, img: 'luxury+hotel+exterior+night' },
            { name: '广州W酒店', address: '天河区珠江新城珠江东路26号', phone: '020-66286628', hours: '24小时营业', price: 2200, img: 'w+hotel+guangzhou' },
            { name: '白天鹅宾馆', address: '荔湾区沙面南街1号', phone: '020-81886968', hours: '24小时营业', price: 1500, img: 'historic+luxury+hotel' },
            { name: '广州柏悦酒店', address: '天河区珠江新城华夏路16号', phone: '020-37691234', hours: '24小时营业', price: 1800, img: 'park+hyatt+hotel' }
          ]
        };

        for (const category of categories) {
          const shopList = realDataMap[category.name] || [];
          for (let i = 0; i < shopList.length; i++) {
            const shop = shopList[i];
            const mImages = JSON.stringify([
              `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(shop.img)}&image_size=landscape_16_9`
            ]);
            
            const insertRes = await client.query(`
              INSERT INTO merchants (name, description, address, city, phone, category_id, business_hours, images, owner_id, avg_rating, review_count) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
            `, [
              shop.name, `位于${shop.address}的优质${category.name}商户，人均消费约${shop.price}元。`, shop.address, '广州市', shop.phone, 
              category.id, shop.hours, mImages, merchantOwnerId, 4.5, 2
            ]);
            
            const merchantId = insertRes.rows[0].id;
            
            await client.query(`
              INSERT INTO reviews (merchant_id, user_id, rating, content) VALUES ($1, $2, $3, $4)
            `, [merchantId, userId1, 5.0, `非常不错的一家店，服务很好，推荐大家来体验！`]);
            
            await client.query(`
              INSERT INTO reviews (merchant_id, user_id, rating, content) VALUES ($1, $2, $3, $4)
            `, [merchantId, userId2, 4.0, `整体还可以，性价比不错，周末人有点多。`]);
          }
        }
          console.log('[DB] Seeded data for Postgres successfully.');
        }
      } catch (e) {
        console.error('[DB] Error seeding data:', e);
      } finally {
        client.release();
      }
    })
    .catch(err => {
      console.error('[DB] Failed to connect to PostgreSQL. Please ensure DATABASE_URL is set', err);
    });
}

const ensurePool = () => {
  if (!pgPool) {
    throw initError || new Error('Database is not initialized');
  }
  return pgPool;
}

// Export a mysql2/sqlite-compatible pool wrapper
export const pool = {
  execute: async (sql: string, params?: any[]) => {
    // Replace ? with $1, $2, etc. ONLY outside of string literals
    // Simple regex replace for basic queries
    let pgSql = sql;
      if (params && params.length > 0) {
        let i = 1;
        pgSql = sql.replace(/\?/g, () => `$${i++}`);
      }
      
      const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
      if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
        pgSql += ' RETURNING id';
      }
      
      try {
        const res = await ensurePool().query(pgSql, params);
        
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          return [res.rows, []]; // Return [rows, fields] format
        } else {
          // For INSERT/UPDATE/DELETE
          return [{ insertId: res.rows[0]?.id || 0, affectedRows: res.rowCount }, []];
        }
    } catch (error) {
      console.error('DB Query Error:', pgSql, params, error);
      throw error;
    }
  },
  
  // Add get and all methods directly on pool for easier use in some places
  get: async (sql: string, params?: any[]) => {
    let pgSql = sql;
    if (params && params.length > 0) {
      let i = 1;
      pgSql = sql.replace(/\?/g, () => `$${i++}`);
    }
    const res = await ensurePool().query(pgSql, params);
    return res.rows.length > 0 ? res.rows[0] : undefined;
  },
  
  all: async (sql: string, params?: any[]) => {
    let pgSql = sql;
    if (params && params.length > 0) {
      let i = 1;
      pgSql = sql.replace(/\?/g, () => `$${i++}`);
    }
    const res = await ensurePool().query(pgSql, params);
    return res.rows;
  }
};

export default pool;
