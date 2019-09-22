import * as env from "./env";
import { QueuedMessage } from "./interfaces";
import { encode } from "querystring";
import callQueue from "./callQueue";
import os from "os";

const twilioClient = require("twilio")(
  env.TWILIO_ACCOUNT_SID,
  env.TWILIO_AUTH_TOKEN
);

export function makeCall(message: QueuedMessage) {
  const callMetadata = encode({
    originalCaller: message.originalCaller,
    to: "+18473637049"
  });

  return twilioClient.calls
    .create({
      machineDetection: "Enable",
      url: `${env.TWILIO_MAKE_CALL_URL}?${callMetadata}`,
      to: "+18473637049", //message.to,
      from: "+12248777067"
    })
    .then(call => console.log(call.sid))
    .catch(err => {
      console.error("Error making twilio call", err);
      const fifteenMinutes = 15 * 60 * 1000;
      callQueue.delay(message.originalCaller, fifteenMinutes);
    });
}
