import path from "path";
require("dotenv").config({ path: path.join(__dirname, ".env") });

import express from "express";
import bodyParser from "body-parser";
import { twiml } from "twilio";
import { TwilioIncomingMessage, Messages } from "./interfaces";
import * as env from "./env";
import { nextMessage } from "./userStateMachine";
import congressPersonLookup from "./congressPersonLookup";

const messages: Messages = {};

const app = express();
app.use(bodyParser.urlencoded());

app.post("/receive", async (req, res) => {
  const incomingMessage: TwilioIncomingMessage = req.body;

  const twimlMessage = new twiml.MessagingResponse();
  const response = await nextMessage(incomingMessage, messages);
  twimlMessage.message(response);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twimlMessage.toString());
});

app.listen(env.PORT, () => {
  console.log(`listening on ${env.PORT}`);
  congressPersonLookup.loadCongressAndDistrictData();
});
