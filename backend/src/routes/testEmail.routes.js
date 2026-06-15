const express = require("express");
const router = express.Router();

const { sendEmail } = require("../services/email.service");

router.get("/send", async (req, res) => {
  try {
    await sendEmail({
      to: "YOUR_EMAIL@gmail.com",
      subject: "AWS SES Test",
      html: `
        <h1>GharKaPaisa</h1>
        <p>Email service is working successfully.</p>
      `
    });

    res.json({
      success: true,
      message: "Email sent"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
