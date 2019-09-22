import * as env from "./env";
import { QueuedMessage } from "./interfaces";
import redis from "redis";
import { createRedisClient, AsyncRedisClient } from "./redis";
import logger from "./logging";

const oneHour = 1000 * 60 * 60;

class CallQueue {
  redisClient?: AsyncRedisClient;

  async start(callback: (message: QueuedMessage) => Promise<void>) {
    logger.info({ message: "starting call queue" });
    this.initializeRedisClient();

    setInterval(async () => {
      logger.trace({ message: "checking delayed message queue" });
      const nextDelayedMessage = await this.getNextDelayedMessage();
      if (nextDelayedMessage) {
        logger.info({
          message: "requeueing delayed",
          originalCaller: nextDelayedMessage.originalCaller,
          to: nextDelayedMessage.to
        });
        await this.push(nextDelayedMessage);
        await this.removeDelayedMessage(nextDelayedMessage.originalCaller);
      }
    }, oneHour / 200);

    while (true) {
      const nextMessage = await this.pop();
      if (nextMessage) {
        callback(nextMessage);
      }
    }
  }

  private initializeRedisClient() {
    if (!env.REDIS_HOST) {
      throw new Error("env var REDIS_HOST must be defined");
    }
    if (!env.REDIS_PORT) {
      throw new Error("env var REDIS_PORT must be defined");
    }

    this.redisClient = createRedisClient(redis);
  }

  async push(message: QueuedMessage) {
    if (!this.redisClient) {
      throw new Error(
        "you must invoke CallQueue.start before enqueuing messages"
      );
    }

    this.redisClient.hgetallAsync(message.originalCaller).then(res => {
      logger.debug({ message: "queueing message", ...res });
    });

    try {
      await this.redisClient.rpushAsync(
        "queue:messages",
        JSON.stringify(message)
      );
    } catch (err) {
      logger.error({ message: "failed to add message to redis queue", err });
      throw err;
    }
  }

  private async pop(): Promise<QueuedMessage | undefined> {
    if (!this.redisClient) {
      throw new Error(
        "You must invoke CallQueue.start before dequeuing messages"
      );
    }

    // It's weird that we are using such a short timeout for blpop
    // Doesn't that negate its performance advantages?
    // Sort of, yes, but this application is a bit odd.
    // Usually the producer and consumer of a queue run on different machines
    // on a different connections
    // I'm trying to save money by running everything on one machine.
    // Blocking pops prevents writes to the queue until it times out
    // This creates an unacceptable wait for the user.
    // I have a feel using 2 connections would fix this issue,
    // but franky, we don't have crazy performance constraints, so I'll settle
    // for a short timeout
    const messageString = await this.redisClient.blpopAsync(
      "queue:messages",
      1
    );

    if (!messageString) {
      return;
    }
    return JSON.parse(messageString[1]) as QueuedMessage;
  }

  async delay(orginalCaller: string, waitTimeMs = oneHour) {
    if (!this.redisClient) {
      throw new Error(
        "You must invoke CallQueue.start before enqueuing messages"
      );
    }

    const dequeueTime = Date.now() + waitTimeMs;
    try {
      await this.redisClient.zaddAsync(
        "set:delayed",
        dequeueTime,
        orginalCaller
      );
    } catch (err) {
      logger.error({
        message: "failed to add delayed message to redis set",
        err
      });
      throw err;
    }
  }

  private async getNextDelayedMessage(): Promise<QueuedMessage | undefined> {
    if (!this.redisClient) {
      throw new Error(
        "You must invoke CallQueue.start before retrieving delayed messages"
      );
    }

    const nextDelayedMessage = await this.redisClient.zrangeAsync(
      "set:delayed",
      0,
      0,
      "withscores"
    );

    if (Number(nextDelayedMessage[1]) <= Date.now()) {
      const originalCaller = nextDelayedMessage[0];
      const congressPersonPhone = (await this.redisClient.hgetAsync(
        originalCaller,
        "congressPersonPhone"
      )) as string;
      return {
        originalCaller,
        to: congressPersonPhone
      };
    }
  }

  private removeDelayedMessage(orginalCaller: string): Promise<number> {
    if (!this.redisClient) {
      throw new Error(
        "You must invoke CallQueue.start before removing delayed messages"
      );
    }

    return this.redisClient.zremAsync("set:delayed", orginalCaller);
  }
}

export default new CallQueue();
