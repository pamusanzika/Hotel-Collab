# Contact Form Feature — Implementation Guide

## Overview

The Contact Us form allows visitors (unauthenticated users) to send a message from the landing page. When submitted, the message is emailed to **every active admin** in the system. No login is required — it's a fully public endpoint.

---

## Architecture

```
[Browser]                    [Server]                      [Gmail SMTP]
   |                            |                               |
   |  POST /api/contact         |                               |
   |  {firstName, lastName,     |                               |
   |   email, subject, message} |                               |
   |--------------------------->|                               |
   |                            |  1. Zod validates body        |
   |                            |  2. Query User collection     |
   |                            |     (role=admin, status=active)|
   |                            |  3. Collect admin emails      |
   |                            |  4. sendContactFormEmail()    |
   |                            |------------------------------>|
   |                            |       Email delivered         |
   |   { message: "success" }   |<------------------------------|
   |<---------------------------|                               |
```

---

## Files Created / Modified

### Backend (Server)

| File | Purpose |
|------|---------|
| `server/src/validators/contactValidators.js` | **New** — Zod schema for input validation |
| `server/src/controllers/contactController.js` | **New** — Business logic (find admins, send email) |
| `server/src/routes/contact.js` | **New** — Express route definition |
| `server/src/routes/index.js` | **Modified** — Mounted `/contact` route |
| `server/src/services/emailService.js` | **Modified** — Added `sendContactFormEmail()` |

### Frontend (Client)

| File | Purpose |
|------|---------|
| `client/src/components/landing/Contactus.js` | **New** — React form component with API integration |
| `client/src/pages/Landing.js` | **Modified** — Added `<Contactus />` to page |
| `client/src/components/landing/Header.js` | **Modified** — Nav link points to `#contact` anchor |

---

## Backend Breakdown

### 1. Validation — `contactValidators.js`

**Library:** [Zod](https://zod.dev/) (same as rest of codebase)

```js
const contactFormSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName:  z.string().trim().min(1).max(50),
  email:     z.string().trim().email(),
  subject:   z.string().trim().min(1).max(150),
  message:   z.string().trim().min(10).max(2000),
});
```

**Why Zod?** The project already uses Zod for all validation (auth, hotels, campaigns, chat). The `validate()` middleware in `server/src/middleware/validate.js` takes any Zod schema and returns `400` with field-level errors if parsing fails. This keeps validation consistent across all endpoints.

**Key constraints:**
- `email` must be a valid email format
- `message` requires at least 10 characters (prevents spam-like single-word submissions)
- `max` limits prevent oversized payloads

---

### 2. Controller — `contactController.js`

```js
exports.submitContactForm = async (req, res) => {
  // 1. Extract validated fields from body
  const { firstName, lastName, email, subject, message } = req.body;

  // 2. Find all active admins
  const admins = await User.find(
    { role: 'admin', status: 'active' },
    { email: 1, _id: 0 }    // projection: only return email field
  ).lean();

  // 3. Send email to all admins
  const adminEmails = admins.map((a) => a.email);
  await sendContactFormEmail({ firstName, lastName, email, subject, message }, adminEmails);

  res.json({ message: 'Your message has been sent successfully.' });
};
```

**Why query `User` instead of a hardcoded email?**
- Admins can be added/removed dynamically via the admin invite system
- Every active admin receives the message — no config changes needed when the team grows
- Uses `{ role: 'admin', status: 'active' }` to skip banned or pending admins
- `.lean()` returns plain JS objects instead of Mongoose documents (faster, less memory)

**No authentication middleware** is applied to this route — it's intentionally public so any visitor can reach out.

---

### 3. Route — `contact.js`

```js
router.post('/', validate(contactFormSchema), submitContactForm);
```

**Middleware chain:**
1. `validate(contactFormSchema)` — Rejects malformed requests with 400
2. `submitContactForm` — Processes the valid request

Mounted in `routes/index.js` as:
```js
router.use('/contact', contactRoutes);
```

Final endpoint: **`POST /api/contact`**

---

### 4. Email Service — `sendContactFormEmail()`

**Library:** [Nodemailer](https://nodemailer.com/) (already configured in the project)

```js
const sendContactFormEmail = async (formData, adminEmails) => {
  // Formats data as an HTML table
  // Sends to all admin emails (comma-joined in "to" field)
  await sendMail({
    to: adminEmails.join(','),
    subject: `Contact Form: ${formData.subject}`,
    html: /* formatted HTML table */,
  });
};
```

**How the email transport works:**
- The project uses Gmail SMTP (`smtp.gmail.com:587`) configured in `.env`
- `SMTP_USER` and `SMTP_PASS` (Gmail app-specific password) authenticate the sender
- If SMTP credentials are missing (dev mode), it falls back to `console.log`
- The shared `sendMail()` helper wraps `transporter.sendMail()` so all email functions share one transport

**Email format:** A clean HTML table with rows for Name, Email (clickable `mailto:` link), Subject, and Message. Styled with alternating row backgrounds for readability.

---

## Frontend Breakdown

### Contactus.js Component

**Libraries used:**
- **styled-components** — CSS-in-JS (consistent with all landing page components)
- **Axios** (`api` instance from `client/src/api/axios.js`) — HTTP client with base URL preconfigured

#### State Management

```js
const [form, setForm] = useState({
  firstName: '', lastName: '', email: '', subject: '', message: ''
});
const [status, setStatus] = useState('idle');   // idle | loading | success | error
const [errorMsg, setErrorMsg] = useState('');
```

Three pieces of state:
- `form` — Controlled input values (two-way binding)
- `status` — Tracks submission lifecycle for UI feedback
- `errorMsg` — Stores server error message if the request fails

#### Form Submission

```js
const handleSubmit = async (e) => {
  e.preventDefault();
  setStatus('loading');
  try {
    await api.post('/contact', form);
    setStatus('success');
    setForm({ /* reset all fields */ });
    setTimeout(() => setStatus('idle'), 4000);
  } catch (err) {
    setStatus('error');
    setErrorMsg(err.response?.data?.error || 'Failed to send message.');
    setTimeout(() => setStatus('idle'), 4000);
  }
};
```

**UX flow:**
1. Button shows "Sending..." and is disabled during the request
2. On success → green banner appears, form fields clear, banner disappears after 4s
3. On error → red banner shows the server error message, disappears after 4s

#### Styling Patterns

The component follows the exact same visual language as `Aboutus.js`:
- **Two-column grid** (`1fr 1fr`) that collapses to single column on mobile
- **Gradient blobs** — Decorative radial gradients with `blur(50px)` for depth
- **Glassmorphism form card** — `backdrop-filter: blur(16px)` with semi-transparent background
- **`fadeInUp` animation** — Elements slide up from 24px below with opacity transition
- **Theme tokens** — All colors, fonts, spacing, radii come from `client/src/styles/theme.js`

#### Left Column Content
- Heading ("Get in Touch With Us")
- Description paragraph
- Three contact info items (Email, Phone, Location) with colored icon circles using the brand palette:
  - Indigo (`#6366F1`) for email
  - Pink (`#FB7185`) for phone
  - Teal (`#14B8A6`) for location

#### Right Column Content
- Form card with: First Name + Last Name (side by side), Email, Subject, Message (textarea)
- Submit button using the shared `Button` component (`$variant="primary"`)
- Success/Error feedback messages

---

## Navigation Integration

The Header component's "Contact Us" link uses anchor scrolling:

```jsx
<NavLink href="#contact">Contact Us</NavLink>
```

The Contactus section has `id="contact"`:

```jsx
<Section id="contact">
```

Clicking "Contact Us" in the nav smoothly scrolls to the contact form section.

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Input validation | Zod schema rejects malformed data server-side |
| XSS in emails | HTML email uses static template structure; user input is placed in table cells (email clients sanitize HTML) |
| Rate limiting | Global rate limiter (100 req/15min in production) applies to this endpoint |
| NoSQL injection | `express-mongo-sanitize` middleware strips `$` operators from request body |
| Spam prevention | Could add reCAPTCHA in the future if needed |

---

## Environment Variables Used

| Variable | Purpose |
|----------|---------|
| `SMTP_HOST` | Gmail SMTP server (`smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (`587` for TLS) |
| `SMTP_USER` | Gmail account used as sender |
| `SMTP_PASS` | Gmail app-specific password |
| `EMAIL_FROM` | "From" address shown in emails |
