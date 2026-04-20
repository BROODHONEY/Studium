const { createClient } = require('@supabase/supabase-js')
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Wrapper to make Supabase work like pg for compatibility
const query = async (text, params = []) => {
  try {
    // This is a simple wrapper - you'll need to convert SQL to Supabase queries
    // For now, we'll use Supabase's RPC or direct table access
    console.warn('Direct SQL query attempted with Supabase. Query:', text);
    
    // Return empty result for now
    return [[], { rowCount: 0 }];
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

module.exports = supabase;
module.exports.query = query;


