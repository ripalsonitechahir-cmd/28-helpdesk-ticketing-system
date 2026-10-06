import { ApiError } from '../errors.js';

// validate({ body, query, params }) -> parsed values on req.valid.{body,query,params}
export const validate = (schemas) => (req, _res, next) => {
  req.valid = {};
  const details = {};
  for (const [part, schema] of Object.entries(schemas)) {
    const result = schema.safeParse(req[part] ?? {});
    if (result.success) req.valid[part] = result.data;
    else
      for (const issue of result.error.issues)
        details[issue.path.join('.') || part] = issue.message;
  }
  next(Object.keys(details).length ? new ApiError(400, 'Validation failed', details) : undefined);
};
