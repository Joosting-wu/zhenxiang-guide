import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Use /tmp for Vercel serverless environment, otherwise use local directory
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const dbPath = isVercel ? '/tmp/database.sqlite' : path.resolve(__dirname, '../../database.sqlite');

let dbPromise: Promise<Database>;

async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: dbPath,
      driver: sqlite3.Database
    }).then(async (db) => {
      // Initialize tables if they don't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT DEFAULT 'user', -- 'user' or 'merchant'
          phone TEXT,
          avatar_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          icon TEXT,
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS merchants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          address TEXT NOT NULL,
          city TEXT DEFAULT '广州市',
          phone TEXT,
          category_id INTEGER NOT NULL,
          owner_id INTEGER, -- User ID of the merchant
          avg_rating REAL DEFAULT 0.00,
          review_count INTEGER DEFAULT 0,
          business_hours TEXT,
          status TEXT DEFAULT '营业', -- '营业', '休息', '闭店'
          images TEXT, -- JSON array of up to 4 image URLs
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id),
          FOREIGN KEY (owner_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          merchant_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, merchant_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          merchant_id INTEGER NOT NULL,
          rating INTEGER CHECK (rating >= 1 AND rating <= 5),
          content TEXT NOT NULL,
          images TEXT,
          reply_content TEXT, -- Merchant reply
          replied_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
        );
      `);

      // Insert initial categories if empty
      const catCount = await db.get('SELECT COUNT(*) as count FROM categories');
      if (catCount.count === 0) {
        await db.exec(`
          INSERT INTO categories (name, icon, sort_order) VALUES
          ('吃得香', '🍽️', 1),
          ('玩得嗨', '🎬', 2),
          ('美得很', '🛍️', 3),
          ('住得爽', '🏨', 4);
        `);
      } else {
        // Update existing categories
        await db.exec(`
          UPDATE categories SET name = '吃得香' WHERE id = 1;
          UPDATE categories SET name = '玩得嗨' WHERE id = 2;
          UPDATE categories SET name = '美得很' WHERE id = 3;
          UPDATE categories SET name = '住得爽' WHERE id = 4;
        `);
      }

      // Seed a default user and merchant for testing if empty
      const userCount = await db.get('SELECT COUNT(*) as count FROM users');
      let userId1 = 1, userId2 = 2;
      
      if (userCount.count === 0) {
        // 'password123' hashed with bcryptjs
        const defaultPasswordHash = '$2a$10$vXc5W9oNRG.T6wnq/qtz9e7Tz/JEFZ9vXG9O08CwKyHjN7/7/kAcC';
        
        await db.exec(`
          INSERT INTO users (email, password_hash, name, role, avatar_url) VALUES
          ('user@example.com', '${defaultPasswordHash}', '普通用户', 'user', 'https://api.dicebear.com/7.x/notionists/svg?seed=user1&backgroundColor=ffd5dc'),
          ('merchant@example.com', '${defaultPasswordHash}', '商家老板', 'merchant', 'https://api.dicebear.com/7.x/notionists/svg?seed=merchant1&backgroundColor=ffdfbf');
        `);
      }

      // We need valid user IDs for reviews. Get the first two users.
      const users = await db.all('SELECT id FROM users LIMIT 2');
      if (users.length >= 2) {
        userId1 = users[0].id;
        userId2 = users[1].id;
      }

      // Seed categories
      const categoryCount = await db.get('SELECT COUNT(*) as count FROM categories');
      if (categoryCount.count === 0) {
        await db.exec(`
          INSERT INTO categories (name, icon, sort_order) VALUES
          ('吃得香', '🍜', 1),
          ('玩得嗨', '🎡', 2),
          ('美得很', '💇‍♀️', 3),
          ('住得爽', '🏨', 4);
        `);
      }

      // Seed 8 real merchants per category for Guangzhou
      const merchantCount = await db.get('SELECT COUNT(*) as count FROM merchants');
      if (merchantCount.count === 0) {
        const categories = await db.all('SELECT id, name FROM categories');
        const merchantOwnerId = users.length > 0 ? users[users.length - 1].id : 2; // Default to merchant user
        
        // Define real data mapping
        const realDataMap: Record<string, any[]> = {
          '吃得香': [
            { name: '广州酒家(文昌总店)', address: '荔湾区文昌南路2号', phone: '020-81380388', hours: '08:00-21:00', price: 120, img: 'traditional+cantonese+restaurant+exterior' },
            { name: '陶陶居(正佳广场店)', address: '天河区天河路228号正佳广场6楼', phone: '020-38331888', hours: '10:00-22:00', price: 150, img: 'dim+sum+restaurant' },
            { name: '炳胜品味(珠江新城店)', address: '天河区珠江新城冼村路2号', phone: '020-38035888', hours: '11:00-15:00, 17:00-22:00', price: 180, img: 'high+end+cantonese+food' },
            { name: '点都德(北京路店)', address: '越秀区惠福东路470号', phone: '020-83332888', hours: '08:00-22:00', price: 90, img: 'cantonese+tea+house' },
            { name: '白天鹅宾馆·玉堂春暖', address: '荔湾区沙面南街1号白天鹅宾馆3楼', phone: '020-81886968', hours: '11:30-15:00, 17:30-22:00', price: 400, img: 'luxury+chinese+restaurant' },
            { name: '惠食佳(滨江店)', address: '海珠区滨江西路172号', phone: '020-34381188', hours: '11:00-15:00, 17:00-22:00', price: 160, img: 'seafood+restaurant+guangzhou' },
            { name: '向群饭店(龙津东路店)', address: '荔湾区龙津东路853-857号', phone: '020-81887136', hours: '11:00-14:30, 17:00-21:30', price: 100, img: 'local+eatery+guangzhou' },
            { name: '陈添记(江南西店)', address: '海珠区江南大道中富力海珠城A区', phone: '020-84488888', hours: '11:00-22:00', price: 130, img: 'claypot+rice+restaurant' }
          ],
          '玩得嗨': [
            { name: '正佳极地海洋世界', address: '天河区天河路228号正佳广场西侧2-3层', phone: '020-38332222', hours: '10:00-22:00', price: 220, img: 'indoor+aquarium' },
            { name: '广州塔(小蛮腰)', address: '海珠区阅江西路222号', phone: '020-89338222', hours: '09:30-22:30', price: 150, img: 'canton+tower+night' },
            { name: '长隆欢乐世界', address: '番禺区汉溪大道东299号', phone: '400-883-0088', hours: '09:30-18:00', price: 250, img: 'amusement+park+rollercoaster' },
            { name: '珠江夜游(大沙头码头)', address: '越秀区沿江东路466号大沙头游船码头', phone: '020-83332222', hours: '18:30-22:30', price: 120, img: 'pearl+river+cruise+night' },
            { name: '融创雪世界', address: '花都区凤凰北路78号融创文旅城', phone: '400-633-2888', hours: '10:00-21:00', price: 280, img: 'indoor+ski+resort' },
            { name: '太古汇飞扬影城', address: '天河区天河路383号太古汇商场L3层', phone: '020-38682888', hours: '10:00-02:00', price: 80, img: 'modern+cinema+entrance' },
            { name: 'KPARTY KTV(北京路店)', address: '越秀区北京路168号', phone: '020-83333333', hours: '12:00-06:00', price: 100, img: 'luxury+ktv+room' },
            { name: '天河体育中心', address: '天河区天河路299号', phone: '020-38792222', hours: '06:00-22:00', price: 50, img: 'stadium+running+track' }
          ],
          '美得很': [
            { name: '八佰伴Hair Salon(天环广场店)', address: '天河区天河路218号天环广场L2', phone: '020-38888888', hours: '10:00-22:00', price: 300, img: 'high+end+hair+salon' },
            { name: '苏豪路易士·嘉玛发廊(太古汇店)', address: '天河区天河路383号太古汇MU层', phone: '020-38682222', hours: '10:00-22:00', price: 500, img: 'luxury+barbershop' },
            { name: '美丽田园(珠江新城高德店)', address: '天河区花城大道85号高德置地春广场', phone: '020-38832222', hours: '10:00-22:00', price: 800, img: 'spa+and+massage+room' },
            { name: 'Kraemer Paris 1895(igc店)', address: '天河区兴民路222号天汇广场igc L3', phone: '020-38833333', hours: '10:00-22:00', price: 400, img: 'french+style+hair+salon' },
            { name: '思妍丽(丽柏广场店)', address: '越秀区环市东路367号丽柏广场', phone: '020-83311111', hours: '10:00-22:00', price: 600, img: 'beauty+spa+clinic' },
            { name: '曼都发型(保利时光里店)', address: '海珠区建设大马路18号', phone: '020-83322222', hours: '10:00-22:00', price: 200, img: 'modern+hair+salon+interior' },
            { name: '奈瑞儿(白云万达店)', address: '白云区云城东路501号万达广场', phone: '020-36666666', hours: '10:00-22:00', price: 500, img: 'facial+treatment+room' },
            { name: 'InStyle造型(江南西店)', address: '海珠区江南西路紫龙大街1号', phone: '020-84444444', hours: '10:00-22:00', price: 150, img: 'trendy+hair+salon' }
          ],
          '住得爽': [
            { name: '广州四季酒店', address: '天河区珠江新城珠江西路5号', phone: '020-88833888', hours: '24小时营业', price: 2000, img: 'luxury+hotel+exterior+night' },
            { name: '广州W酒店', address: '天河区珠江新城珠江东路26号', phone: '020-66286628', hours: '24小时营业', price: 2200, img: 'w+hotel+guangzhou' },
            { name: '白天鹅宾馆', address: '荔湾区沙面南街1号', phone: '020-81886968', hours: '24小时营业', price: 1500, img: 'historic+luxury+hotel' },
            { name: '广州柏悦酒店', address: '天河区珠江新城华夏路16号', phone: '020-37691234', hours: '24小时营业', price: 1800, img: 'park+hyatt+hotel' },
            { name: '广州瑰丽酒店', address: '天河区珠江新城华夏路16号', phone: '020-37691234', hours: '24小时营业', price: 2500, img: 'park+hyatt+hotel' },
            { name: '广州香格里拉大酒店', address: '海珠区会展东路1号', phone: '020-89178888', hours: '24小时营业', price: 1200, img: 'shangri-la+hotel+guangzhou' },
            { name: '广州康莱德酒店', address: '天河区珠江新城兴民路222号', phone: '020-37392222', hours: '24小时营业', price: 1600, img: 'conrad+hotel+guangzhou' },
            { name: '广州南丰朗豪酒店', address: '海珠区新港东路638号', phone: '020-89163388', hours: '24小时营业', price: 1100, img: 'langham+hotel+guangzhou' }
          ]
        };

        for (const category of categories) {
          const shopList = realDataMap[category.name] || [];
          
          for (let i = 0; i < shopList.length; i++) {
            const shop = shopList[i];
            const mImages = JSON.stringify([
              `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(shop.img)}&image_size=landscape_16_9`
            ]);
            
            // Insert merchant
            const result = await db.run(`
              INSERT INTO merchants (name, description, address, city, phone, category_id, business_hours, images, owner_id, avg_rating, review_count) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              shop.name, 
              `位于${shop.address}的优质${category.name}商户，人均消费约${shop.price}元。`, 
              shop.address, 
              '广州市', 
              shop.phone, 
              category.id, 
              shop.hours, 
              mImages, 
              merchantOwnerId, 
              4.5, 
              2
            ]);
            
            const merchantId = result.lastID;
            
            // Insert 2 reviews for each merchant
            await db.run(`
              INSERT INTO reviews (merchant_id, user_id, rating, content)
              VALUES (?, ?, ?, ?)
            `, [merchantId, userId1, 5.0, `非常不错的一家店，服务很好，推荐大家来体验！`]);
            
            await db.run(`
              INSERT INTO reviews (merchant_id, user_id, rating, content)
              VALUES (?, ?, ?, ?)
            `, [merchantId, userId2, 4.0, `整体还可以，性价比不错，周末人有点多。`]);
          }
        }
        
        console.log('[DB] Seeded 8 REAL merchants per category for Guangzhou with 2 reviews each.');
      }

      return db;
    });
  }
  return dbPromise;
}

// Emulate mysql2 pool interface
const pool = {
  execute: async (query: string, params: any[] = []): Promise<[any, any]> => {
    const db = await getDb();
    
    // Convert MySQL placeholder '?' to SQLite '?'
    // Actually sqlite supports '?' directly
    
    const isSelect = query.trim().toUpperCase().startsWith('SELECT');
    
    try {
      if (isSelect) {
        const rows = await db.all(query, params);
        return [rows, []];
      } else {
        const result = await db.run(query, params);
        // Map sqlite result to mysql result
        return [{
          insertId: result.lastID,
          affectedRows: result.changes
        }, []];
      }
    } catch (error) {
      console.error('DB Error:', error);
      throw error;
    }
  }
};

export default pool;