const User = require('../models/User');
const { sendContactFormEmail } = require('../services/emailService');

exports.submitContactForm = async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    // Fetch all active admin emails
    const admins = await User.find(
      { role: 'admin', status: 'active' },
      { email: 1, _id: 0 }
    ).lean();

    const adminEmails = admins.map((a) => a.email);

    await sendContactFormEmail({ fullName, email, phone, message }, adminEmails);

    res.json({ message: 'Your message has been sent successfully.' });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
};
