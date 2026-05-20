const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'prototype_teh'
  });

  const [rows] = await connection.query("DESCRIBE orders");
  console.table(rows);
  
  await connection.end();
}
run();
