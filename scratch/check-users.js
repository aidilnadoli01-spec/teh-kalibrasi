const mysql = require('mysql2/promise');
const fs = require('fs');

function parseEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  });
  return env;
}

async function run() {
  const envPath = 'c:/xampp/htdocs/prototype-teh/.env.local';
  const env = parseEnv(envPath);
  
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    port: parseInt(env.DB_PORT || '3306')
  });

  try {
    const [users] = await connection.execute("SELECT id, name, email, role FROM users");
    console.log('All Users:');
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await connection.end();
  }
}

run();
