import express from "express";
import PCCRegistration from "../models/PCCRegistration.js";
import { PCC_DATA } from "@/app/pcc-registration/PCC.js";

const router = express.Router();


router.post("/register", async (req, res) => {
  try {
    const { fullName, phone, email, courseCode, courseDate } = req.body;
    // Find course by code
    const course = PCC_DATA.find(c => c.code === courseCode);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Seat limit check
    if (course.pax && Number(course.pax) > 0) {
      const currentCount = await PCCRegistration.countDocuments({ courseCode });
      if (currentCount >= course.pax) {
        return res.status(400).json({ message: "Seats are full for this course." });
      }
    }

    // Save registration
    const registration = new PCCRegistration({
      fullName,
      phone,
      email,
      courseCode,
      courseName: course.title,
    });

    await registration.save();
    res.status(201).json({ message: "Registration successful!", registration });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/registrations", async (req, res) => {
  try {
    const registrations = await PCCRegistration.find();
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Single registration by ID
router.get("/registrations/:id", async (req, res) => {
  try {
    const registration = await PCCRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Count registrations for a course (by code)
router.get("/registrations/course/:courseCode/count", async (req, res) => {
  try {
    const { courseCode } = req.params;

    const course = PCC_DATA.find(c => c.code === courseCode);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const count = await PCCRegistration.countDocuments({ courseCode });
    res.json({
      courseCode,
      courseName: course.title,
      totalRegistrations: count,
      maxSeats: course.pax || null,
      seatsAvailable: course.pax ? course.pax - count : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
