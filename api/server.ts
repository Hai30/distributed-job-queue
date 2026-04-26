console.log("1 - server starting");

import express from "express";
console.log("2 - express ok");

import jobRoutes from "./routes";
console.log("3 - routes imported");

const app = express();
app.use(express.json());

app.use("/jobs", jobRoutes);

app.get("/health", (_, res) => {
  res.send({ status: "ok" });
});

app.listen(3000, () => {
  console.log("4 - SERVER RUNNING");
});