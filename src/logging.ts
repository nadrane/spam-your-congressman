import bunyan from "bunyan";
import * as env from "./env";

export default bunyan.createLogger({
  name: "spam-your-congressman",
  level: env.LOG_LEVEL
});
