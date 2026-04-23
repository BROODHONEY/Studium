/**
 * Centralized helpers for institution selection stored in localStorage.
 * Use these instead of scattering raw localStorage key strings across pages.
 */

const KEYS = {
  id:          'institutionId',
  name:        'institutionName',
  subdomain:   'institutionSubdomain',
  emailDomain: 'institutionEmailDomain',
};

/** Read the currently selected institution from localStorage. Returns null if not set. */
export function getStoredInstitution() {
  const id        = localStorage.getItem(KEYS.id);
  const name      = localStorage.getItem(KEYS.name);
  const subdomain = localStorage.getItem(KEYS.subdomain);
  if (!id || !name || !subdomain) return null;
  return {
    id,
    name,
    subdomain,
    emailDomain: localStorage.getItem(KEYS.emailDomain) || null,
  };
}

/** Persist an institution selection to localStorage. */
export function storeInstitution({ id, name, subdomain, emailDomain }) {
  localStorage.setItem(KEYS.id,        id);
  localStorage.setItem(KEYS.name,      name);
  localStorage.setItem(KEYS.subdomain, subdomain);
  if (emailDomain) {
    localStorage.setItem(KEYS.emailDomain, emailDomain);
  } else {
    localStorage.removeItem(KEYS.emailDomain);
  }
}

/** Clear the stored institution selection. */
export function clearStoredInstitution() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}
