import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./database.sqlite');
db.run('INSERT INTO users (email, password_hash, name, role, avatar_url) VALUES (?, ?, ?, ?, ?)', 
  ['admin@example.com', '$2a$10$vXc5W9oNRG.T6wnq/qtz9e7Tz/JEFZ9vXG9O08CwKyHjN7/7/kAcC', '系统管理员', 'admin', 'https://api.dicebear.com/7.x/notionists/svg?seed=admin&backgroundColor=ffdfbf'],
  (err) => {
    if (err) console.error(err);
    else console.log('Admin user created');
  }
);