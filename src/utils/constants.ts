export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  process.env.NEXT_PUBLIC_NODE_ADDRESS ||
  "0x0";

export const IRON_OPTIONS = {
  cookieName: 'siwe',
  password: process.env.IRON_SESSION_PASSWORD,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export const IS_BETA = true;
