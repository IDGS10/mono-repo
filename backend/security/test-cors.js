#!/usr/bin/env node

// Script para verificar la configuración de CORS
const axios = require('axios');

const BASE_URL = process.env.API_URL || 'https://server-uteq.nrsoftware.online';
const ENDPOINTS = [
  '/security/api/health',
  '/security/api/auth/login'
];

async function testCORS() {
  console.log('🧪 Iniciando pruebas de CORS...\n');

  for (const endpoint of ENDPOINTS) {
    const fullUrl = `${BASE_URL}${endpoint}`;
    console.log(`Testing: ${fullUrl}`);

    try {
      // Test OPTIONS request (preflight)
      const optionsResponse = await axios({
        method: 'OPTIONS',
        url: fullUrl,
        headers: {
          'Origin': 'https://mono-repo-fawn.vercel.app',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type,Authorization'
        }
      });

      console.log(`✅ OPTIONS status: ${optionsResponse.status}`);
      console.log(`✅ CORS headers:`);
      console.log(`   Access-Control-Allow-Origin: ${optionsResponse.headers['access-control-allow-origin']}`);
      console.log(`   Access-Control-Allow-Methods: ${optionsResponse.headers['access-control-allow-methods']}`);
      console.log(`   Access-Control-Allow-Headers: ${optionsResponse.headers['access-control-allow-headers']}`);

    } catch (error) {
      console.log(`❌ OPTIONS failed: ${error.response?.status || error.message}`);
      if (error.response?.headers) {
        console.log(`   CORS headers in error:`, error.response.headers);
      }
    }

    console.log('---');
  }
}

// Run the test
if (require.main === module) {
  testCORS().catch(console.error);
}

module.exports = { testCORS };
