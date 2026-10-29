
const express = require("express");
const mongoose = require("mongoose");

const Application = require("../models/Application");
const Job = require("../models/Job");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All application routes require authentication.
router.use(protect);

// Check that the logged-in user is a jobseeker.
const jobseekerOnly = (req, res, next) => {
  if (req.user.role !== "jobseeker") {
    return res.status(403).json({
      message: "Only jobseekers can perform this action."
    });
  }

  next();
};

// Check that the logged-in user is a recruiter.
const recruiterOnly = (req, res, next) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({
      message: "Only recruiters can perform this action."
    });
  }

  next();
};

// POST /api/applications/:jobId
// Apply for an active job.
router.post("/:jobId", jobseekerOnly, async (req, res) => {
  try {
    const { jobId } = req.params;
    const coverLetter =
      typeof req.body.coverLetter === "string"
        ? req.body.coverLetter.trim()
        : "";

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        message: "Invalid job ID."
      });
    }

    if (coverLetter.length > 2000) {
      return res.status(400).json({
        message: "Cover letter must be 2000 characters or fewer."
      });
    }

    const job = await Job.findOne({
      _id: jobId,
      isActive: true
    });

    if (!job) {
      return res.status(404).json({
        message: "This job is unavailable or no longer active."
      });
    }

    const existingApplication = await Application.findOne({
      applicant: req.user.id,
      job: jobId
    });

    if (existingApplication) {
      return res.status(409).json({
        message: "You have already applied for this job.",
        application: existingApplication
      });
    }

    const application = await Application.create({
      applicant: req.user.id,
      job: jobId,
      coverLetter
    });

    res.status(201).json({
      message: "Your application was submitted successfully.",
      application
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already applied for this job."
      });
    }

    console.error("Submit application error:", error.message);

    res.status(500).json({
      message: "Failed to submit your application."
    });
  }
});

// GET /api/applications/my-applications
// View the logged-in candidate's applications.
router.get(
  "/my-applications",
  jobseekerOnly,
  async (req, res) => {
    try {
      const applications = await Application.find({
        applicant: req.user.id
      })
        .populate({
          path: "job",
          populate: {
            path: "recruiter",
            select: "name"
          }
        })
        .sort({ createdAt: -1 });

      res.json({
        totalApplications: applications.length,
        applications
      });
    } catch (error) {
      console.error("Fetch applications error:", error.message);

      res.status(500).json({
        message: "Failed to fetch your applications."
      });
    }
  }
);

// DELETE /api/applications/:applicationId
// Withdraw an application while the job is still active.
router.delete(
  "/:applicationId",
  jobseekerOnly,
  async (req, res) => {
    try {
      const { applicationId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(applicationId)) {
        return res.status(400).json({
          message: "Invalid application ID."
        });
      }

      const application = await Application.findOne({
        _id: applicationId,
        applicant: req.user.id
      }).populate("job", "isActive");

      if (!application) {
        return res.status(404).json({
          message: "Application not found."
        });
      }

      if (!application.job || !application.job.isActive) {
        return res.status(400).json({
          message: "You cannot withdraw an application for an inactive job."
        });
      }

      if (application.status === "Shortlisted") {
        return res.status(400).json({
          message: "Please contact the recruiter to withdraw this application."
        });
      }

      await Application.deleteOne({ _id: application._id });

      res.json({
        message: "Application withdrawn successfully."
      });
    } catch (error) {
      console.error("Withdraw application error:", error.message);

      res.status(500).json({
        message: "Failed to withdraw your application."
      });
    }
  }
);

// GET /api/applications/recruiter
// View applications submitted to jobs owned by the recruiter.
router.get("/recruiter", recruiterOnly, async (req, res) => {
  try {
    const recruiterJobs = await Job.find({
      recruiter: req.user.id
    }).select("_id");

    const jobIds = recruiterJobs.map((job) => job._id);

    const applications = await Application.find({
      job: { $in: jobIds }
    })
      .populate("applicant", "name email")
      .populate("job", "title company location")
      .sort({ createdAt: -1 });

    res.json({
      totalApplications: applications.length,
      applications
    });
  } catch (error) {
    console.error("Recruiter applications error:", error.message);

    res.status(500).json({
      message: "Failed to fetch recruiter applications."
    });
  }
});

// PATCH /api/applications/:applicationId/status
// Update an application status for a job owned by the recruiter.
router.patch(
  "/:applicationId/status",
  recruiterOnly,
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { status } = req.body;

      const allowedStatuses = [
        "Under Review",
        "Shortlisted",
        "Rejected"
      ];

      if (!mongoose.Types.ObjectId.isValid(applicationId)) {
        return res.status(400).json({
          message: "Invalid application ID."
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Choose a valid application status."
        });
      }

      const application = await Application.findById(
        applicationId
      ).populate("job", "recruiter");

      if (!application || !application.job) {
        return res.status(404).json({
          message: "Application not found."
        });
      }

      if (
        application.job.recruiter.toString() !== req.user.id
      ) {
        return res.status(403).json({
          message: "You cannot update applications for another recruiter's job."
        });
      }

      application.status = status;
      await application.save();

      res.json({
        message: "Application status updated successfully.",
        application
      });
    } catch (error) {
      console.error("Update application status error:", error.message);

      res.status(500).json({
        message: "Failed to update application status."
      });
    }
  }
);


/* GET /api/applications/analytics
   Recruiter hiring analytics */
router.get("/analytics", recruiterOnly, async (req, res) => {
  try {
    const jobs = await Job.find({
      recruiter: req.user.id
    }).select("_id isActive");

    const jobIds = jobs.map((job) => job._id);

    const [totalApplications, statusCounts] = await Promise.all([
      Application.countDocuments({
        job: { $in: jobIds }
      }),

      Application.aggregate([
        {
          $match: {
            job: { $in: jobIds }
          }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const counts = {
      Applied: 0,
      "Under Review": 0,
      Shortlisted: 0,
      Rejected: 0
    };

    statusCounts.forEach((item) => {
      counts[item._id] = item.count;
    });

    res.json({
      totalJobs: jobs.length,
      activeJobs: jobs.filter((job) => job.isActive).length,
      inactiveJobs: jobs.filter((job) => !job.isActive).length,
      totalApplications,
      shortlisted: counts.Shortlisted,
      rejected: counts.Rejected,
      underReview: counts["Under Review"],
      applied: counts.Applied,
      statusBreakdown: counts
    });
  } catch (error) {
    console.error("Recruiter analytics error:", error.message);

    res.status(500).json({
      message: "Failed to load recruiter analytics."
    });
  }
});


module.exports = router;
