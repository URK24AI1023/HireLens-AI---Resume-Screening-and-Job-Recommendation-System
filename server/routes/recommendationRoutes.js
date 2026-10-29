
const express = require("express");
const Resume = require("../models/Resume");
const Job = require("../models/Job");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

const normalizeList = (values) => [
  ...new Set(
    (Array.isArray(values) ? values : [])
      .map(normalize)
      .filter(Boolean)
  )
];

const ANY_LOCATION_VALUES = [
  "",
  "any city",
  "any location",
  "anywhere"
];

// GET: Generate ranked job recommendations for a job seeker
router.get("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "jobseeker") {
      return res.status(403).json({
        message: "Only job seekers can receive recommendations"
      });
    }

    // Find the latest resume belonging to this user
    const resume = await Resume.findOne({
      user: req.user.id
    }).sort({ uploadedAt: -1 });

    if (!resume) {
      return res.status(404).json({
        message: "Upload a resume to receive job recommendations"
      });
    }

    // Retrieve active jobs
    const jobs = await Job.find({
      isActive: true
    }).populate("recruiter", "name");

    // Candidate skills and saved preferences
    const resumeSkills = new Set(
      normalizeList(resume.skills)
    );

    const currentLocation = (resume.currentLocation || "").trim();
    const preferredLocation = (resume.preferredLocation || "").trim();
    const willingToRelocate = resume.willingToRelocate === true;
    const willingToLearn = resume.willingToLearn === true;

    const preferredLocationIsAny =
      ANY_LOCATION_VALUES.includes(normalize(preferredLocation));

    // Score every job
    const recommendations = jobs.map((job) => {
      // ------------------------------------
      // 1. SKILL MATCH SCORE: 60% WEIGHT
      // ------------------------------------
      const requiredSkills = normalizeList(job.requiredSkills);

      const matchedSkills = requiredSkills.filter((skill) =>
        resumeSkills.has(skill)
      );

      const missingSkills = requiredSkills.filter(
        (skill) => !resumeSkills.has(skill)
      );

      const matchScore =
        requiredSkills.length === 0
          ? 0
          : Math.round(
              (matchedSkills.length / requiredSkills.length) * 100
            );

      const skillPoints = matchScore * 0.60;

      // ------------------------------------
      // 2. LOCATION COMPATIBILITY: 25%
      // ------------------------------------
      const jobLocation = (job.location || "").trim();
      const normalizedJobLocation = normalize(jobLocation);
      const normalizedCurrentLocation = normalize(currentLocation);

      const isRemoteJob =
        normalizedJobLocation.includes("remote");

      const hasLocationInformation =
        Boolean(jobLocation) && Boolean(currentLocation);

      const matchesCurrentLocation =
        hasLocationInformation &&
        normalizedJobLocation === normalizedCurrentLocation;

      let locationStatus = "unknown";
      let locationPoints = 12.5;
      let locationWarning = null;
      let locationMessage = "";

      if (isRemoteJob) {
        locationStatus = "compatible";
        locationPoints = 25;
        locationMessage = "This job is listed as remote.";
      } else if (matchesCurrentLocation) {
        locationStatus = "compatible";
        locationPoints = 25;
        locationMessage =
          "The job matches your current location.";
      } else if (!jobLocation || !currentLocation) {
        locationStatus = "unknown";
        locationPoints = 12.5;
        locationMessage =
          "Location compatibility is uncertain because location information is missing.";
      } else if (willingToRelocate) {
        locationStatus = "relocation_supported";
        locationPoints = 25;
        locationMessage =
          "You are willing to relocate, so this location difference does not reduce your location score.";
      } else {
        locationStatus = "mismatch";
        locationPoints = 0;
        locationWarning =
          `This job is in ${jobLocation}, while your current location is ${currentLocation}.`;
        locationMessage =
          "Check the location requirements before applying.";
      }

      // ------------------------------------
      // 3. PREFERRED LOCATION: 15% WEIGHT
      // ------------------------------------
      let preferencePoints = 0;
      let preferenceStatus = "not_matched";
      let preferenceMessage = "";

      if (preferredLocationIsAny) {
        preferencePoints = 15;
        preferenceStatus = "flexible";
        preferenceMessage =
          "You are open to jobs in any location.";
      } else if (isRemoteJob) {
        preferencePoints = 15;
        preferenceStatus = "compatible";
        preferenceMessage =
          "This remote job may suit your location preference.";
      } else if (
        jobLocation &&
        normalize(preferredLocation) === normalizedJobLocation
      ) {
        preferencePoints = 15;
        preferenceStatus = "matched";
        preferenceMessage =
          "This job matches your preferred location.";
      } else {
        preferencePoints = 0;
        preferenceStatus = "not_matched";
        preferenceMessage =
          `This job does not match your preferred location: ${preferredLocation}.`;
      }

      // ------------------------------------
      // 4. OVERALL SUITABILITY SCORE
      // ------------------------------------
      const suitabilityScore = Math.round(
        skillPoints + locationPoints + preferencePoints
      );

      // Missing skills are suggestions, not automatic disqualifiers
      const learningSuggestions = willingToLearn
        ? missingSkills
        : [];

      let recommendationLabel = "Explore this opportunity";

      if (suitabilityScore >= 80) {
        recommendationLabel = "Excellent fit";
      } else if (suitabilityScore >= 65) {
        recommendationLabel = "Good fit";
      } else if (suitabilityScore >= 45) {
        recommendationLabel = "Potential fit";
      }

      const reasons = [];

      if (requiredSkills.length > 0) {
        reasons.push(
          `${matchedSkills.length} of ${requiredSkills.length} required skills matched`
        );
      } else {
        reasons.push("The job has no listed required skills");
      }

      if (locationStatus === "compatible") {
        reasons.push("Location compatible");
      } else if (locationStatus === "relocation_supported") {
        reasons.push("Relocation is supported by your preference");
      } else if (locationStatus === "mismatch") {
        reasons.push("Location difference to consider");
      } else {
        reasons.push("Location compatibility is uncertain");
      }

      if (preferenceStatus === "matched") {
        reasons.push("Preferred location matched");
      } else if (preferenceStatus === "flexible") {
        reasons.push("Open to any location");
      }

      return {
        job: {
          id: job._id,
          title: job.title,
          company: job.company,
          location: job.location || "",
          jobType: job.jobType,
          experience: job.experience,
          salary: job.salary,
          description: job.description,
          requiredSkills: job.requiredSkills || [],
          recruiter: job.recruiter?.name || "Recruiter"
        },

        // Keep the actual skill match separate from suitability
        matchScore,
        matchedSkills,
        missingSkills,

        suitabilityScore,
        recommendationLabel,
        recommendationReasons: reasons,

        locationCompatibility: {
          status: locationStatus,
          currentLocation,
          preferredLocation,
          jobLocation,
          willingToRelocate,
          score: locationPoints,
          warning: locationWarning,
          message: locationMessage
        },

        preferenceAnalysis: {
          preferredLocation,
          status: preferenceStatus,
          score: preferencePoints,
          message: preferenceMessage
        },

        learningAnalysis: {
          willingToLearn,
          missingSkills,
          learningSuggestions,
          message: willingToLearn
            ? missingSkills.length > 0
              ? "Consider learning these missing skills to strengthen your application."
              : "All listed required skills were found in your resume."
            : missingSkills.length > 0
              ? "Review the missing skills before applying."
              : "All listed required skills were found in your resume."
        }
      };
    });

    // Highest overall suitability first.
    // Skill match breaks ties between equal suitability scores.
    recommendations.sort(
      (a, b) =>
        b.suitabilityScore - a.suitabilityScore ||
        b.matchScore - a.matchScore
    );

    res.json({
      resume: {
        id: resume._id,
        fileName: resume.originalFileName,
        skills: resume.skills || [],
        currentLocation,
        preferredLocation,
        willingToRelocate,
        willingToLearn
      },

      scoring: {
        skillWeight: 60,
        locationWeight: 25,
        preferenceWeight: 15,
        description:
          "Suitability combines skill match, location compatibility, and preferred location. The skill-match percentage remains independent."
      },

      totalJobs: recommendations.length,
      recommendations
    });
  } catch (error) {
    console.error("Recommendation error:", error.message);

    res.status(500).json({
      message: "Failed to generate job recommendations"
    });
  }
});

module.exports = router;
