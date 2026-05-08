import mysql from 'mysql2/promise';

export async function getConnection() {
  try {
    // Aiven membutuhkan SSL dengan CA certificate khusus
    // DB_SSL_CA diisi di Vercel env vars dengan isi file ca.pem
    const sslConfig: any = process.env.DB_SSL_CA
      ? { ca: process.env.DB_SSL_CA, rejectUnauthorized: true }
      : { rejectUnauthorized: false };

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: parseInt(process.env.DB_PORT || '3306'),
      ssl: sslConfig,
    });
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function query(sql: string, values?: any[]) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(sql, values);
    return rows;
  } finally {
    await connection.end();
  }
}
