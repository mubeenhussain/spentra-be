require('dotenv').config({ quiet: true });

const required = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[config] Missing required env var: ${key}`);
    process.exit(1);
  }
}

const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL,
  nodeEnv: process.env.NODE_ENV || 'development',
};

module.exports = config;
