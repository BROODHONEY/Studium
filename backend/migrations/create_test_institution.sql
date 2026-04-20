-- Create test institution "rec" for testing
INSERT INTO institutions (name, subdomain, contact_email, plan, status) 
VALUES ('REC College', 'rec', 'admin@rec.edu', 'premium', 'active')
ON CONFLICT (subdomain) DO UPDATE 
SET status = 'active';

-- Verify it was created
SELECT * FROM institutions WHERE subdomain = 'rec';
