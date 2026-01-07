import express from "express";
import cors from "cors";
import lawRoutes from "./routes/lawRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/laws", lawRoutes);
app.use("/api/cards", cardRoutes);
app.get("/", (req, res) => {
  res.send("Computer Law API is running");
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
