import { TwilioIncomingMessage, Stage } from "./interfaces";
import congressmenLookup from "./congressPersonLookup";
import callQueue from "./callQueue";
import { AsyncRedisClient } from "./redis";
import uuidv4 from "uuid/v4";

function assertNever(x: never): never {
  throw new Error("Unhandled variant: " + x);
}

export async function nextMessage(
  incomingMessage: TwilioIncomingMessage,
  redisClient: AsyncRedisClient
): Promise<string> {
  const currentStage: Stage | null = (await redisClient.hgetAsync(
    incomingMessage.From,
    "stage"
  )) as Stage;

  if (!currentStage) {
    return initialMessage(incomingMessage, redisClient);
  }

  switch (currentStage) {
    case Stage.GATHER_ADDRESS:
      return gatherAddress(incomingMessage, redisClient);
    case Stage.GATHER_MESSAGE:
      return gatherMessage(incomingMessage, redisClient);
    case Stage.QUEUED_MESSAGE:
      return "Have a good day. We're making a call now.";
    default:
      return assertNever(currentStage);
  }
}

async function initialMessage(
  incomingMessage: TwilioIncomingMessage,
  redisClient: AsyncRedisClient
): Promise<string> {
  await redisClient.hmsetAsync([
    incomingMessage.From,
    "stage",
    Stage.GATHER_ADDRESS,
    "transactionId",
    uuidv4()
  ]);

  return `Welcome to the congressman messaging service! Can you send us your address so we can determine your congressman's district?`;
}

async function gatherAddress(
  incomingMessage: TwilioIncomingMessage,
  redisClient: AsyncRedisClient
): Promise<string> {
  const address = incomingMessage.Body;
  const congressPerson = await congressmenLookup.findByAddress(address);

  // Keep the stage at GATHER_ADDRESS so that they can enter another address
  if (!congressPerson) {
    return `Oh no! We weren't able to find your congressPerson. Maybe try another address :)`;
  }

  await redisClient.hmsetAsync([
    incomingMessage.From,
    "address",
    address,
    "stage",
    Stage.GATHER_MESSAGE,
    "congressPersonPhone",
    congressPerson.phone
  ]);

  return `Thank you! We'll phone ${congressPerson.first_name} ${congressPerson.last_name} on your behalf. We'll give him whatever message you give me. What would you like us to say?`;
}

async function gatherMessage(
  incomingMessage: TwilioIncomingMessage,
  redisClient: AsyncRedisClient
): Promise<string> {
  const message = incomingMessage.Body;

  const [congressPersonPhone] = await Promise.all([
    redisClient.hgetAsync(incomingMessage.From, "congressPersonPhone"),
    redisClient.hmsetAsync([
      incomingMessage.From,
      "message",
      message,
      "stage",
      Stage.QUEUED_MESSAGE
    ])
  ]);

  await callQueue.push({
    to: congressPersonPhone as string,
    originalCaller: incomingMessage.From
  });

  return `We'll call them right away!`;
}
