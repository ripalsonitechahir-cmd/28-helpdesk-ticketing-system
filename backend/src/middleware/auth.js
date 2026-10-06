import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { ApiError } from '../errors.js';

export const signToken = (agent) =>
  jwt.sign({ sub: agent.id, name: agent.name }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

function readAgent(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  try {
    const { sub, name } = jwt.verify(token, config.jwtSecret);
    return { id: sub, name };
  } catch {
    return null;
  }
}

// Sets req.agent when a valid token is present; never rejects.
export const optionalAgent = (req, _res, next) => {
  req.agent = readAgent(req);
  next();
};

export const requireAgent = (req, _res, next) => {
  req.agent = readAgent(req);
  next(req.agent ? undefined : new ApiError(401, 'Agent authentication required'));
};
