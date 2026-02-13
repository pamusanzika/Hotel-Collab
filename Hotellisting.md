# Hotel Listing Feature - Development Documentation

## Overview

The Hotel Listing feature allows hotel owners to create, edit, preview, and manage their hotel listings within the Influspark platform. It replaces the original simple modal-based form with a full-page, multi-section form that supports image uploads, collaboration type selection, availability scheduling, and a preview-before-submit flow.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Backend Changes](#backend-changes)
3. [Frontend Changes](#frontend-changes)
4. [Key Functions Explained](#key-functions-explained)
5. [Image Upload Flow](#image-upload-flow)
6. [Bug Fixes](#bug-fixes)
7. [File Reference](#file-reference)

---

## Architecture

### Tech Stack Used

| Layer    | Technology                  | Why                                                              |
| -------- | --------------------------- | ---------------------------------------------------------------- |
| Frontend | React 18 + Styled Components | Matches existing project patterns; CSS-in-JS for scoped styling |
| Backend  | Express.js + Mongoose       | Existing API framework; MongoDB ODM for schema validation        |
| Uploads  | Multer                      | Industry-standard Express middleware for handling `multipart/form-data` file uploads |
| Validation | Zod (server) + custom (client) | Zod already used in the project for server-side schema validation; client uses inline validation for immediate user feedback |

### Request Flow

```
React Form (FormData)
  -> Axios (auto Content-Type with boundary)
    -> Express Route (Multer parses files)
      -> Controller (builds image URLs, parses JSON fields)
        -> Mongoose Model (validates & saves to MongoDB)
          -> Response (hotel object with image paths)
```

---

## Backend Changes

### 1. Hotel Model (`server/src/models/Hotel.js`)

**What changed:** Added four new fields to the Mongoose schema.

```js
city: { type: String, trim: true, default: '' }
featureImage: { type: String, default: '' }
collaborationTypes: [{ type: String, enum: ['free_stay', 'discount_stay', 'paid_collaboration'] }]
availability: {
  status: { type: String, enum: ['available', 'unavailable'], default: 'available' },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null }
}
```

**Why:**
- `city` - Separated from `location` for better filtering and search capabilities. Location holds the street address, city holds the city name.
- `featureImage` - Stores the URL of the image chosen as the primary display image. This is stored as a full path (e.g., `/uploads/hotels/123.jpg`) rather than an index, so it remains valid even if the images array changes.
- `collaborationTypes` - An array with enum validation ensures only valid collaboration types are stored. Using an array allows hotels to offer multiple types simultaneously.
- `availability` - A nested object with status enum and optional date range. The status field enables quick filtering (available/unavailable), while dates allow time-bound availability.

### 2. Validators (`server/src/validators/hotelValidators.js`)

**What changed:** Extended the Zod schema with the new fields.

```js
city: z.string().max(200).optional().default('')
featureImage: z.string().optional().default('')
collaborationTypes: z.array(z.enum(['free_stay', 'discount_stay', 'paid_collaboration'])).optional().default([])
availability: z.object({
  status: z.enum(['available', 'unavailable']).optional().default('available'),
  startDate: z.string().nullable().optional().default(null),
  endDate: z.string().nullable().optional().default(null)
}).optional().default({})
```

**Why Zod:** Already used in the project for request validation. Zod provides type-safe schema validation with clear error messages. The `optional().default()` pattern ensures backward compatibility with existing hotels that don't have these fields.

### 3. Hotel Controller (`server/src/controllers/hotelController.js`)

#### `create` function

**What it does:** Handles creating a new hotel with image uploads.

```js
exports.create = async (req, res) => {
  // 1. Map uploaded files to URL paths
  const images = req.files
    ? req.files.map((f) => `/uploads/hotels/${f.filename}`)
    : [];

  // 2. Destructure and parse FormData fields
  const { featureImage, collaborationTypes, availability, ...rest } = req.body;

  // 3. Parse JSON-stringified fields (FormData sends everything as strings)
  const parsedCollabTypes = typeof collaborationTypes === 'string'
    ? JSON.parse(collaborationTypes) : collaborationTypes || [];

  const parsedAvailability = typeof availability === 'string'
    ? JSON.parse(availability) : availability || {};

  // 4. Create hotel with resolved feature image URL
  const hotel = await Hotel.create({
    ...rest,
    images,
    featureImage: images[Number(featureImage)] || images[0] || '',
    collaborationTypes: parsedCollabTypes,
    availability: parsedAvailability,
    ownerId: req.user._id,
  });
};
```

**Why parse JSON strings:** When sending `FormData`, all values are transmitted as strings. Complex data like arrays (`collaborationTypes`) and objects (`availability`) must be JSON-stringified on the client and parsed on the server.

**Why `images[Number(featureImage)]`:** The client sends the feature image as an index (e.g., `"2"`). The controller resolves this to the actual URL from the uploaded images array, so the database stores the full path rather than a fragile index.

#### `update` function

**What it does:** Handles editing a hotel, merging existing images with newly uploaded ones.

```js
exports.update = async (req, res) => {
  // 1. Find existing hotel (ownership check via ownerId)
  const existing = await Hotel.findOne({ _id: req.params.id, ownerId: req.user._id });

  // 2. Determine which existing images the owner kept
  const kept = existingImages
    ? (typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages)
    : existing.images;

  // 3. Map newly uploaded files
  const newUploads = req.files
    ? req.files.map((f) => `/uploads/hotels/${f.filename}`)
    : [];

  // 4. Merge and cap at 5 images
  const images = [...kept, ...newUploads].slice(0, 5);

  // 5. Update with Object.assign and save
  Object.assign(existing, { ...rest, images, featureImage, collaborationTypes, availability });
  await existing.save();
};
```

**Why `Object.assign` + `save()` instead of `findOneAndUpdate`:** Using `Object.assign` on the Mongoose document then calling `save()` triggers Mongoose validators and middleware hooks. `findOneAndUpdate` would bypass some of these protections.

**Why merge `kept` + `newUploads`:** When editing, the owner may remove some existing images and add new ones. The client sends `existingImages` (an array of URLs the owner chose to keep) and new files. Merging them preserves the owner's choices while adding new uploads.

### 4. Routes (`server/src/routes/hotels.js`)

**What changed:** Added Multer middleware for file uploads on POST and PUT routes.

```js
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/hotels'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(ext && mime ? null : new Error('...'), ext && mime);
  },
});

router.post('/', upload.array('images', 5), hotels.create);
router.put('/:id', upload.array('images', 5), hotels.update);
```

**Why Multer:**
- Handles `multipart/form-data` parsing which `express.json()` cannot do
- `diskStorage` saves files to the local filesystem with unique names to prevent collisions
- `fileFilter` validates file types at the middleware level, rejecting invalid files before they reach the controller
- `limits.fileSize` prevents excessively large uploads (5MB per file)
- `upload.array('images', 5)` accepts up to 5 files under the field name `images`

**Why unique filenames (`Date.now() + random`):** Prevents filename collisions when multiple users upload files with the same name simultaneously.

### 5. Static File Serving (`server/src/app.js`)

```js
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));
```

**Why `Cross-Origin-Resource-Policy: cross-origin`:** Helmet (the security middleware) sets `Cross-Origin-Resource-Policy: same-origin` by default. Since the React dev server runs on port 3000 and Express on port 5001, the browser blocks cross-origin resource loading. This middleware overrides the header specifically for the `/uploads` route so images can be loaded by the React app.

**Why not disable Helmet globally:** Keeping Helmet's defaults for all other routes maintains security. Only the uploads route needs the relaxed policy.

---

## Frontend Changes

### 1. AddHotelListing Page (`client/src/pages/owner/AddHotelListing.js`)

A full-page form with four card sections and a preview modal.

#### Form Sections

| Section | Fields | Validation |
|---------|--------|------------|
| Basic Details | Hotel Name, Location, City, Description | Name, Location, City required |
| Hotel Images | Drag-and-drop upload zone, image grid with feature selection | At least 1 image required |
| Collaboration Types | Checkbox group (Free Stay, Discount Stay, Paid Collaboration) | At least 1 type required |
| Availability | Available/Unavailable toggle, optional date range | End date must be after start date |

#### Key Functions

**`onChange(e)`** - Updates form state and clears field-specific errors on input change. Uses the `[e.target.name]` computed property pattern to handle all text inputs with a single handler.

**`handleFiles(fileList)`** - Processes selected/dropped files:
```js
const handleFiles = (fileList) => {
  // 1. Filter to only valid image types
  const incoming = Array.from(fileList).filter((f) =>
    /image\/(jpeg|jpg|png|webp)/.test(f.type)
  );
  // 2. Calculate remaining slots (max 5)
  const remaining = 5 - images.length;
  if (remaining <= 0) return;
  // 3. Create preview URLs for immediate display
  const toAdd = incoming.slice(0, remaining).map((file) => ({
    file,
    preview: URL.createObjectURL(file),
  }));
  setImages((prev) => [...prev, ...toAdd]);
};
```

**Why `URL.createObjectURL`:** Creates a temporary browser URL pointing to the file in memory. This allows showing image previews immediately without uploading to the server first. The URLs are revoked when images are removed to prevent memory leaks.

**`removeImage(idx)`** - Removes an image and adjusts the feature index:
```js
const removeImage = (idx) => {
  URL.revokeObjectURL(images[idx].preview);  // Free memory
  const next = images.filter((_, i) => i !== idx);
  setImages(next);
  // Adjust feature index if needed
  if (featureIndex === idx) setFeatureIndex(0);
  else if (featureIndex > idx) setFeatureIndex(featureIndex - 1);
};
```

**Why adjust `featureIndex`:** If the removed image was before the feature image in the array, all subsequent indices shift down by one. Without adjustment, the wrong image would be marked as featured.

**`validate()`** - Performs client-side validation before allowing preview:
```js
const validate = () => {
  const errs = {};
  if (!form.name.trim()) errs.name = 'Hotel name is required';
  if (!form.location.trim()) errs.location = 'Location is required';
  if (!form.city.trim()) errs.city = 'City is required';
  if (images.length === 0) errs.images = 'Upload at least one image';
  if (collabTypes.length === 0) errs.collabTypes = 'Select at least one collaboration type';
  // Date range validation
  if (availability.startDate && availability.endDate && availability.startDate > availability.endDate) {
    errs.dates = 'End date must be after start date';
  }
  setErrors(errs);
  return Object.keys(errs).length === 0;
};
```

**Why client-side validation:** Provides immediate feedback without a server round-trip. The server also validates via the Mongoose schema, but client-side validation improves UX.

**`handleSubmit()`** - Builds FormData and sends to the API:
```js
const handleSubmit = async () => {
  const data = new FormData();
  data.append('name', form.name.trim());
  // ... other text fields
  data.append('collaborationTypes', JSON.stringify(collabTypes));
  data.append('availability', JSON.stringify({...}));
  data.append('featureImage', String(featureIndex));
  images.forEach((img) => data.append('images', img.file));
  await api.post('/hotels', data);
};
```

**Why FormData instead of JSON:** File uploads require `multipart/form-data` encoding. `FormData` is the browser API for building multipart requests. JSON cannot transport binary file data.

**Why `JSON.stringify` for arrays/objects:** FormData only supports string values. Complex structures must be serialized to JSON strings and parsed on the server.

#### Drag and Drop

```jsx
<UploadZone
  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
  onDragLeave={() => setIsDragging(false)}
  onDrop={onDrop}
>
```

**Why `e.preventDefault()` on dragOver:** The browser's default behavior is to open the dropped file. Preventing default tells the browser we want to handle the drop ourselves.

**Why `$isDragging` state:** Provides visual feedback (border color change) when the user drags files over the upload zone, confirming the drop target is active.

### 2. EditHotelListing Page (`client/src/pages/owner/EditHotelListing.js`)

Similar to AddHotelListing but with pre-populated data and dual image tracking.

#### Key Differences from Add

**Dual image state:**
```js
const [existingImages, setExistingImages] = useState([]);  // Server URLs
const [newImages, setNewImages] = useState([]);              // Local files

const allImages = [
  ...existingImages.map((url) => ({ type: 'existing', url, preview: `${API_BASE}${url}` })),
  ...newImages.map((img) => ({ type: 'new', file: img.file, preview: img.preview })),
];
```

**Why two arrays:** Existing images are server URLs (e.g., `/uploads/hotels/123.jpg`) while new images are local `File` objects with `createObjectURL` previews. They need different handling during submission - existing images are sent as a JSON array of URLs, new images are sent as file uploads.

**Data loading with `useEffect`:**
```js
useEffect(() => {
  const load = async () => {
    const { data } = await api.get(`/hotels/${id}`);
    const h = data.hotel;
    setForm({ name: h.name, location: h.location, city: h.city, description: h.description });
    setExistingImages(h.images || []);
    setCollabTypes(h.collaborationTypes || []);
    // Resolve feature index from URL back to array index
    if (h.featureImage && h.images?.length) {
      const idx = h.images.indexOf(h.featureImage);
      setFeatureIndex(idx >= 0 ? idx : 0);
    }
  };
  load();
}, [id]);
```

**Why resolve feature index:** The database stores the feature image as a URL, but the form needs an index for the selection UI. `indexOf` converts the URL back to its position in the images array.

### 3. HotelPreview Page (`client/src/pages/owner/HotelPreview.js`)

A read-only hotel profile view with an image gallery.

#### Layout Structure

```
PageHeader ("Hotel Profile")
Hero Image (large, shows selected/active image)
Thumbnail Strip (clickable row to switch hero image)
Title + Location
Photos Section (grid of all images, feature image highlighted)
About this Hotel (description)
Details Grid:
  - Collaboration Types (badges)
  - Availability (status + date range)
  - Listing Status (Active/Inactive)
  - Listed On (creation date)
Action Buttons (Back to Hotels, Edit Listing)
```

#### Interactive Image Gallery

```js
const [activeImg, setActiveImg] = useState(0);
const displayIdx = activeImg < images.length ? activeImg : 0;
```

Clicking a thumbnail or a photo in the grid updates `activeImg`, which changes the hero image at the top. This provides a gallery-like browsing experience.

**Feature image detection:**
```js
const featureIdx = hotel.featureImage
  ? images.indexOf(hotel.featureImage)
  : 0;
```

The feature image URL is matched against the images array to find its index, which is used to show the "Feature" badge on the correct image.

### 4. OwnerHotels Page (`client/src/pages/owner/OwnerHotels.js`)

**What changed:**
- Removed the old modal-based add form (Modal, Form, InputWrapper imports removed)
- "Add Hotel" button now navigates to `/owner/hotels/add`
- Added "Preview" button (navigates to `/owner/hotels/preview/:id`)
- Fixed "Edit" button (navigates to `/owner/hotels/edit/:id`)
- Hotel list now shows city alongside location

### 5. App.js Routes (`client/src/App.js`)

```jsx
<Route path="hotels" element={<OwnerHotels />} />
<Route path="hotels/add" element={<AddHotelListing />} />
<Route path="hotels/edit/:id" element={<EditHotelListing />} />
<Route path="hotels/preview/:id" element={<HotelPreview />} />
```

All routes are nested under the `/owner` protected route, ensuring only authenticated hotel owners can access them.

---

## Image Upload Flow

### Upload Process (Step by Step)

```
1. User selects/drops files in UploadZone
     |
2. handleFiles() filters valid types (JPEG, PNG, WebP)
     |
3. URL.createObjectURL() creates preview URLs
     |
4. Images displayed in grid with feature selection
     |
5. User clicks "Preview Listing" -> validate() checks all fields
     |
6. Preview modal shows all data for review
     |
7. User clicks "Submit Listing"
     |
8. handleSubmit() builds FormData with files + JSON fields
     |
9. Axios sends POST /hotels (Content-Type auto-set by browser)
     |
10. Multer parses files -> saves to /server/uploads/hotels/
     |
11. Controller maps files to URL paths -> stores in MongoDB
     |
12. Navigate back to /owner/hotels
```

### Image Display Process

```
1. Component loads -> GET /hotels/:id
     |
2. hotel.images = ["/uploads/hotels/123.jpg", "/uploads/hotels/456.jpg", ...]
     |
3. Each image rendered as: <img src={`${API_BASE}${imagePath}`} />
     = <img src="http://localhost:5001/uploads/hotels/123.jpg" />
     |
4. Express serves static file from /server/uploads/hotels/
     with Cross-Origin-Resource-Policy: cross-origin header
```

---

## Bug Fixes

### 1. Images Not Displaying (Helmet CORS Block)

**Problem:** After uploading, images returned 200 from the server but the browser blocked rendering.

**Root Cause:** Helmet sets `Cross-Origin-Resource-Policy: same-origin` by default. Since React (port 3000) and Express (port 5001) are different origins, the browser refused to render the images.

**Fix:** Added middleware on the `/uploads` route to set `Cross-Origin-Resource-Policy: cross-origin`.

### 2. Only One Image Uploading (Content-Type Header)

**Problem:** Only the feature image (first image) was being saved; the rest were lost.

**Root Cause:** The Axios instance had a default `Content-Type: application/json` header. When sending FormData, the browser needs to set `Content-Type: multipart/form-data; boundary=----xxxx` automatically. The default header was overriding this, causing Multer to receive malformed data and parse only one file.

**Fix:** Added a request interceptor that detects FormData and removes the Content-Type header:
```js
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});
```

### 3. Edit Button Not Working

**Problem:** The Edit button in the hotel list had no `onClick` handler.

**Fix:** Added navigation to `/owner/hotels/edit/:id` and created the EditHotelListing page.

### 4. No Hotel Profile Preview

**Problem:** No way to view a hotel's full profile after creation.

**Fix:** Created the HotelPreview page with hero image gallery, all photos grid section, and full hotel details display. Added a "Preview" button to each hotel row.

---

## File Reference

### Backend Files Modified/Created

| File | Change |
|------|--------|
| `server/src/models/Hotel.js` | Added `city`, `featureImage`, `collaborationTypes`, `availability` fields |
| `server/src/validators/hotelValidators.js` | Added Zod validation for new fields |
| `server/src/controllers/hotelController.js` | Updated `create` and `update` to handle multipart uploads |
| `server/src/routes/hotels.js` | Added Multer middleware on POST and PUT routes |
| `server/src/app.js` | Added static file serving with CORS header for `/uploads` |
| `server/package.json` | Added `multer` dependency |

### Frontend Files Modified/Created

| File | Change |
|------|--------|
| `client/src/pages/owner/AddHotelListing.js` | **New** - Full add hotel form with image upload, preview modal |
| `client/src/pages/owner/EditHotelListing.js` | **New** - Edit form with pre-populated data and image management |
| `client/src/pages/owner/HotelPreview.js` | **New** - Hotel profile view with photo gallery |
| `client/src/pages/owner/OwnerHotels.js` | Updated buttons (Preview, Edit, Delete), removed old modal form |
| `client/src/App.js` | Added routes for add, edit, and preview pages |
| `client/src/api/axios.js` | Fixed FormData Content-Type handling in request interceptor |

### New Directories

| Directory | Purpose |
|-----------|---------|
| `server/uploads/hotels/` | Stores uploaded hotel images on disk |
