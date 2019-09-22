import * as env from "./env";
import { QueuedMessage } from "./interfaces";
import redis from "redis";
import { createRedisClient, AsyncRedisClient } from "./redis";

const oneHour = 1000 * 60 * 60;

class CallQueue {
  redisClient?: AsyncRedisClient;

  async start(callback: (message: QueuedMessage) => Promise<void>) {
    console.log("Starting call queue");
    this.initializeRedisClient();

    setInterval(async () => {
      console.log("checking delays");
      const nextDelayedMessage = await this.getNextDelayedMessage();
      if (nextDelayedMessage) {
        await this.push(nextDelayedMessage);
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
        "You must invoke CallQueue.start before enqueuing messages"
      );
    }

    try {
      await this.redisClient.rpushAsync(
        "queue:messages",
        JSON.stringify(message)
      );
    } catch (err) {
      console.error("Failed to add message to redis queue", err);
      throw err;
    }
  }

  private async pop(): Promise<QueuedMessage | undefined> {
    if (!this.redisClient) {
      throw new Error(
        "You must invoke CallQueue.start before dequeuing messages"
      );
    }

    const messageString = await this.redisClient.blpopAsync(
      "queue:messages",
      15
    );

    if (!messageString) {
      return;
    }
    return JSON.parse(messageString[1]) as QueuedMessage;
  }

  async delay(message: QueuedMessage, waitTimeMs = oneHour) {
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
        JSON.stringify(message)
      );
    } catch (err) {
      console.error("Failed to add delayed message to redis set", err);
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
      return JSON.parse(nextDelayedMessage[0]);
    }
  }
}

export default new CallQueue();
