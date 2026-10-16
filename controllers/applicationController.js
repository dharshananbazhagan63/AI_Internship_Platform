const db = require('../database/db');

const ALLOWED_STATUSES = [
  'Interested',
  'Application Started',
  'Applied',
  'Assessment',
  'Interview Scheduled',
  'Offer Received',
  'Rejected',
  'Withdrawn'
];

class ApplicationController {
  /**
   * Get all application records for the authenticated student (Feature 6)
   * With search, status filtering, date filtering, and sorting
   */
  static async getMyApplications(req, res) {
    try {
      const userId = req.user.id;
      const { search, status, sort } = req.query;

      let query = `
        SELECT
          a.id AS application_id,
          a.user_id,
          a.internship_id,
          a.company_id,
          a.status,
          a.click_timestamp,
          a.notes,
          a.applied_at,
          a.created_at,
          a.updated_at,
          i.title AS internship_title,
          i.location AS internship_location,
          i.work_mode,
          i.stipend,
          i.duration,
          i.official_url,
          i.required_skills,
          i.deadline,
          c.name AS company_name,
          c.logo_url AS company_logo,
          c.address AS company_address,
          c.city AS company_city,
          c.state AS company_state,
          c.country AS company_country,
          c.website AS company_website,
          c.contact_email AS company_email,
          c.recruitment_email AS company_recruitment_email
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        LEFT JOIN companies c ON (a.company_id = c.id OR i.company_id = c.id OR i.company = c.name)
        WHERE a.user_id = ?
      `;
      const params = [userId];

      if (status && status !== 'All') {
        query += ' AND a.status = ?';
        params.push(status);
      }

      if (search) {
        query += ' AND (i.title LIKE ? OR c.name LIKE ? OR i.company LIKE ? OR a.notes LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term, term);
      }

      if (sort === 'oldest') {
        query += ' ORDER BY COALESCE(a.click_timestamp, a.created_at, a.applied_at) ASC';
      } else {
        query += ' ORDER BY COALESCE(a.updated_at, a.click_timestamp, a.created_at, a.applied_at) DESC';
      }

      const applications = await db.all(query, params);

      const formatted = applications.map((app) => ({
        ...app,
        official_url: (app.official_url && !app.official_url.includes('example.')) ? app.official_url : `/demo-application-portal.html?id=${app.internship_id}`,
        company_website: (app.company_website && !app.company_website.includes('example.')) ? app.company_website : `/demo-company.html?id=${app.company_id || 1}`,
        required_skills: app.required_skills ? JSON.parse(app.required_skills || '[]') : []
      }));

      return res.status(200).json({
        success: true,
        count: formatted.length,
        applications: formatted
      });
    } catch (err) {
      console.error('[-] Error fetching student applications:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve applications.' });
    }
  }

  /**
   * Update application status (Feature 6)
   * With student ownership check
   */
  static async updateStatus(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}`
        });
      }

      // Check ownership
      const app = await db.get('SELECT * FROM applications WHERE id = ? AND user_id = ?', [id, userId]);
      if (!app) {
        return res.status(404).json({
          success: false,
          message: 'Application record not found or access denied.'
        });
      }

      await db.run(
        `UPDATE applications
         SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [status, id, userId]
      );

      return res.status(200).json({
        success: true,
        message: `Application status updated to "${status}".`,
        newStatus: status
      });
    } catch (err) {
      console.error('[-] Error updating application status:', err);
      return res.status(500).json({ success: false, message: 'Failed to update application status.' });
    }
  }

  /**
   * Update personal notes for an application (Feature 6)
   * With student ownership check
   */
  static async updateNotes(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { notes } = req.body;

      const app = await db.get('SELECT * FROM applications WHERE id = ? AND user_id = ?', [id, userId]);
      if (!app) {
        return res.status(404).json({
          success: false,
          message: 'Application record not found or access denied.'
        });
      }

      await db.run(
        `UPDATE applications
         SET notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [notes || '', id, userId]
      );

      return res.status(200).json({
        success: true,
        message: 'Application notes saved successfully.',
        notes: notes || ''
      });
    } catch (err) {
      console.error('[-] Error updating application notes:', err);
      return res.status(500).json({ success: false, message: 'Failed to save application notes.' });
    }
  }

  /**
   * Remove application tracking record (Feature 6)
   * With student ownership check
   */
  static async deleteApplication(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const app = await db.get('SELECT * FROM applications WHERE id = ? AND user_id = ?', [id, userId]);
      if (!app) {
        return res.status(404).json({
          success: false,
          message: 'Application record not found or access denied.'
        });
      }

      await db.run('DELETE FROM applications WHERE id = ? AND user_id = ?', [id, userId]);

      return res.status(200).json({
        success: true,
        message: 'Application record removed from tracking.'
      });
    } catch (err) {
      console.error('[-] Error removing application record:', err);
      return res.status(500).json({ success: false, message: 'Failed to remove application record.' });
    }
  }

  /**
   * Get dynamic summary statistics for student dashboard (Feature 6)
   * Calculated strictly from student's actual database records
   */
  static async getStats(req, res) {
    try {
      const userId = req.user.id;

      const rows = await db.all(
        'SELECT status, count(*) as count FROM applications WHERE user_id = ? GROUP BY status',
        [userId]
      );

      const counts = {
        totalTracked: 0,
        interested: 0,
        applicationStarted: 0,
        applied: 0,
        assessment: 0,
        interviewScheduled: 0,
        offerReceived: 0,
        rejected: 0,
        withdrawn: 0
      };

      for (const row of rows) {
        counts.totalTracked += row.count;
        if (row.status === 'Interested') counts.interested += row.count;
        else if (row.status === 'Application Started') counts.applicationStarted += row.count;
        else if (row.status === 'Applied') counts.applied += row.count;
        else if (row.status === 'Assessment') counts.assessment += row.count;
        else if (row.status === 'Interview Scheduled') counts.interviewScheduled += row.count;
        else if (row.status === 'Offer Received') counts.offerReceived += row.count;
        else if (row.status === 'Rejected') counts.rejected += row.count;
        else if (row.status === 'Withdrawn') counts.withdrawn += row.count;
      }

      // Total saved internships count
      const savedCount = await db.get(
        'SELECT count(*) as count FROM saved_internships WHERE user_id = ?',
        [userId]
      );

      return res.status(200).json({
        success: true,
        stats: {
          ...counts,
          totalSaved: savedCount ? savedCount.count : 0
        }
      });
    } catch (err) {
      console.error('[-] Error fetching application stats:', err);
      return res.status(500).json({ success: false, message: 'Failed to calculate application statistics.' });
    }
  }
}

module.exports = ApplicationController;
