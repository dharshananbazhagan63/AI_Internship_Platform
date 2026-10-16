/**
 * Homepage scripts (index.html)
 */

document.addEventListener('DOMContentLoaded', () => {
  Auth.renderNavbar('home');
  Auth.renderFooter();

  loadHomepageStats();
  loadFeaturedInternships();
  setupCtaButtons();
});

function setupCtaButtons() {
  const getStartedBtn = document.getElementById('btn-get-started');
  const uploadHeroBtn = document.getElementById('btn-hero-upload');

  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      if (Auth.isLoggedIn()) {
        window.location.href = 'internships.html';
      } else {
        window.location.href = 'register.html';
      }
    });
  }

  if (uploadHeroBtn) {
    uploadHeroBtn.addEventListener('click', () => {
      if (Auth.isLoggedIn()) {
        window.location.href = 'upload-resume.html';
      } else {
        window.location.href = 'register.html';
      }
    });
  }
}

async function loadHomepageStats() {
  try {
    const url = (typeof Auth !== 'undefined' && Auth.apiUrl) ? Auth.apiUrl('/api/internships/stats') : '/api/internships/stats';
    const res = await fetch(url);
    const data = await res.json();
    if (data.success && data.stats) {
      const { totalInternships, totalCompanies, totalStudents, totalResumes } = data.stats;
      const countInternshipsEl = document.getElementById('stat-internships-count');
      const countCompaniesEl = document.getElementById('stat-companies-count');
      const countStudentsEl = document.getElementById('stat-students-count');
      const countAccuracyEl = document.getElementById('stat-accuracy-count');

      if (countInternshipsEl) countInternshipsEl.textContent = `${totalInternships}+`;
      if (countCompaniesEl) countCompaniesEl.textContent = `${totalCompanies}+`;
      if (countStudentsEl) countStudentsEl.textContent = `${Math.max(totalStudents, 15)}+`;
      if (countAccuracyEl) countAccuracyEl.textContent = '96%';
    }
  } catch (err) {
    console.warn('Could not load dynamic stats:', err);
  }
}

async function loadFeaturedInternships() {
  const container = document.getElementById('featured-internships-container');
  if (!container) return;

  try {
    const headers = {};
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = (typeof Auth !== 'undefined' && Auth.apiUrl) ? Auth.apiUrl('/api/internships') : '/api/internships';
    const res = await fetch(url, { headers });
    const data = await res.json();

    if (data.success && data.internships && data.internships.length > 0) {
      // Pick top 3 for homepage preview
      const featured = data.internships.slice(0, 3);
      container.innerHTML = featured.map(renderInternshipCardSmall).join('');
    } else {
      container.innerHTML = `<div class="col-12 text-center text-muted py-4">No internships found.</div>`;
    }
  } catch (err) {
    console.error('Error loading featured internships:', err);
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <div class="alert alert-warning d-inline-block text-start small border-warning-subtle">
          <i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>
          <strong>Backend server not detected on http://localhost:3000.</strong><br>
          Please make sure the Node.js server is started using <code>node server.js</code> or <code>start_server.bat</code>.
        </div>
      </div>
    `;
  }
}

function renderInternshipCardSmall(item) {
  const skillsList = (item.required_skills || []).slice(0, 4);

  let matchBadgeHtml = '';
  if (item.matchScore !== null && item.matchScore !== undefined) {
    if (item.missingSkills && item.missingSkills.length === 0) {
      matchBadgeHtml = `<span class="badge bg-success-subtle text-success border border-success border-opacity-25 px-2 py-1 rounded-pill small fw-semibold"><i class="bi bi-patch-check-fill me-1"></i> 100% Match</span>`;
    } else {
      matchBadgeHtml = `<span class="badge bg-primary-subtle text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill small fw-semibold"><i class="bi bi-stars me-1"></i> Skill Matched</span>`;
    }
  }

  const missingSkillsHtml = item.missingSkills && item.missingSkills.length > 0 ? `
    <div class="mb-3 p-2 rounded bg-light border border-warning border-opacity-25">
      <small class="text-dark d-block mb-1 fw-semibold"><i class="bi bi-lightbulb-fill text-warning me-1"></i> Skills for 100% Match:</small>
      <div class="d-flex flex-wrap gap-1">
        ${item.missingSkills.slice(0, 3).map((s) => `<span class="badge bg-warning bg-opacity-25 text-dark border border-warning border-opacity-50 small">${s}</span>`).join('')}
        ${item.missingSkills.length > 3 ? `<span class="badge bg-light text-muted border small">+${item.missingSkills.length - 3} more</span>` : ''}
      </div>
    </div>
  ` : '';

  return `
    <div class="col-lg-4 col-md-6 mb-4">
      <div class="card card-custom h-100 p-4 d-flex flex-column justify-content-between">
        <div>
          <div class="d-flex justify-content-between align-items-start mb-3">
            <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold">
              ${item.category}
            </span>
            ${matchBadgeHtml}
          </div>

          <h5 class="fw-bold mb-1 text-dark">${item.title}</h5>
          <div class="text-muted fw-semibold small mb-3">
            <i class="bi bi-building me-1 text-primary"></i> ${item.company} &bull; <i class="bi bi-geo-alt me-1"></i> ${item.location}
          </div>

          <div class="d-flex flex-wrap gap-2 mb-3">
            <span class="badge bg-light text-dark border"><i class="bi bi-laptop me-1"></i> ${item.work_mode}</span>
            <span class="badge bg-light text-dark border"><i class="bi bi-cash me-1"></i> ${item.stipend}</span>
            <span class="badge bg-light text-dark border"><i class="bi bi-clock me-1"></i> ${item.duration}</span>
          </div>

          <p class="small text-secondary mb-3 text-truncate-2">
            ${item.description}
          </p>

          <div class="mb-3">
            <small class="text-muted d-block mb-1 fw-bold">Required Skills:</small>
            <div class="d-flex flex-wrap gap-1">
              ${skillsList.map((s) => `<span class="skill-tag">${s}</span>`).join('')}
              ${item.required_skills.length > 4 ? `<span class="skill-tag text-muted">+${item.required_skills.length - 4} more</span>` : ''}
            </div>
          </div>

          ${missingSkillsHtml}
        </div>

        <div class="pt-3 border-top d-flex justify-content-between align-items-center">
          <a href="internships.html" class="btn btn-brand-outline btn-sm w-100">
            View & Apply <i class="bi bi-arrow-right ms-1"></i>
          </a>
        </div>
      </div>
    </div>
  `;
}
