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
    // Try to get token from cookies first, then from Authorization header
    let token = req.cookies?.access_token;

    // If no cookie token, try Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    console.log('🔐 Auth Debug:', {
      hasCookies: !!req.cookies,
      cookieKeys: Object.keys(req.cookies || {}),
      hasAccessToken: !!req.cookies?.access_token,
      hasAuthHeader: !!req.headers.authorization,
      authHeader: req.headers.authorization?.substring(0, 50) + '...',
      jwtSecretExists: !!process.env.JWT_ACCESS_SECRET
    });

    if (!token) {
      console.log('❌ No access token found in cookies or headers');
      return res.status(401).json({
        message: 'Unauthorized - No token provided',
        debug: {
          hasCookies: !!req.cookies,
          cookieKeys: Object.keys(req.cookies || {}),
          hasAuthHeader: !!req.headers.authorization
        }
      });
    }

    if (!process.env.JWT_ACCESS_SECRET) {
      console.log('❌ JWT_ACCESS_SECRET not set');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    console.log('✅ Auth successful for user:', payload.sub, 'role:', payload.role);
    next();
  } catch (error) {
    console.log('❌ Auth failed:', error.message);
    console.log('❌ Error details:', {
      name: error.name,
      message: error.message,
      expiredAt: error.expiredAt
    });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Unauthorized - Token expired',
        error: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Unauthorized - Invalid token',
        error: 'INVALID_TOKEN'
      });
    }

    res.status(401).json({
      message: 'Unauthorized - Token verification failed',
      error: error.message
    });
  }
}
