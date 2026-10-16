const db = require('../database/db');

class RecommendationService {
  /**
   * Helper to normalize skill names and aliases (e.g. React.js <-> React, Node.js <-> Node, HTML5 <-> HTML)
   */
  static normalizeSkill(skill) {
    if (!skill) return '';
    const s = String(skill).trim().toLowerCase().replace(/[\.\-_]/g, '');
    if (s === 'javascript' || s === 'js' || s === 'es6') return 'javascript';
    if (s === 'typescript' || s === 'ts') return 'typescript';
    if (s === 'react' || s === 'reactjs') return 'react';
    if (s === 'node' || s === 'nodejs') return 'node';
    if (s === 'express' || s === 'expressjs') return 'express';
    if (s === 'html' || s === 'html5') return 'html5';
    if (s === 'css' || s === 'css3' || s === 'sass' || s === 'scss') return 'css3';
    if (s === 'python' || s === 'py' || s === 'python3') return 'python';
    if (s === 'postgres' || s === 'postgresql' || s === 'psql') return 'postgresql';
    if (s === 'mongo' || s === 'mongodb') return 'mongodb';
    if (s === 'sqlite' || s === 'sqlite3') return 'sqlite';
    if (s === 'rest' || s === 'restapi' || s === 'restapis' || s === 'restful' || s === 'restfulapi') return 'restapis';
    if (s === 'ai' || s === 'artificialintelligence') return 'ai';
    if (s === 'ml' || s === 'machinelearning') return 'ml';
    if (s === 'nlp' || s === 'naturallanguageprocessing') return 'nlp';
    if (s === 'vue' || s === 'vuejs') return 'vue';
    if (s === 'next' || s === 'nextjs') return 'next';
    if (s === 'c++' || s === 'cpp') return 'cpp';
    if (s === 'c#' || s === 'csharp') return 'csharp';
    if (s === 'golang' || s === 'go') return 'go';
    if (s === 'docker' || s === 'containerization') return 'docker';
    if (s === 'k8s' || s === 'kubernetes') return 'kubernetes';
    if (s === 'git' || s === 'github' || s === 'gitlab' || s === 'versioncontrol') return 'git';
    if (s === 'aws' || s === 'amazonwebservices') return 'aws';
    return s;
  }

  /**
   * Transparent skill-based matching algorithm (Feature 2)
   * Evaluates matching skills and additional skills required for 100% match.
   * Safe handling of empty or missing skill requirements.
   */
  static calculateMatch(userSkills = [], requiredSkills = []) {
    let reqList = [];
    if (Array.isArray(requiredSkills)) {
      reqList = requiredSkills;
    } else if (typeof requiredSkills === 'string') {
      try {
        const parsed = JSON.parse(requiredSkills);
        reqList = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        reqList = requiredSkills.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    if (reqList.length === 0) {
      return {
        matchScore: 100,
        matchingSkills: [],
        missingSkills: [],
        suggestedSkills: []
      };
    }

    const normalizedUserKeySet = new Set(
      (userSkills || []).map((s) => RecommendationService.normalizeSkill(s)).filter(Boolean)
    );
    const rawUserLower = (userSkills || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);

    const matchingSkills = [];
    const missingSkills = [];

    for (const req of reqList) {
      const rawReq = String(req).trim();
      const normReq = RecommendationService.normalizeSkill(rawReq);
      const isMatch = normalizedUserKeySet.has(normReq) || rawUserLower.includes(rawReq.toLowerCase());
      if (isMatch) {
        matchingSkills.push(rawReq);
      } else {
        missingSkills.push(rawReq);
      }
    }

    // Match percentage calculation (used internally for ranking)
    const matchScore = Math.round((matchingSkills.length / reqList.length) * 100);

    // Contextual learning suggestions: top missing skills needed for 100% match
    const suggestedSkills = missingSkills.slice(0, 3);

    return {
      matchScore,
      matchingSkills,
      missingSkills, // Additional skills required for 100% match
      suggestedSkills
    };
  }

  /**
   * Generate recommendations for a student against all internships in database (Feature 1 & Feature 8)
   * Joins companies, saved status, and applications.
   * Never hardcodes a maximum of two companies.
   * Returns all matching records sorted by matchScore descending.
   */
  static async getRecommendationsForUser(userId) {
    // 1. Get student profile skills
    const profile = await db.get(
      'SELECT skills FROM student_profiles WHERE user_id = ?',
      [userId]
    );

    let userSkills = [];
    if (profile && profile.skills) {
      try {
        userSkills = JSON.parse(profile.skills);
      } catch (e) {
        userSkills = [];
      }
    }

    // Reliable fallback: If student profile has no skills, check latest resume immediately!
    if (!userSkills || userSkills.length === 0) {
      const latestResume = await db.get(
        'SELECT detected_skills FROM resumes WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        [userId]
      );
      if (latestResume && latestResume.detected_skills) {
        try {
          userSkills = JSON.parse(latestResume.detected_skills);
          if (Array.isArray(userSkills) && userSkills.length > 0) {
            await db.run(
              `INSERT INTO student_profiles (user_id, skills, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(user_id) DO UPDATE SET skills = excluded.skills, updated_at = CURRENT_TIMESTAMP`,
              [userId, JSON.stringify(userSkills)]
            );
          }
        } catch (e) {
          userSkills = [];
        }
      }
    }

    // 2. Fetch all internships joined with complete company details
    const sql = `
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
      ORDER BY i.id DESC
    `;
    const internships = await db.all(sql);

    // 3. Fetch user's saved internships map
    const savedRows = await db.all(
      'SELECT internship_id FROM saved_internships WHERE user_id = ?',
      [userId]
    );
    const savedMap = new Set(savedRows.map((r) => r.internship_id));

    // 4. Fetch user's applications map
    const appRows = await db.all(
      'SELECT internship_id, status, notes, click_timestamp, applied_at, updated_at FROM applications WHERE user_id = ?',
      [userId]
    );
    const appMap = {};
    for (const app of appRows) {
      appMap[app.internship_id] = app;
    }

    // 5. Compute scores and assemble complete company & internship details
    const results = [];
    for (const item of internships) {
      let requiredSkills = [];
      try {
        requiredSkills = JSON.parse(item.required_skills);
      } catch (e) {
        requiredSkills = [];
      }

      const matchData = this.calculateMatch(userSkills, requiredSkills);

      // Save/update in recommendations cache table
      await db.run(
        `INSERT INTO recommendations (user_id, internship_id, match_score, matching_skills, missing_skills, calculated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, internship_id) DO UPDATE SET
           match_score = excluded.match_score,
           matching_skills = excluded.matching_skills,
           missing_skills = excluded.missing_skills,
           calculated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          item.id,
          matchData.matchScore,
          JSON.stringify(matchData.matchingSkills),
          JSON.stringify(matchData.missingSkills)
        ]
      );

      const appInfo = appMap[item.id] || null;

      results.push({
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
        required_skills: requiredSkills,
        description: item.description,
        deadline: item.deadline || 'Ongoing',
        official_url: (item.official_url && !item.official_url.includes('example.')) ? item.official_url : `/demo-application-portal.html?id=${item.id}`,
        listing_source: item.listing_source || 'Academic Demo Listing',
        perks: item.perks ? JSON.parse(item.perks || '[]') : [],
        is_verified: item.is_verified || 0,
        // Company specific attributes (Feature 3)
        company_details: {
          id: item.company_id,
          name: item.comp_name || item.company,
          description: item.comp_description || '',
          logo_url: item.comp_logo_url || '',
          address: item.comp_address || item.location,
          city: item.comp_city || '',
          state: item.comp_state || '',
          country: item.comp_country || '',
          website: (item.comp_website && !item.comp_website.includes('example.')) ? item.comp_website : `/demo-company.html?id=${item.company_id || item.id}`,
          contact_email: item.comp_contact_email || '',
          recruitment_email: item.comp_recruitment_email || item.comp_contact_email || ''
        },
        // Match calculation attributes (Feature 2)
        matchScore: matchData.matchScore,
        matchingSkills: matchData.matchingSkills,
        missingSkills: matchData.missingSkills,
        suggestedSkills: matchData.suggestedSkills,
        // Saved status (Feature 7)
        isSaved: savedMap.has(item.id),
        // Application tracking status (Feature 5 & 6)
        hasApplied: !!appInfo,
        applicationStatus: appInfo ? appInfo.status : null,
        applicationInfo: appInfo
      });
    }

    // Filter to strictly tailored opportunities where the student has matching skills
    let recommendations = results;
    if (userSkills.length > 0) {
      recommendations = results.filter((item) => (item.matchScore || 0) > 0 && item.matchingSkills && item.matchingSkills.length > 0);
      recommendations.sort((a, b) => b.matchScore - a.matchScore || b.id - a.id);
    } else {
      recommendations = [];
    }

    return {
      userSkills,
      totalCount: recommendations.length,
      recommendations: recommendations
    };
  }
}

module.exports = RecommendationService;
