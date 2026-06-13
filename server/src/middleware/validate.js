// Declarative request-body validation (LLD §3.2). Rejects with 400 before any
// DB work. A rule: { type, required?, max?, nullable? }.
// Types: string, integer, number, boolean, date (ISO-8601).

function checkType(value, rule) {
  switch (rule.type) {
    case 'string':
      if (typeof value !== 'string') return 'must be a string';
      if (rule.max && value.length > rule.max) return `must be at most ${rule.max} characters`;
      if (rule.required && value.trim() === '') return 'must not be empty';
      return null;
    case 'integer':
      if (!Number.isInteger(value) || value <= 0) return 'must be a positive integer';
      return null;
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) return 'must be a finite number';
      return null;
    case 'boolean':
      if (typeof value !== 'boolean') return 'must be a boolean';
      return null;
    case 'date':
      if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return 'must be an ISO-8601 date';
      return null;
    default:
      return null;
  }
}

function validate(rules) {
  return (req, res, next) => {
    const body = req.body || {};
    for (const [field, rule] of Object.entries(rules)) {
      const value = body[field];
      if (value === undefined || (value === null && rule.nullable)) {
        if (rule.required && value === undefined) {
          return res.status(400).json({ error: `${field} is required` });
        }
        continue;
      }
      if (value === null) {
        return res.status(400).json({ error: `${field} must not be null` });
      }
      const problem = checkType(value, rule);
      if (problem) return res.status(400).json({ error: `${field} ${problem}` });
    }
    next();
  };
}

// Validates a route :param as a positive integer id.
function intParam(...names) {
  return (req, res, next) => {
    for (const name of names) {
      const value = Number(req.params[name]);
      if (!Number.isInteger(value) || value <= 0) {
        return res.status(400).json({ error: `${name} must be a positive integer` });
      }
    }
    next();
  };
}

module.exports = { validate, intParam };
