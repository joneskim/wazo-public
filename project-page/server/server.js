const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/api/beta-signup', async (req, res) => {
  const { email, background } = req.body;
  
  try {
    // Email to you (admin)
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Beta Tester Signup',
      html: `
        <h3>New Beta Tester Registration</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Note Organization Challenges:</strong></p>
        <p>${background || 'No response provided'}</p>
      `
    });

    // Confirmation email to the user
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to wazo.space Beta Program',
      html: `
        <h3>Thanks for Your Interest in wazo.space!</h3>
        <p>We've received your beta program registration. We'll keep you updated on our progress and let you know when you can start testing.</p>
        <p>Best regards,<br>The wazo.space Team</p>
      `
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to process signup' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
