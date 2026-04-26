import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "../api/db";
import nodemailer from "nodemailer";

const connection = new IORedis({
  maxRetriesPerRequest: null,
});

// -------------------- Email Transport --------------------
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "hai1361988@gmail.com",
    pass: "cttx gtic ruho qnqz",
  },
});

// -------------------- Utils --------------------
const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// -------------------- Worker --------------------
new Worker(
  "jobs",
  async (job) => {
    const { jobId } = job.data;

    // 1. Fetch job from DB
    const dbJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    // 2. Handle missing job (IMPORTANT FIX)
    if (!dbJob) {
      throw new Error(`Job not found: ${jobId}`);
    }

    // 3. Mark as processing
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "processing" },
    });

    try {
      let result: any;

      switch (dbJob.type) {
        // ---------------- EMAIL JOB ----------------
        case "email": {
          const payload = dbJob.payload as {
            to: string;
            subject: string;
            text: string;
          };

          await transporter.sendMail({
            from: "your@email.com",
            to: payload.to,
            subject: payload.subject,
            text: payload.text,
          });

          result = { sent: true };
          break;
        }

        // ---------------- WEBHOOK JOB ----------------
        case "webhook": {
          const payload = dbJob.payload as { url: string };

          await fetch(payload.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dbJob.payload),
          });

          result = { called: true };
          break;
        }

        // ---------------- REPORT JOB ----------------
        case "report": {
          await sleep(3000);
          result = { url: "report.pdf" };
          break;
        }

        // ---------------- BATCH JOB ----------------
        case "batch": {
          for (let i = 0; i <= 100; i += 10) {
            await sleep(200);

            await prisma.job.update({
              where: { id: jobId },
              data: { progress: i },
            });
          }

          result = { processed: true };
          break;
        }

        default:
          throw new Error(`Unknown job type: ${dbJob.type}`);
      }

      // 4. Mark as completed
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "completed",
          result,
        },
      });
    } catch (err: any) {
      // 5. Mark as failed
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "failed",
          error: err.message,
        },
      });

      throw err;
    }
  },
  {
    connection,
    concurrency: 5,
  }
);