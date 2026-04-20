// Utility to extract subdomain from hostname
export const getSubdomain = () => {
  const hostname = window.location.hostname;
  
  // Development: lvh.me or localhost with subdomain
  if (hostname.includes('lvh.me')) {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts[0]; // e.g., "rec" from "rec.lvh.me"
    }
  }
  
  // Development: subdomain.localhost
  if (hostname.includes('.localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 1) {
      return parts[0]; // e.g., "rec" from "rec.localhost"
    }
  }
  
  // Production: subdomain.studiplus.com
  if (hostname.includes('.studiplus.com')) {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts[0]; // e.g., "rec" from "rec.studiplus.com"
    }
  }
  
  // No subdomain found
  return null;
};

// Check if we're on the main domain (no subdomain)
export const isMainDomain = () => {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === 'lvh.me' ||
    hostname === 'studiplus.com' ||
    hostname === '127.0.0.1'
  );
};
