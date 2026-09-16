/**
 * Sanitize Middleware for Express 5
 * - In-place NoSQL injection protection (safe for Express 5 req.query getter)
 * - XSS filter for strings
 * - Whitespace trimming
 * - Email normalization
 */

// Keys that should not be trimmed (e.g. passwords where leading/trailing spaces might be intentional)
const UNTRIMMED_FIELDS = new Set(['password', 'currentPassword', 'newPassword', 'confirmPassword']);

/**
 * Remove script tags, javascript pseudo-protocols, and inline event handlers
 */
const sanitizeXSS = (str) => {
  if (typeof str !== 'string') return str;
  let cleaned = str;
  // Remove script tags and content inside
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove iframe tags and content inside
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  // Remove javascript: or vbscript: or data:text/html protocols
  cleaned = cleaned.replace(/(javascript|vbscript|data\s*:\s*text\/html):/gi, '');
  // Remove inline on* event handlers (e.g. onerror=, onload=, onclick=)
  cleaned = cleaned.replace(/\bon\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '');
  return cleaned;
};

/**
 * Recursively sanitize an object or array in-place:
 * 1. Delete NoSQL operators (keys starting with '$' or containing '.')
 * 2. Sanitize XSS in string values
 * 3. Trim string values (except password fields)
 */
const sanitizeInPlace = (target, parentKey = '') => {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      if (typeof target[i] === 'string') {
        let val = sanitizeXSS(target[i]);
        if (!UNTRIMMED_FIELDS.has(parentKey)) {
          val = val.trim();
        }
        target[i] = val;
      } else if (typeof target[i] === 'object' && target[i] !== null) {
        sanitizeInPlace(target[i], parentKey);
      }
    }
    return target;
  }

  const keys = Object.keys(target);
  for (const key of keys) {
    // 1. Chống NoSQL Injection: Xóa các key bắt đầu bằng $ hoặc chứa .
    if (key.startsWith('$') || key.includes('.')) {
      delete target[key];
      continue;
    }

    const value = target[key];
    if (typeof value === 'string') {
      // 2. Chống XSS
      let cleaned = sanitizeXSS(value);
      // 3. Trim khoảng trắng (ngoại trừ password)
      if (!UNTRIMMED_FIELDS.has(key)) {
        cleaned = cleaned.trim();
      }
      // 4. Chuẩn hóa email
      if (key === 'email') {
        cleaned = cleaned.toLowerCase();
      }
      target[key] = cleaned;
    } else if (typeof value === 'object' && value !== null) {
      sanitizeInPlace(value, key);
    }
  }

  return target;
};

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 */
const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeInPlace(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeInPlace(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeInPlace(req.params);
  }
  next();
};

module.exports = {
  sanitizeInput,
  sanitizeInPlace,
  sanitizeXSS
};
