import path from "path";
require("dotenv").config({ path: path.join(__dirname, "../.env") });

import express from "express";
import bodyParser from "body-parser";
import redis from "redis";
import { twiml } from "twilio";

import { TwilioIncomingMessage } from "./interfaces";
import * as env from "./env";
import { nextMessage } from "./userStateMachine";
import congressPersonLookup from "./congressPersonLookup";
import callQueue from "./callQueue";
import { createRedisClient } from "./redis";
import { makeCall, initiateText } from "./twilio";
import logger from "./logging";

const app = express();
app.use(bodyParser.urlencoded());

const redisClient = createRedisClient(redis);

app.post("/receiveText", async (req, res) => {
  const incomingMessage: TwilioIncomingMessage = req.body;

  const twimlMessage = new twiml.MessagingResponse();
  const response = await nextMessage(incomingMessage, redisClient);
  twimlMessage.message(response);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twimlMessage.toString());
});

app.post("/makeCall", async (req, res) => {
  const { originalCaller, to } = req.query;

  logger.info({ message: "attempting call", originalCaller, to });

  // call again later if a machine picked it up
  if (req.body.AnsweredBy === "machine_start") {
    delayMessage({ originalCaller, to, res });
  } else {
    await respondWithMessage({ originalCaller, res });
  }
});

app.listen(env.PORT, async () => {
  logger.info({ message: "server listening", port: env.PORT });
  congressPersonLookup.loadCongressAndDistrictData().catch(err => {
    logger.error({ message: "failed to load congress and district data", err });
    process.exit(1);
  });
  callQueue.start(makeCall).catch(err => {
    logger.error({ message: "failed to initialize call queue", err });
    process.exit(1);
  });
});

async function respondWithMessage({ originalCaller, res }) {
  const twimlMessage = new twiml.VoiceResponse();
  let message = await redisClient.hgetAsync(originalCaller, "message");

  // I don't think this should happen, but let's make sure we say something
  if (!message) {
    message = "Goodbye";
  }
  twimlMessage.say(
    `The following message is being delivered on behalf of one of your constituents by spam your congressman. ${message}`
  );

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twimlMessage.toString());

  // We won't bother queueing this work
  // It's fine if it works most of the time
  initiateText({
    to: originalCaller,
    message:
      "We've successfully contacted your representative! Feel free to write back any time."
  });
  redisClient.delAsync(originalCaller).catch(err => {
    logger.error({
      message: "error deleting completed message",
      originalCaller,
      err
    });
  });
}

function delayMessage({ originalCaller, to, res }) {
  logger.debug({ message: "delaying call", originalCaller, to });
  callQueue.delay(originalCaller);
  const twimlMessage = new twiml.VoiceResponse();
  twimlMessage.hangup();
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twimlMessage.toString());
  return;
}
