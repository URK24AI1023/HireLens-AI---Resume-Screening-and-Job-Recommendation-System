
const express = require("express");
const mongoose = require("mongoose");

const SavedJob = require("../models/SavedJob");
const Job = require("../models/Job");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All saved-job operations require authentication.
router.use(protect);

// GET: View the logged-in user's saved jobs
router.get("/", async (req, res) => {
  try {
    const savedJobs = await SavedJob.find({
      user: req.user.id
    })
      .populate({
        path: "job",
        match: { isActive: true },
        populate: {
          path: "recruiter",
          select: "name"
        }
      })
      .sort({ createdAt: -1 });

    // Exclude jobs that are no longer active.
    const activeSavedJobs = savedJobs.filter(
      (savedJob) => savedJob.job !== null
    );

    res.json({
      totalSaved: activeSavedJobs.length,
      savedJobs: activeSavedJobs
    });
  } catch (error) {
    console.error("Fetch saved jobs error:", error.message);
    res.status(500).json({
      message: "Failed to fetch saved jobs"
    });
  }
});

// POST: Save a job
router.post("/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        message: "Invalid job ID"
      });
    }

    const job = await Job.findOne({
      _id: jobId,
      isActive: true
    });

    if (!job) {
      return res.status(404).json({
        message: "Active job not found"
      });
    }

    const existingSave = await SavedJob.findOne({
      user: req.user.id,
      job: jobId
    });

    if (existingSave) {
      return res.status(409).json({
        message: "This job is already saved"
      });
    }

    const savedJob = await SavedJob.create({
      user: req.user.id,
      job: jobId
    });

    res.status(201).json({
      message: "Job saved successfully",
      savedJob
    });
  } catch (error) {
    // Handles duplicate requests that reach MongoDB simultaneously.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This job is already saved"
      });
    }

    console.error("Save job error:", error.message);
    res.status(500).json({
      message: "Failed to save job"
    });
  }
});

// DELETE: Remove a job from the logged-in user's saved list
router.delete("/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        message: "Invalid job ID"
      });
    }

    const deletedSave = await SavedJob.findOneAndDelete({
      user: req.user.id,
      job: jobId
    });

    if (!deletedSave) {
      return res.status(404).json({
        message: "Saved job not found"
      });
    }

    res.json({
      message: "Job removed from saved jobs"
    });
  } catch (error) {
    console.error("Unsave job error:", error.message);
    res.status(500).json({
      message: "Failed to remove saved job"
    });
  }
});

module.exports = router;
