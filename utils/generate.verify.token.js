import jwt from "jsonwebtoken";

export const generateToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token, secret, options = {}) => {
  try {
    const decoded = jwt.verify(token, secret, options);
    return { decoded };
  } catch (error) {
    return { error };
  }
};
