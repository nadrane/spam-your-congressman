import { TwilioIncomingMessage, Messages, Stage } from "./interfaces";
import congressmenLookup from "./congressPersonLookup";

export async function nextMessage(
  incomingMessage: TwilioIncomingMessage,
  messages: Messages
) {
  if (!messages[incomingMessage.From]) {
    return initialMessage(incomingMessage, messages);
  }

  const currentStage = messages[incomingMessage.From].stage;
  if (currentStage === Stage.GATHER_ADDRESS) {
    return gatherAddress(incomingMessage, messages);
  } else if (currentStage === Stage.GATHER_MESSAGE) {
    return gatherMessage(incomingMessage, messages);
  } else if (currentStage === Stage.QUEUED_MESSAGE) {
    return "Have a good day. We're making a call now.";
  } else {
    throw new Error(`Unknown message stage ${currentStage}`);
  }
}

function initialMessage(
  incomingMessage: TwilioIncomingMessage,
  messages: Messages
): string {
  messages[incomingMessage.From] = {
    stage: Stage.GATHER_ADDRESS
  };

  return `Welcome to the congressman messaging service! Can you send us your address so we can determine your congressman's district?`;
}

async function gatherAddress(
  incomingMessage: TwilioIncomingMessage,
  messages: Messages
): Promise<string> {
  messages[incomingMessage.From] = {
    stage: Stage.GATHER_MESSAGE
  };

  const congressman = await congressmenLookup.findByAddress(
    incomingMessage.Body
  );

  if (!congressman) {
    delete messages[incomingMessage.From];
    return `Oh no! We weren't able to find your congressman :( Maybe try another address`;
  }

  return `Thank you! We'll phone congressman ${congressman.first_name} ${congressman.last_name} on your behalf. What would you like us to say?`;
}

function gatherMessage(
  incomingMessage: TwilioIncomingMessage,
  messages: Messages
): string {
  messages[incomingMessage.From] = {
    stage: Stage.QUEUED_MESSAGE
  };

  return `We'll call them right away!`;
}
