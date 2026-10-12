import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};
