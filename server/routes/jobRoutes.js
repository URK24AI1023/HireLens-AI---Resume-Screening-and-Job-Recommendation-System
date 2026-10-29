
const express = require("express");
const Job = require("../models/Job");
const { protect, recruiterOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// GET: View all active jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true })
      .populate("recruiter", "name")
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error("Fetch jobs error:", error.message);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

// GET: View jobs posted by the logged-in recruiter
router.get("/my-jobs", protect, recruiterOnly, async (req, res) => {
  try {
    const jobs = await Job.find({
      recruiter: req.user.id
    }).sort({ createdAt: -1 });

    res.json({
      totalJobs: jobs.length,
      jobs
    });
  } catch (error) {
    console.error("Recruiter jobs error:", error.message);
    res.status(500).json({ message: "Failed to fetch your jobs" });
  }
});

// GET: View one job by ID
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      isActive: true
    }).populate("recruiter", "name");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    console.error("Fetch job error:", error.message);
    res.status(500).json({ message: "Failed to fetch job" });
  }
});

// POST: Recruiter creates a job
router.post("/", protect, recruiterOnly, async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      jobType,
      description,
      requiredSkills,
      experience,
      salary
    } = req.body;

    if (
      !title ||
      !company ||
      !location ||
      !description ||
      !Array.isArray(requiredSkills) ||
      requiredSkills.length === 0
    ) {
      return res.status(400).json({
        message: "Please provide all required job details and skills"
      });
    }

    const job = await Job.create({
      title,
      company,
      location,
      jobType,
      description,
      requiredSkills,
      experience,
      salary,
      recruiter: req.user.id
    });

    res.status(201).json({
      message: "Job created successfully",
      job
    });
  } catch (error) {
    console.error("Create job error:", error.message);
    res.status(500).json({ message: "Failed to create job" });
  }
});

// PUT: Edit a job owned by the logged-in recruiter
router.put("/:id", protect, recruiterOnly, async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      jobType,
      description,
      requiredSkills,
      experience,
      salary
    } = req.body;

    if (
      !title?.trim() ||
      !company?.trim() ||
      !location?.trim() ||
      !description?.trim() ||
      !Array.isArray(requiredSkills) ||
      requiredSkills.length === 0
    ) {
      return res.status(400).json({
        message: "Please provide all required job details and skills"
      });
    }

    const job = await Job.findOneAndUpdate(
      {
        _id: req.params.id,
        recruiter: req.user.id
      },
      {
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        jobType,
        description: description.trim(),
        requiredSkills: requiredSkills
          .map(skill => String(skill).trim())
          .filter(Boolean),
        experience,
        salary
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!job) {
      return res.status(404).json({
        message: "Job not found or you do not own this job"
      });
    }

    res.json({
      message: "Job updated successfully",
      job
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    console.error("Update job error:", error.message);
    res.status(500).json({ message: "Failed to update job" });
  }
});

// PATCH: Activate or deactivate a job
router.patch("/:id/active", protect, recruiterOnly, async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be true or false"
      });
    }

    const job = await Job.findOneAndUpdate(
      {
        _id: req.params.id,
        recruiter: req.user.id
      },
      { isActive },
      {
        new: true,
        runValidators: true
      }
    );

    if (!job) {
      return res.status(404).json({
        message: "Job not found or you do not own this job"
      });
    }

    res.json({
      message: isActive
        ? "Job activated successfully"
        : "Job deactivated successfully",
      job
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    console.error("Toggle job status error:", error.message);
    res.status(500).json({
      message: "Failed to update job status"
    });
  }
});

// DELETE: Delete a job owned by the logged-in recruiter
router.delete("/:id", protect, recruiterOnly, async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      recruiter: req.user.id
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found or you do not own this job"
      });
    }

    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    console.error("Delete job error:", error.message);
    res.status(500).json({ message: "Failed to delete job" });
  }
});

module.exports = router;
