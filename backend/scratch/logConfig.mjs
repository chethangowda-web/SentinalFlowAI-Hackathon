import { config } from './src/config/config.js';
console.log('config.db.url =', config.db.url ? 'SET' : 'NOT SET');
console.log('config.db.url value:', config.db.url.replace(/:[^@]*@/, ':*****@'));
console.log('config.db.ssl =', config.db.ssl);
