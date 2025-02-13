// config/jwtConfig.js
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'local'}` });
module.exports = {
    JWT_SECRET: process.env.JWT_SECRET
};
  