import mysql from 'mysql2/promise';

export async function getConnection() {
  try {
    const connectionConfig: any = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: parseInt(process.env.DB_PORT || '3306'),
    };

    // Aiven/remote DB requires SSL, local XAMPP doesn't support it
    if (process.env.DB_SSL_CA) {
      connectionConfig.ssl = { ca: process.env.DB_SSL_CA, rejectUnauthorized: true };
    } else if (process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1') {
      connectionConfig.ssl = { rejectUnauthorized: false };
    }

    const connection = await mysql.createConnection(connectionConfig);
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
