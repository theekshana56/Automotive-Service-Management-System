import jwt from 'jsonwebtoken';

const sign = (payload, secret, ttl) => jwt.sign(payload, secret, { expiresIn: ttl });

export function issueTokens(user) {
  const access = sign({ sub: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, process.env.ACCESS_TOKEN_TTL || '15m');
  const refresh = sign({ sub: user._id }, process.env.JWT_REFRESH_SECRET, process.env.REFRESH_TOKEN_TTL || '7d');
  return { access, refresh };
}

export function setAuthCookies(res, { access, refresh }) {
  const opts = { httpOnly: true, sameSite: 'lax', secure: false, domain: 'localhost' };
  res.cookie('access_token', access, { ...opts, maxAge: 15 * 60 * 1000, path: '/' });
  res.cookie('refresh_token', refresh, { ...opts, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' });
}

export function clearAuthCookies(res) {
  const opts = { httpOnly: true, sameSite: 'lax', secure: false, domain: 'localhost', path: '/' };
  res.clearCookie('access_token', opts);
  res.clearCookie('refresh_token', opts);
}

export default function authRequired(req, res, next) {
  try {
    const token = req.cookies['access_token'];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
}
