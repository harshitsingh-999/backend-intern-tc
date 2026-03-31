import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "7d";
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax"
};

const getAccessTokenSecret = () => process.env.JWT_SECRET || process.env.JWT_ACCESS_TOKEN;
const getRefreshTokenSecret = () => process.env.JWT_REFRESH_SECRET || getAccessTokenSecret();

const getTokenTimestamps = (token) => {
  const decoded = jwt.decode(token);
  const issuedAtMs = decoded?.iat ? decoded.iat * 1000 : Date.now();
  const expiresAtMs = decoded?.exp ? decoded.exp * 1000 : issuedAtMs;

  return {
    issuedAtMs,
    expiresAtMs,
    maxAgeMs: Math.max(expiresAtMs - issuedAtMs, 0),
    expiresAtIso: new Date(expiresAtMs).toISOString()
  };
};

export const getAuthSecrets = () => ({
  accessTokenSecret: getAccessTokenSecret(),
  refreshTokenSecret: getRefreshTokenSecret()
});

export const issueAuthTokens = (payload) => {
  const { accessTokenSecret, refreshTokenSecret } = getAuthSecrets();

  if (!accessTokenSecret) {
    throw new Error("JWT access token secret is not configured");
  }

  const accessToken = jwt.sign(payload, accessTokenSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  });

  const refreshToken = jwt.sign(
    { ...payload, type: "refresh" },
    refreshTokenSecret,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  const accessMeta = getTokenTimestamps(accessToken);
  const refreshMeta = getTokenTimestamps(refreshToken);

  return {
    accessToken,
    refreshToken,
    accessCookieOptions: { ...BASE_COOKIE_OPTIONS, maxAge: accessMeta.maxAgeMs },
    refreshCookieOptions: { ...BASE_COOKIE_OPTIONS, maxAge: refreshMeta.maxAgeMs },
    accessTokenExpiresAt: accessMeta.expiresAtIso,
    refreshTokenExpiresAt: refreshMeta.expiresAtIso,
    accessTokenMaxAgeMs: accessMeta.maxAgeMs,
    refreshTokenMaxAgeMs: refreshMeta.maxAgeMs
  };
};

export const verifyAccessToken = (token) => {
  const { accessTokenSecret } = getAuthSecrets();

  if (!accessTokenSecret) {
    throw new Error("JWT access token secret is not configured");
  }

  return jwt.verify(token, accessTokenSecret);
};

export const verifyRefreshToken = (token) => {
  const { refreshTokenSecret } = getAuthSecrets();

  if (!refreshTokenSecret) {
    throw new Error("JWT refresh token secret is not configured");
  }

  const decoded = jwt.verify(token, refreshTokenSecret);

  if (decoded?.type !== "refresh") {
    throw new Error("Invalid refresh token type");
  }

  return decoded;
};

export const clearCookieOptions = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: 0
};
