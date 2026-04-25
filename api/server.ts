import express from "express";
import jobRoutes from "./routes";

const app = express();
app.use(express.json());

app.use("/jobs", jobRoutes);

app.get("/health", (_, res) => {
  res.send({ status: "ok" });
});

app.listen(3000, () => {
  console.log("Server running on 3000");
});