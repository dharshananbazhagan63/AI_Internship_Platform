# AI Internship Aggregator and Recommendation Platform

> **A Complete College Capstone Project Built Without XAMPP, Apache, PHP, MySQL, or phpMyAdmin.**  
> Powered by **Node.js, Express.js, and SQLite (`database/internship.db`)**.

---

## 🌟 What's New in this Update

### 1. Fix for Company Recommendations (Resolved 2-Company Limitation)
- **Root Cause Identified:** Previously, the database contained only 10 sample listings, and the navigation link for "Recommended" preset a strict `filter=recommended` parameter that enforced an arbitrary `min_match = 50%` filter. This artificially excluded 8 of the 10 listings, leaving students with only two results.
- **Resolution Implemented:**
  - Expanded database to **25 distinct companies** and **40 diverse opportunities** across Web Development, Data Science & AI, Cloud & DevOps, Cybersecurity, Mobile, Software Engineering, and UI/UX Design.
  - Eliminated the arbitrary cutoff filter. The platform now displays all opportunities sorted by **Skill Match Percentage (Highest First)**, allowing students to discover and explore lower-match roles as well.
  - Implemented **Load More Pagination** (`PAGE_SIZE = 12`) allowing students to view 10–20+ recommendations initially and seamlessly load hundreds or thousands more without artificial limits.
  - Transparent formula: `Match Percentage = (Number of Matching Required Skills / Total Number of Required Skills) × 100`.

### 2. Complete Company Details & 6 Functional Action Buttons (Feature 3)
When clicking **View Details**, students see:
- Company Name, Description, and Logo (with SVG fallback)
- Full Company Address (Street, City, State, Country)
- Official Company Website link
- Verified Contact Email and Recruitment Team Email
- Full role specs (Work Mode, Stipend, Duration, Eligibility, Deadline, Required Skills)
- **6 Action Buttons:**
  1. **View Company Website:** Opens official site in a new tab.
  2. **View on Google Maps:** Opens Google Maps directions to the company's verified address.
  3. **Email Company:** Launches prefilled email inquiry modal.
  4. **Apply Now:** Records application session, directs to official link.
  5. **Save Internship:** Shortlists role to Saved Internships.
  6. **Back to Recommendations:** Returns to listings.

### 3. Company Email Functionality (Feature 4)
- **Email Company Button** opens an in-app email composer with prefilled, editable fields:
  - **To:** Verified recruitment email.
  - **Subject:** `Internship Application Inquiry — [Internship Title]`
  - **Body Template:** Professional, editable inquiry message with student name and role title.
- **Open in Email App** launches default mail client (Outlook, Apple Mail, Thunderbird, Gmail) via `mailto:` protocol.
- *Notice:* Opening an email application does not falsely claim the email has been sent.

### 4. Working Apply Now & Tracking Flow (Feature 5)
- Records student ID, internship ID, company ID, and timestamp in SQLite.
- Initializes tracking stage as **"Application Started"** (or **"Interested"**)—never assumes "Applied" prematurely.
- Opens the official application portal in a new tab.
- Guides the student to complete their submission on the company's website, then mark their status as "Applied" in My Applications.

### 5. Application Tracking System (ATS) Dashboard (Feature 6)
Accessible via **My Applications** (`applications.html`):
- **Dynamic Status Stages:** `Interested`, `Application Started`, `Applied`, `Assessment`, `Interview Scheduled`, `Offer Received`, `Rejected`, `Withdrawn`.
- **Personal Notes:** Add and edit private notes for each application (e.g., interview schedule, prep topics).
- **Search & Filters:** Search by company or role; filter by status; sort by newest or oldest.
- **Dynamic KPI Funnel Cards:** Real-time statistics calculated from actual student records (Total Tracked, Interested, Applied, Assessments, Interviews, Offers, Rejected).

### 6. Save Internships Feature (Feature 7)
Accessible via **Saved Internships** (`saved.html`):
- Bookmark any opportunity for later review.
- Prevent duplicate saved records using SQLite unique constraints.
- Apply or remove saved internships anytime.

### 7. Safe SQLite Database Migrations (Feature 8)
- Safe schema migration without data loss.
- Tables: `users`, `student_profiles`, `resumes`, `companies`, `internships`, `saved_internships`, `applications`, `recommendations`.
- Strict student isolation: One student cannot read, edit, or delete another student's applications or saved bookmarks.

### 8. CSV & Administrative Data Import (Feature 9)
- `database/sample_internships.csv`: Sample CSV template.
- `database/importData.js`: Script to bulk import hundreds of company and internship records into SQLite.
- API endpoint: `POST /api/internships/import` for programmatic integration.

### 9. Modern Responsive Navigation (Feature 10)
- **Home** (`index.html`)
- **Upload Resume** (`upload-resume.html`)
- **Find Internships** (`internships.html`)
- **Recommended Companies** (`internships.html?filter=recommended`)
- **Saved Internships** (`saved.html`)
- **My Applications** (`applications.html`)
- **My Profile** (`profile.html`)
- **Logout**

---

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Bootstrap Icons
- **Backend:** Node.js, Express.js
- **Database:** SQLite (`sqlite3` local database file: `database/internship.db`)
- **Security:** `bcryptjs` (password hashing), `jsonwebtoken` (JWT authentication)
- **Document Handling:** `multer` (uploads), `pdf-parse` (PDF extraction), `mammoth` (DOCX extraction)
- **Configuration:** `dotenv`, `cors`

---

## 🚀 How to Run the Project

### 1. Verify Prerequisites
Ensure Node.js (v18 or newer) is installed.
```bash
node -v
npm -v
```

### 2. Open Project Folder in Terminal
```bash
cd c:\AI_Internship_paltform
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Application
```bash
npm start
```

### 5. Access the Web Application
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🧪 Automated Verification Test Suite

To run the automated test suite covering all 16 feature workflows:
```bash
node testSuiteUpdated.js
```

**Verified Test Outputs:**
- ✅ Health Check & Server Status: 200 OK
- ✅ Student Registration & bcrypt hashing: 201 Created
- ✅ Login & JWT Token issuance: 200 OK
- ✅ PDF Resume Upload & Rule-based NLP Skill Extraction: 200 OK
- ✅ 10–20+ Recommendations (40 active opportunities across 25 companies): Passed
- ✅ Recommendations Sorted by Match Percentage Descending: Passed
- ✅ Complete Company Details (Address, Website, Emails): Passed
- ✅ Apply Now Click Action (records session, initial status 'Application Started'): Passed
- ✅ Application Tracking System (ATS) stage updates (Applied -> Interview Scheduled): Passed
- ✅ Personal Application Notes recording & editing: Passed
- ✅ Dynamic ATS Summary Funnel Statistics: Passed
- ✅ Save & Remove Bookmarked Internships: Passed
- ✅ Multi-Tenant Student Isolation (Security Check): Passed

---

## 📁 Updated Project Folder Structure

```
c:\AI_Internship_paltform\
├── package.json                   # Dependencies and npm scripts
├── server.js                      # Express server entry point with auto migrations
├── .env                           # Environment configuration
├── .env.example                   # Environment template
├── README.md                      # Documentation
├── testSuite.js                   # Base test suite
├── testSuiteUpdated.js            # Comprehensive 16-feature test suite
├── database/
│   ├── db.js                      # SQLite database connection & promises wrapper
│   ├── initDb.js                  # Safe schema migrations & seeder
│   ├── seedData.js                # 25 companies & 36+ diverse opportunities dataset
│   ├── importData.js              # CSV bulk import utility script
│   ├── sample_internships.csv     # Sample CSV import template
│   └── internship.db              # SQLite database file
├── middleware/
│   ├── authMiddleware.js          # JWT authentication middleware
│   └── uploadMiddleware.js        # Multer upload filter & size validation
├── controllers/
│   ├── authController.js          # Auth, register, login, session
│   ├── profileController.js       # Profile & skills editing
│   ├── resumeController.js        # Resume upload, parsing, view, delete
│   ├── internshipController.js    # Internships, recommendations, save, apply click
│   └── applicationController.js   # ATS tracker, stages, notes, dynamic stats
├── routes/
│   ├── authRoutes.js              # /api/auth
│   ├── profileRoutes.js           # /api/profile
│   ├── resumeRoutes.js            # /api/resume
│   ├── internshipRoutes.js        # /api/internships
│   └── applicationRoutes.js       # /api/applications
├── services/
│   ├── resumeParserService.js     # PDF & DOCX text reader with keyword taxonomy
│   └── recommendationService.js    # Transparent match calculation & company joins
└── public/
    ├── index.html                 # Homepage with exact requested title
    ├── register.html              # Account registration
    ├── login.html                 # Account login
    ├── dashboard.html             # Student Dashboard with ATS overview
    ├── upload-resume.html         # Resume upload & skill tags
    ├── internships.html           # Aggregator, recommendations & details modal
    ├── applications.html          # Application Tracking System (ATS)
    ├── saved.html                 # Saved Internships page
    ├── profile.html               # Student Profile & custom skills editor
    ├── css/style.css              # Gradient design system
    └── js/
        ├── auth.js                # Auth state, updated navbar, and toast alerts
        ├── main.js                # Homepage stats and featured cards
        ├── resume.js              # Drag-and-drop resume upload & analysis
        └── recommendations.js     # Load More pagination, modal details, email composer
```
