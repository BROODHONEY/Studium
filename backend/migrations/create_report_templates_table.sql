-- Create report_templates table
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  college_name TEXT,
  show_college_name BOOLEAN DEFAULT true,
  college_name_position TEXT DEFAULT 'top-center',
  logo_url TEXT,
  logo_position TEXT DEFAULT 'top-center',
  logo_size TEXT DEFAULT 'medium',
  font_size INTEGER DEFAULT 12,
  header_color TEXT DEFAULT '#FF6B35',
  show_logo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(institution_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_report_templates_institution_id ON report_templates(institution_id);

-- Add RLS policies
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view their institution's template
CREATE POLICY "Admins can view their institution template"
  ON report_templates
  FOR SELECT
  USING (institution_id IN (
    SELECT institution_id FROM users WHERE id = auth.uid()
  ));

-- Policy: Admins can insert their institution's template
CREATE POLICY "Admins can insert their institution template"
  ON report_templates
  FOR INSERT
  WITH CHECK (institution_id IN (
    SELECT institution_id FROM users WHERE id = auth.uid()
  ));

-- Policy: Admins can update their institution's template
CREATE POLICY "Admins can update their institution template"
  ON report_templates
  FOR UPDATE
  USING (institution_id IN (
    SELECT institution_id FROM users WHERE id = auth.uid()
  ));

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_report_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_report_templates_updated_at();
