import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis();

export const jobQueue = new Queue("jobs", {
  connection
});