import { Router } from "express";
import { prisma } from "./db";
import { jobQueue } from "./queue";

const router = Router();

router.post("/", async (req, res) => {
  const { type, payload, priority, scheduledAt } = req.body;

  const job = await prisma.job.create({
    data: {
      type,
      payload,
      status: "pending",
      priority: priority || 0,
      scheduledAt
    }
  });

  await jobQueue.add(type, { jobId: job.id }, {
    priority,
    delay: scheduledAt
      ? new Date(scheduledAt).getTime() - Date.now()
      : 0,
    attempts: 3
  });

  res.send(job);
});

router.get("/:id", async (req, res) => {
  res.send(await prisma.job.findUnique({
    where: { id: req.params.id }
  }));
});

router.get("/", async (_, res) => {
  res.send(await prisma.job.findMany());
});

router.post("/:id/cancel", async (req, res) => {
  await prisma.job.update({
    where: { id: req.params.id },
    data: { status: "cancelled" }
  });

  res.send({ cancelled: true });
});

router.post("/:id/retry", async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id }
  });

  await jobQueue.add(job.type, { jobId: job.id });

  res.send({ retried: true });
});

export default router;