import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { ApiError } from '../errors.js';
import { signToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginBody } from '../schemas.js';

export const authRouter = Router();

authRouter.post('/login', validate({ body: loginBody }), async (req, res) => {
  const { email, password } = req.valid.body;
  const agent = await prisma.agent.findUnique({ where: { email } });
  // Same error for unknown email and wrong password.
  if (!agent || !(await bcrypt.compare(password, agent.passwordHash)))
    throw new ApiError(401, 'Invalid email or password');
  res.json({ token: signToken(agent), agent: { id: agent.id, name: agent.name, email: agent.email } });
});
