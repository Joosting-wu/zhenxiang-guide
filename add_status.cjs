const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.sqlite');
db.run('ALTER TABLE merchants ADD COLUMN status TEXT DEFAULT "营业中"', (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Status column added successfully');
  }
});