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
import { makeCall } from "./twilio";

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

  // call again later if a machine picked it up
  if (req.body.AnsweredBy === "machine_start") {
    console.log("called", originalCaller, to);
    callQueue.delay(
      {
        originalCaller,
        to
      },
      60000
    );
  }

  const twimlMessage = new twiml.VoiceResponse();
  let message = await redisClient.hgetAsync(originalCaller, "message");

  // I don't think this should happen, but let's make sure we say something
  if (!message) {
    message = "Goodbye";
  }
  twimlMessage.say(message);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twimlMessage.toString());
});

app.listen(env.PORT, async () => {
  console.log(`listening on ${env.PORT}`);
  congressPersonLookup.loadCongressAndDistrictData().catch(err => {
    console.error("Failed to load congress and district data", err);
    process.exit(1);
  });
  callQueue.start(makeCall).catch(err => {
    console.error("Failed to initialize call queue", err);
    process.exit(1);
  });
});
