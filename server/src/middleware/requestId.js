import { randomUUID } from 'crypto';

export function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || randomUUID();
  req.requestId = Array.isArray(id) ? id[0] : id;
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
