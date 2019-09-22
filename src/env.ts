export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
export const PORT = process.env.PORT || "1337";
export const TWILIO_MAKE_CALL_URL =
  process.env.TWILIO_MAKE_CALL_URL || `http://localhost:${PORT}/makeCall`;
export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
export const ALWAYS_CALL_ME =
  Boolean(process.env.ALWAYS_CALL_ME) === false ? false : true;

type LogLevels = "trace" | "debug" | "info" | "warn" | "error" | "fatal";
export const LOG_LEVEL: LogLevels =
  (process.env.LOG_LEVEL as LogLevels) || "debug";

export const TWILIO_OUTGOING_NUMBER = process.env.TWILIO_OUTGOING_NUMBER;
