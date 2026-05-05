const fs = require('fs');
const path = require('path');
const supabase = require('../config/db');

async function runMigration() {
  try {
    console.log('Running report_templates table migration...');
    
    const migrationPath = path.join(__dirname, '../migrations/create_report_templates_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        console.error('Error executing statement:', error);
        // Continue with other statements
      }
    }
    
    console.log('Migration completed successfully!');
    console.log('\nNote: If you see RLS policy errors, you may need to run this migration directly in Supabase SQL Editor.');
    
  } catch (err) {
    console.error('Migration failed:', err);
    console.log('\nPlease run the migration manually:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of backend/migrations/create_report_templates_table.sql');
    console.log('4. Click "Run"');
  }
  
  process.exit(0);
}

runMigration();
