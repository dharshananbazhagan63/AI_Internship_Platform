const db = require('../database/db');
const RecommendationService = require('../services/recommendationService');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'college_ai_internship_secret_key_2026';

const KNOWN_COMPANY_WEBSITES = {
  'Kissflow': 'https://kissflow.com',
  'Zoho Corporation': 'https://www.zoho.com',
  'Freshworks': 'https://www.freshworks.com',
  'GUVI Geek Networks': 'https://www.guvi.in',
  'Ramco Systems': 'https://www.ramco.com',
  'Chargebee Technologies': 'https://www.chargebee.com',
  'LatentView Analytics': 'https://www.latentview.com',
  'Kaar Technologies': 'https://www.kaartech.com',
  'NexGen Cloud Solutions': 'https://nexgencloud.com',
  'Cognitive Labs AI': 'https://cognitivelabs.ai',
  'PixelCraft Digital': 'https://pixelcraft.design',
  'Skyline Infrastructure': 'https://skylineinfra.com',
  'DataPulse Analytics': 'https://datapulse.io',
  'InsightMetrics Corp': 'https://insightmetrics.com',
  'Fortress Cyber Systems': 'https://fortresscyber.org',
  'AppSphere Technologies': 'https://appsphere.app',
  'Apex Enterprise Systems': 'https://apexsystems.com',
  'Vivid Visual Studio': 'https://vividvisual.co',
  'QuantumByte Labs': 'https://quantumbyte.com',
  'Synthetix Health Tech': 'https://synthetixhealth.com',
  'HyperScale Networks': 'https://hyperscalenet.com',
  'OmniRobotics Solutions': 'https://omnirobotics.tech',
  'Aura Fintech Global': 'https://aurafintech.co.uk',
  'GreenGrid Energy AI': 'https://greengridai.com',
  'StreamSync Media': 'https://streamsync.ca',
  'Veritas Quality Assurance': 'https://veritasqa.com',
  'CodeCraft Studios': 'https://codecraftstudios.com',
  'BlueShift DevSecOps': 'https://blueshiftsecurity.sg',
  'Krypton Web3 Labs': 'https://kryptonlabs.ch',
  'BioInformatix Research': 'https://bioinformatix.org',
  'UrbanPulse Smart Mobility': 'https://urbanpulse.com.au',
  'NextGen Gaming Technologies': 'https://nextgengaming.com',
  'EchoSense Natural Language': 'https://echosense.com'
};

function getOriginalCompanyWebsite(name, currentWebsite) {
  if (currentWebsite && !currentWebsite.startsWith('/demo-company') && !currentWebsite.includes('example.')) {
    return currentWebsite;
  }
  if (name && KNOWN_COMPANY_WEBSITES[name]) {
    return KNOWN_COMPANY_WEBSITES[name];
  }
  return `https://${(name || 'company').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
}

class InternshipController {
  /**
   * Helper to inspect optional JWT from Authorization header
   */
  static extractOptionalUser(req) {
    try {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        return jwt.verify(token, JWT_SECRET);
      }
    } catch (e) {
      // Guest access
    }
    return null;
  }

  /**
   * Get all internships with search, domain/category filter, work mode, and minimum match (Feature 1 & 2)
   * Joins full company details and returns all eligible opportunities without artificial restrictions.
   */
  static async getAllInternships(req, res) {
    try {
      const { search, category, work_mode, min_match, page, limit, view, filter, sort } = req.query;
      const user = InternshipController.extractOptionalUser(req);

      let query = `
        SELECT
          i.*,
          c.name AS comp_name,
          c.description AS comp_description,
          c.logo_url AS comp_logo_url,
          c.address AS comp_address,
          c.city AS comp_city,
          c.state AS comp_state,
          c.country AS comp_country,
          c.website AS comp_website,
          c.contact_email AS comp_contact_email,
          c.recruitment_email AS comp_recruitment_email
        FROM internships i
        LEFT JOIN companies c ON (i.company_id = c.id OR i.company = c.name)
        WHERE 1=1
      `;
      const params = [];

      if (category && category !== 'All') {
        query += ' AND i.category = ?';
        params.push(category);
      }

      if (work_mode && work_mode !== 'All') {
        query += ' AND i.work_mode = ?';
        params.push(work_mode);
      }

      if (search) {
        query += ' AND (i.title LIKE ? OR i.company LIKE ? OR c.name LIKE ? OR i.required_skills LIKE ? OR i.description LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY i.id DESC';

      const internships = await db.all(query, params);

      // Fetch user profile skills & applications & saved map if authenticated
      let userSkills = [];
      let applicationsMap = {};
      let savedSet = new Set();

      if (user) {
        const profile = await db.get('SELECT skills FROM student_profiles WHERE user_id = ?', [user.id]);
        if (profile && profile.skills) {
          try {
            userSkills = JSON.parse(profile.skills);
          } catch (e) {
            userSkills = [];
          }
        }

        // Reliable Fallback: If student profile has no skills, check latest resume immediately!
        if (!userSkills || userSkills.length === 0) {
          const latestResume = await db.get(
            'SELECT detected_skills FROM resumes WHERE user_id = ? ORDER BY id DESC LIMIT 1',
            [user.id]
          );
          if (latestResume && latestResume.detected_skills) {
            try {
              userSkills = JSON.parse(latestResume.detected_skills);
              if (Array.isArray(userSkills) && userSkills.length > 0) {
                await db.run(
                  `INSERT INTO student_profiles (user_id, skills, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
                   ON CONFLICT(user_id) DO UPDATE SET skills = excluded.skills, updated_at = CURRENT_TIMESTAMP`,
                  [user.id, JSON.stringify(userSkills)]
                );
              }
            } catch (e) {
              userSkills = [];
            }
          }
        }

        const userApps = await db.all(
          'SELECT internship_id, status, notes, click_timestamp, applied_at FROM applications WHERE user_id = ?',
          [user.id]
        );
        for (const app of userApps) {
          applicationsMap[app.internship_id] = app;
        }

        const savedRows = await db.all(
          'SELECT internship_id FROM saved_internships WHERE user_id = ?',
          [user.id]
        );
        savedSet = new Set(savedRows.map((r) => r.internship_id));
      }

      // Process each card
      let results = internships.map((item) => {
        let reqSkills = [];
        try {
          reqSkills = JSON.parse(item.required_skills);
        } catch (e) {
          reqSkills = [];
        }

        let perks = [];
        try {
          perks = JSON.parse(item.perks || '[]');
        } catch (e) {
          perks = [];
        }

        // Transparent match calculation (Feature 2)
        const matchData = RecommendationService.calculateMatch(userSkills, reqSkills);
        const appInfo = applicationsMap[item.id] || null;

        return {
          id: item.id,
          company_id: item.company_id,
          title: item.title,
          company: item.comp_name || item.company,
          category: item.category,
          location: item.location,
          work_mode: item.work_mode,
          stipend: item.stipend,
          duration: item.duration,
          eligibility: item.eligibility,
          required_skills: reqSkills,
          description: item.description,
          deadline: item.deadline || 'Ongoing',
          official_url: (item.official_url && !item.official_url.includes('example.')) ? item.official_url : `/demo-application-portal.html?id=${item.id}`,
          listing_source: item.listing_source || 'Academic Demo Listing',
          perks: perks,
          is_verified: item.is_verified || 0,
          created_at: item.created_at,
          // Company details (Feature 3)
          company_details: {
            id: item.company_id,
            name: item.comp_name || item.company,
            description: item.comp_description || '',
            logo_url: item.comp_logo_url || '',
            address: item.comp_address || item.location,
            city: item.comp_city || '',
            state: item.comp_state || '',
            country: item.comp_country || '',
            website: getOriginalCompanyWebsite(item.comp_name || item.company, item.comp_website),
            contact_email: item.comp_contact_email || '',
            recruitment_email: item.comp_recruitment_email || item.comp_contact_email || ''
          },
          // Match score calculation
          matchScore: userSkills.length > 0 ? matchData.matchScore : null,
          matchingSkills: matchData.matchingSkills,
          missingSkills: matchData.missingSkills,
          suggestedSkills: matchData.suggestedSkills,
          // Saved state (Feature 7)
          isSaved: savedSet.has(item.id),
          // Application tracking state (Feature 5 & 6)
          hasApplied: !!appInfo,
          applicationStatus: appInfo ? appInfo.status : null,
          applicationInfo: appInfo
        };
      });

      const isRecommendedMode = (view === 'recommended' || filter === 'recommended');

      if (isRecommendedMode) {
        // RECOMMENDED COMPANIES MODE:
        // Strictly show only companies and opportunities tailored to the user's specific skill set and profile match percentage.
        if (userSkills.length > 0) {
          // Strictly retain only listings with at least one matching skill and positive match score
          results = results.filter((item) => (item.matchScore || 0) > 0 && item.matchingSkills && item.matchingSkills.length > 0);
          // Strictly sort highest match percentage first
          results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || b.id - a.id);
        } else {
          // Student has not uploaded resume or has 0 skills detected
          results = [];
        }
      } else {
        // FIND INTERNSHIPS MODE:
        // List ALL available internships/companies across all domains by default.
        // Users explore every listing freely without skill gating.
        if (sort === 'match_desc') {
          results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || b.id - a.id);
        } else if (sort === 'match_asc') {
          results.sort((a, b) => (a.matchScore || 0) - (b.matchScore || 0) || b.id - a.id);
        } else if (sort === 'title_asc') {
          results.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        } else {
          // Default: newest first (i.id DESC) so all categories and companies appear freely
          results.sort((a, b) => b.id - a.id);
        }

        // Apply min_match only if explicitly requested by user in filter dropdown
        if (min_match && userSkills.length > 0) {
          const threshold = parseInt(min_match, 10);
          results = results.filter((item) => (item.matchScore || 0) >= threshold);
        }
      }

      const totalMatching = results.length;

      // Optional pagination support
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 0; // 0 means return all
      let pagedResults = results;
      if (limitNum > 0) {
        const offset = (pageNum - 1) * limitNum;
        pagedResults = results.slice(offset, offset + limitNum);
      }

      return res.status(200).json({
        success: true,
        total: totalMatching,
        page: pageNum,
        limit: limitNum,
        totalPages: limitNum > 0 ? Math.ceil(totalMatching / limitNum) : 1,
        userSkillsCount: userSkills.length,
        userSkills: userSkills,
        internships: pagedResults
      });
    } catch (err) {
      console.error('[-] Error fetching internships:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve internships.' });
    }
  }

  /**
   * Get single internship details with full company record (Feature 3)
   */
  static async getInternshipById(req, res) {
    try {
      const { id } = req.params;
      const user = InternshipController.extractOptionalUser(req);

      const query = `
        SELECT
          i.*,
          c.name AS comp_name,
          c.description AS comp_description,
          c.logo_url AS comp_logo_url,
          c.address AS comp_address,
          c.city AS comp_city,
          c.state AS comp_state,
          c.country AS comp_country,
          c.website AS comp_website,
          c.contact_email AS comp_contact_email,
          c.recruitment_email AS comp_recruitment_email
        FROM internships i
        LEFT JOIN companies c ON (i.company_id = c.id OR i.company = c.name)
        WHERE i.id = ?
      `;
      const item = await db.get(query, [id]);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Internship listing not found.' });
      }

      let reqSkills = [];
      try {
        reqSkills = JSON.parse(item.required_skills);
      } catch (e) {
        reqSkills = [];
      }

      let perks = [];
      try {
        perks = JSON.parse(item.perks || '[]');
      } catch (e) {
        perks = [];
      }

      let userSkills = [];
      let application = null;
      let isSaved = false;

      if (user) {
        const profile = await db.get('SELECT skills FROM student_profiles WHERE user_id = ?', [user.id]);
        if (profile && profile.skills) {
          try {
            userSkills = JSON.parse(profile.skills);
          } catch (e) {
            userSkills = [];
          }
        }
        application = await db.get(
          'SELECT * FROM applications WHERE user_id = ? AND internship_id = ?',
          [user.id, id]
        );
        const saved = await db.get(
          'SELECT id FROM saved_internships WHERE user_id = ? AND internship_id = ?',
          [user.id, id]
        );
        isSaved = !!saved;
      }

      const matchData = RecommendationService.calculateMatch(userSkills, reqSkills);

      return res.status(200).json({
        success: true,
        internship: {
          id: item.id,
          company_id: item.company_id,
          company: item.comp_name || item.company,
          title: item.title,
          category: item.category,
          location: item.location,
          work_mode: item.work_mode,
          stipend: item.stipend,
          duration: item.duration,
          eligibility: item.eligibility,
          required_skills: reqSkills,
          description: item.description,
          deadline: item.deadline || 'Ongoing',
          official_url: (item.official_url && !item.official_url.includes('example.')) ? item.official_url : `/demo-application-portal.html?id=${item.id}`,
          listing_source: item.listing_source || 'Academic Demo Listing',
          perks: perks,
          is_verified: item.is_verified || 0,
          created_at: item.created_at,
          company_details: {
            id: item.company_id,
            name: item.comp_name || item.company,
            description: item.comp_description || '',
            logo_url: item.comp_logo_url || '',
            address: item.comp_address || item.location,
            city: item.comp_city || '',
            state: item.comp_state || '',
            country: item.comp_country || '',
            website: getOriginalCompanyWebsite(item.comp_name || item.company, item.comp_website),
            contact_email: item.comp_contact_email || '',
            recruitment_email: item.comp_recruitment_email || item.comp_contact_email || ''
          },
          matchScore: userSkills.length > 0 ? matchData.matchScore : null,
          matchingSkills: matchData.matchingSkills,
          missingSkills: matchData.missingSkills,
          suggestedSkills: matchData.suggestedSkills,
          isSaved: isSaved,
          hasApplied: !!application,
          applicationStatus: application ? application.status : null,
          applicationInfo: application
        }
      });
    } catch (err) {
      console.error('[-] Error fetching internship by ID:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve internship details.' });
    }
  }

  /**
   * Apply Now Click Action (Feature 5)
   * Records click, initializes tracking status as 'Application Started' or 'Interested'
   * Does NOT prematurely mark as 'Applied'
   * Returns official application URL (local interactive portal to prevent browser SSL/DNS errors)
   */
  static async applyClick(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const internship = await db.get(
        `SELECT i.*, c.website as comp_website FROM internships i
         LEFT JOIN companies c ON (i.company_id = c.id OR i.company = c.name)
         WHERE i.id = ?`,
        [id]
      );

      if (!internship) {
        return res.status(404).json({ success: false, message: 'Internship listing not found.' });
      }

      // Determine valid application URL: Local interactive career portal avoids browser SSL/DNS errors
      let appUrl = `/demo-application-portal.html?id=${internship.id}`;
      if (internship.official_url && !internship.official_url.includes('example.')) {
        appUrl = internship.official_url;
      }

      // Check existing application record
      const existing = await db.get(
        'SELECT id, status FROM applications WHERE user_id = ? AND internship_id = ?',
        [userId, id]
      );

      if (existing) {
        // Update click timestamp and keep existing status unless it was none
        await db.run(
          `UPDATE applications
           SET click_timestamp = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [existing.id]
        );
      } else {
        // Initial tracking status as required by Feature 5: "Application Started" or "Interested"
        await db.run(
          `INSERT INTO applications (user_id, internship_id, company_id, status, click_timestamp, notes, applied_at, created_at, updated_at)
           VALUES (?, ?, ?, 'Application Started', CURRENT_TIMESTAMP, 'Application portal opened by student', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [userId, id, internship.company_id || null]
        );
      }

      return res.status(200).json({
        success: true,
        message: `Application session started for "${internship.title}" at ${internship.company}.`,
        applicationUrl: appUrl,
        initialStatus: existing ? existing.status : 'Application Started',
        instructions: 'The demonstration company career portal has opened in a new tab. Submit your application there or update your status anytime in My Applications!'
      });
    } catch (err) {
      console.error('[-] Error processing apply click:', err);
      return res.status(500).json({ success: false, message: 'Failed to record application click.' });
    }
  }

  /**
   * Save Internship (Feature 7)
   * Prevents duplicates with UNIQUE constraint
   */
  static async saveInternship(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const internship = await db.get('SELECT id, title, company FROM internships WHERE id = ?', [id]);
      if (!internship) {
        return res.status(404).json({ success: false, message: 'Internship not found.' });
      }

      await db.run(
        `INSERT INTO saved_internships (user_id, internship_id, saved_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, internship_id) DO NOTHING`,
        [userId, id]
      );

      return res.status(200).json({
        success: true,
        message: `Internship "${internship.title}" saved to your bookmarks.`,
        isSaved: true
      });
    } catch (err) {
      console.error('[-] Error saving internship:', err);
      return res.status(500).json({ success: false, message: 'Failed to save internship.' });
    }
  }

  /**
   * Unsave / Remove Saved Internship (Feature 7)
   */
  static async unsaveInternship(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await db.run(
        'DELETE FROM saved_internships WHERE user_id = ? AND internship_id = ?',
        [userId, id]
      );

      return res.status(200).json({
        success: true,
        message: 'Internship removed from saved list.',
        isSaved: false
      });
    } catch (err) {
      console.error('[-] Error unsaving internship:', err);
      return res.status(500).json({ success: false, message: 'Failed to unsave internship.' });
    }
  }

  /**
   * Get all Saved Internships for the logged-in student (Feature 7)
   */
  static async getSavedInternships(req, res) {
    try {
      const userId = req.user.id;

      // Get student skills for match score
      const profile = await db.get('SELECT skills FROM student_profiles WHERE user_id = ?', [userId]);
      let userSkills = [];
      if (profile && profile.skills) {
        try {
          userSkills = JSON.parse(profile.skills);
        } catch (e) {
          userSkills = [];
        }
      }

      const query = `
        SELECT
          s.id AS saved_record_id,
          s.saved_at,
          i.*,
          c.name AS comp_name,
          c.description AS comp_description,
          c.logo_url AS comp_logo_url,
          c.address AS comp_address,
          c.city AS comp_city,
          c.state AS comp_state,
          c.country AS comp_country,
          c.website AS comp_website,
          c.contact_email AS comp_contact_email,
          c.recruitment_email AS comp_recruitment_email
        FROM saved_internships s
        JOIN internships i ON s.internship_id = i.id
        LEFT JOIN companies c ON (i.company_id = c.id OR i.company = c.name)
        WHERE s.user_id = ?
        ORDER BY s.saved_at DESC
      `;
      const rows = await db.all(query, [userId]);

      const formatted = rows.map((item) => {
        let reqSkills = [];
        try {
          reqSkills = JSON.parse(item.required_skills);
        } catch (e) {
          reqSkills = [];
        }

        const matchData = RecommendationService.calculateMatch(userSkills, reqSkills);

        return {
          id: item.id,
          saved_record_id: item.saved_record_id,
          saved_at: item.saved_at,
          title: item.title,
          company: item.comp_name || item.company,
          category: item.category,
          location: item.location,
          work_mode: item.work_mode,
          stipend: item.stipend,
          duration: item.duration,
          eligibility: item.eligibility,
          required_skills: reqSkills,
          description: item.description,
          deadline: item.deadline || 'Ongoing',
          official_url: (item.official_url && !item.official_url.includes('example.')) ? item.official_url : `/demo-application-portal.html?id=${item.id}`,
          company_details: {
            id: item.company_id,
            name: item.comp_name || item.company,
            description: item.comp_description || '',
            logo_url: item.comp_logo_url || '',
            address: item.comp_address || item.location,
            city: item.comp_city || '',
            state: item.comp_state || '',
            country: item.comp_country || '',
            website: getOriginalCompanyWebsite(item.comp_name || item.company, item.comp_website),
            contact_email: item.comp_contact_email || '',
            recruitment_email: item.comp_recruitment_email || item.comp_contact_email || ''
          },
          matchScore: userSkills.length > 0 ? matchData.matchScore : null,
          matchingSkills: matchData.matchingSkills,
          missingSkills: matchData.missingSkills,
          suggestedSkills: matchData.suggestedSkills,
          isSaved: true
        };
      });

      return res.status(200).json({
        success: true,
        count: formatted.length,
        savedInternships: formatted
      });
    } catch (err) {
      console.error('[-] Error fetching saved internships:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve saved internships.' });
    }
  }

  /**
   * Get personalized recommendations for student (Feature 1 & 2)
   * Returns all matching recommendations sorted highest match first
   */
  static async getRecommendations(req, res) {
    try {
      const data = await RecommendationService.getRecommendationsForUser(req.user.id);
      return res.status(200).json({
        success: true,
        userSkills: data.userSkills,
        total: data.totalCount,
        recommendations: data.recommendations
      });
    } catch (err) {
      console.error('[-] Error fetching recommendations:', err);
      return res.status(500).json({ success: false, message: 'Failed to generate recommendations.' });
    }
  }

  /**
   * Platform statistics (Homepage & general)
   */
  static async getStats(req, res) {
    try {
      const totalInternships = await db.get('SELECT COUNT(*) as count FROM internships');
      const totalCompanies = await db.get('SELECT COUNT(*) as count FROM companies');
      const totalStudents = await db.get('SELECT COUNT(*) as count FROM users');
      const totalResumes = await db.get('SELECT COUNT(*) as count FROM resumes');

      return res.status(200).json({
        success: true,
        stats: {
          totalInternships: totalInternships?.count || 36,
          totalCompanies: totalCompanies?.count || 25,
          totalStudents: totalStudents?.count || 1,
          totalResumes: totalResumes?.count || 0
        }
      });
    } catch (err) {
      console.error('[-] Error fetching platform stats:', err);
      return res.status(500).json({ success: false, message: 'Failed to load platform statistics.' });
    }
  }

  /**
   * Import Company & Internship Records from CSV / JSON (Feature 9)
   */
  static async importRecords(req, res) {
    try {
      const { companies = [], internships = [] } = req.body;

      if (!Array.isArray(companies) && !Array.isArray(internships)) {
        return res.status(400).json({ success: false, message: 'Invalid payload format.' });
      }

      let compCount = 0;
      for (const c of companies) {
        if (c.name) {
          await db.run(
            `INSERT INTO companies (name, description, logo_url, address, city, state, country, website, contact_email, recruitment_email, is_verified)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(name) DO UPDATE SET
               description = excluded.description,
               website = excluded.website`,
            [c.name, c.description || '', c.logo_url || '', c.address || '', c.city || '', c.state || '', c.country || '', c.website || '', c.contact_email || '', c.recruitment_email || '', c.is_verified || 0]
          );
          compCount++;
        }
      }

      let internCount = 0;
      for (const i of internships) {
        if (i.title && i.company) {
          const comp = await db.get('SELECT id FROM companies WHERE name = ?', [i.company]);
          await db.run(
            `INSERT INTO internships (company_id, company, title, category, location, work_mode, stipend, duration, eligibility, required_skills, description, deadline, official_url, listing_source, is_verified)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              comp ? comp.id : null,
              i.company,
              i.title,
              i.category || 'General',
              i.location || 'Remote',
              i.work_mode || 'Remote',
              i.stipend || 'Competitive',
              i.duration || '3 Months',
              i.eligibility || 'College Students',
              typeof i.required_skills === 'string' ? i.required_skills : JSON.stringify(i.required_skills || []),
              i.description || '',
              i.deadline || 'Ongoing',
              i.official_url || 'https://example.com',
              i.listing_source || 'Imported via Administrative Portal',
              i.is_verified || 0
            ]
          );
          internCount++;
        }
      }

      return res.status(200).json({
        success: true,
        message: `Imported ${compCount} companies and ${internCount} internship listings successfully!`,
        importedCompanies: compCount,
        importedInternships: internCount
      });
    } catch (err) {
      console.error('[-] Error importing records:', err);
      return res.status(500).json({ success: false, message: 'Failed to import records: ' + err.message });
    }
  }

  /**
   * Submit application from the demonstration company career portal
   * Updates application status to 'Applied' and records submission details
   */
  static async portalSubmit(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { notes, portfolioUrl } = req.body;

      const internship = await db.get(
        `SELECT i.*, c.name as comp_name FROM internships i
         LEFT JOIN companies c ON (i.company_id = c.id OR i.company = c.name)
         WHERE i.id = ?`,
        [id]
      );

      if (!internship) {
        return res.status(404).json({ success: false, message: 'Internship listing not found.' });
      }

      const existing = await db.get(
        'SELECT id, status FROM applications WHERE user_id = ? AND internship_id = ?',
        [userId, id]
      );

      const noteText = notes ? `Portal Submission: ${notes}` : 'Officially submitted via corporate demonstration career portal';

      if (existing) {
        await db.run(
          `UPDATE applications
           SET status = 'Applied',
               notes = ?,
               applied_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [noteText, existing.id]
        );
      } else {
        await db.run(
          `INSERT INTO applications (user_id, internship_id, company_id, status, click_timestamp, notes, applied_at, created_at, updated_at)
           VALUES (?, ?, ?, 'Applied', CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [userId, id, internship.company_id || null, noteText]
        );
      }

      return res.status(200).json({
        success: true,
        message: `Congratulations! Your application for "${internship.title}" at ${internship.comp_name || internship.company} has been successfully submitted!`,
        status: 'Applied'
      });
    } catch (err) {
      console.error('[-] Error submitting application via portal:', err);
      return res.status(500).json({ success: false, message: 'Failed to submit application via portal.' });
    }
  }

  /**
   * Get single company details and all associated internships for demo-company.html
   */
  static async getCompanyById(req, res) {
    try {
      const { companyId } = req.params;
      const company = await db.get('SELECT * FROM companies WHERE id = ?', [companyId]);
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company record not found.' });
      }

      const openings = await db.all(
        'SELECT * FROM internships WHERE company_id = ? OR company = ? ORDER BY id DESC',
        [company.id, company.name]
      );

      const formattedOpenings = openings.map(item => {
        let reqSkills = [];
        try { reqSkills = JSON.parse(item.required_skills); } catch (e) { reqSkills = []; }
        let perks = [];
        try { perks = JSON.parse(item.perks || '[]'); } catch (e) { perks = []; }

        return {
          ...item,
          required_skills: reqSkills,
          perks: perks,
          official_url: `/demo-application-portal.html?id=${item.id}`
        };
      });

      return res.status(200).json({
        success: true,
        company: {
          ...company,
          website: getOriginalCompanyWebsite(company.name, company.website)
        },
        openings: formattedOpenings
      });
    } catch (err) {
      console.error('[-] Error fetching company by ID:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve company details.' });
    }
  }
}

module.exports = InternshipController;
