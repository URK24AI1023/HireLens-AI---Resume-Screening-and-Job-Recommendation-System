
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const matchRoutes = require("./routes/matchRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const savedJobRoutes = require("./routes/savedJobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/saved-jobs", savedJobRoutes);
app.use("/api/applications", applicationRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to HireLens AI Backend!",
    status: "Server is running"
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`HireLens AI server running on port ${PORT}`);
  });
};

startServer();
