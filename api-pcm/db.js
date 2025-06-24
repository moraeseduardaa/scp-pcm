const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = new Pool({
      user: 'pcm',
      host: '10.1.1.247',
      database: 'pcm',
      password: 'syspcm',
      port: 5432,
    });

    this.pool.on('error', (err) => {
      console.error('Erro no pool de conexões:', err);
    });
  }

  async query(text, params) {
    const start = Date.now();
    const res = await this.pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executado:', { text, duration, rows: res.rowCount });
    return res;
  }

  async close() {
    await this.pool.end();
    console.log('Conexão encerrada.');
  }
}

module.exports = new Database();
