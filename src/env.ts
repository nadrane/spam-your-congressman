import os from "os";

export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
export const PORT = process.env.PORT || "1337";
export const TWILIO_MAKE_CALL_URL =
  process.env.TWILIO_MAKE_CALL_URL || `http:/${os.hostname()}:${PORT}/makeCall`;
export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
export const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
export const REDIS_HOST = process.env.REDIS_HOST || "localhost";
export const ALWAYS_CALL_ME = !Boolean(process.env.ALWAYS_CALL_ME)
  ? false
  : true;

type LogLevels = "trace" | "debug" | "info" | "warn" | "error" | "fatal";
export const LOG_LEVEL: LogLevels =
  (process.env.LOG_LEVEL as LogLevels) || "debug";
