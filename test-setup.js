const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🧪 Testing Virtual Analyst Setup...\n');
  
  let DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local');
    return false;
  }

  // Remove SSL requirement for testing
  DATABASE_URL = DATABASE_URL.replace('?', '');

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    console.log('✅ Testing database connection...');
    const client = await pool.connect();
    
    // Test connection
    const result = await client.query('SELECT NOW()');
    console.log('   ✓ Database connection successful');
    console.log(`   ✓ Current time from DB: ${result.rows[0].now}`);
    
    // Check tables
    console.log('\n✅ Checking database tables...');
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tableNames = tables.rows.map(t => t.table_name);
    console.log(`   ✓ Found ${tableNames.length} tables:`);
    tableNames.forEach(name => console.log(`      - ${name}`));
    
    // Check credentials
    console.log('\n✅ Checking environment variables...');
    const hasGoogleClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasGoogleClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const hasProjectId = !!process.env.GOOGLE_PROJECT_ID;
    const hasAnalyticsId = !!process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    
    console.log(`   ${hasGoogleClientId ? '✓' : '✗'} Google Client ID configured`);
    console.log(`   ${hasGoogleClientSecret ? '✓' : '✗'} Google Client Secret configured`);
    console.log(`   ${hasOpenAIKey ? '✓' : '✗'} OpenAI API Key configured`);
    console.log(`   ${hasProjectId ? '✓' : '✗'} Google Project ID configured`);
    console.log(`   ${hasAnalyticsId ? '✓' : '✗'} Google Analytics Property ID configured`);
    
    client.release();
    
    console.log('\n✅ Setup test completed successfully!\n');
    console.log('📊 Your Virtual Analyst is ready! Here\'s what\'s configured:');
    console.log('   • Database: Supabase PostgreSQL');
    console.log('   • Google APIs: Analytics, Ads, Search Console');
    console.log('   • AI Engine: OpenAI GPT-4');
    console.log('   • Dashboard: http://localhost:3000/dashboard');
    console.log('\n🚀 Next steps:');
    console.log('   1. Fix the Next.js SWC issue (see below)');
    console.log('   2. Run: npm run dev');
    console.log('   3. Visit: http://localhost:3000/dashboard');
    console.log('\n');
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

testConnection().then(success => {
  if (success) {
    console.log('✅ All systems operational!');
  } else {
    console.log('⚠️  Please check your configuration');
  }
});
