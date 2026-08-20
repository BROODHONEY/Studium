-- Add new fields for enhanced template customization
ALTER TABLE report_templates
ADD COLUMN IF NOT EXISTS subtitle TEXT,
ADD COLUMN IF NOT EXISTS header_text TEXT,
ADD COLUMN IF NOT EXISTS footer_text TEXT,
ADD COLUMN IF NOT EXISTS show_subtitle BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_header_text BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_footer_text BOOLEAN DEFAULT false;

-- Verify the new columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'report_templates'
ORDER BY ordinal_position;
