
const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Resume = require("../models/Resume");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Store uploaded PDFs in memory temporarily
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  }
});

// Extract common technical skills from resume text
const extractSkills = (text) => {
  const skillList = [
    "Python",
    "Java",
    "JavaScript",
    "React",
    "Node.js",
    "Express",
    "MongoDB",
    "SQL",
    "HTML",
    "CSS",
    "Machine Learning",
    "Deep Learning",
    "Data Analysis",
    "Pandas",
    "NumPy",
    "TensorFlow",
    "PyTorch",
    "Git",
    "AWS",
    "Docker",
    "C++",
    "C",
    "Excel"
  ];

  return skillList.filter((skill) => {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escapedSkill}\\b`, "i");
    return pattern.test(text);
  });
};

// POST: Upload and process a resume
router.post(
  "/upload",
  protect,
  upload.single("resume"),
  async (req, res) => {
    try {
      if (req.user.role !== "jobseeker") {
        return res.status(403).json({
          message: "Only job seekers can upload resumes"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Please select a PDF resume"
        });
      }

      const parsedPdf = await pdfParse(req.file.buffer);
      const extractedText = parsedPdf.text.trim();

      if (!extractedText) {
        return res.status(400).json({
          message:
            "No selectable text found. Scanned resumes require OCR support."
        });
      }

      const skills = extractSkills(extractedText);

      // Read candidate preferences from the upload form
      const currentLocation =
        (req.body.currentLocation || "").trim();

      const preferredLocation =
        (req.body.preferredLocation || "").trim();

      const willingToRelocate =
        req.body.willingToRelocate === "true";

      const willingToLearn =
        req.body.willingToLearn === "true";

      const resume = await Resume.create({
        user: req.user.id,
        originalFileName: req.file.originalname,
        extractedText,
        skills,
        currentLocation,
        preferredLocation,
        willingToRelocate,
        willingToLearn
      });

      res.status(201).json({
        message: "Resume uploaded successfully",
        resume: {
          id: resume._id,
          originalFileName: resume.originalFileName,
          skills: resume.skills,
          currentLocation: resume.currentLocation,
          preferredLocation: resume.preferredLocation,
          willingToRelocate: resume.willingToRelocate,
          willingToLearn: resume.willingToLearn,
          uploadedAt: resume.uploadedAt
        }
      });
    } catch (error) {
      console.error("Resume upload error:", error.message);

      res.status(500).json({
        message: "Resume processing failed. Please try another PDF."
      });
    }
  }
);

// GET: View the logged-in job seeker's resumes
router.get("/my-resumes", protect, async (req, res) => {
  try {
    if (req.user.role !== "jobseeker") {
      return res.status(403).json({
        message: "Only job seekers can view their resumes"
      });
    }

    const resumes = await Resume.find({
      user: req.user.id
    })
      .select("-extractedText")
      .sort({ uploadedAt: -1 });

    res.json(resumes);
  } catch (error) {
    console.error("Fetch resumes error:", error.message);

    res.status(500).json({
      message: "Failed to fetch resumes"
    });
  }
});

module.exports = router;
