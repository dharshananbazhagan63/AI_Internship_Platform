/**
 * AI Internship Aggregator and Recommendation Platform
 * Core Recommendation Engine, Filtering, Pagination, Company Details & Email Logic
 */

let allInternshipsData = [];
let filteredInternships = [];
let userSkillsList = [];
let currentMode = 'recommended'; // Exclusively 'recommended' (Recommended Companies)
let currentFilterCategory = 'All';
let currentFilterWorkMode = 'All';
let currentFilterSearch = '';
let currentFilterMinMatch = '';
let currentSortOption = 'match_desc'; // default 'match_desc' for recommended companies
let selectedInternship = null;

// Pagination state (Feature 1: 10-20 per page, Load More for hundreds/thousands)
const PAGE_SIZE = 12;
let currentlyVisibleCount = PAGE_SIZE;

document.addEventListener('DOMContentLoaded', () => {
  // Check URL parameters for preset filters and view mode
  const params = new URLSearchParams(window.location.search);
  if (params.get('category')) {
    currentFilterCategory = params.get('category');
    const catSelect = document.getElementById('filter-category');
    if (catSelect) catSelect.value = currentFilterCategory;
  }

  currentMode = 'recommended';
  currentSortOption = 'match_desc';

  const sortSelect = document.getElementById('sort-options');
  if (sortSelect) sortSelect.value = currentSortOption;

  Auth.renderNavbar('recommendations');
  Auth.renderFooter();

  setupFilterListeners();
  loadInternships();
});

function switchMode(newMode) {
  currentMode = 'recommended';
  currentSortOption = 'match_desc';
  updateUIForCurrentMode();
  applyFiltersAndResetPagination();
}
window.switchMode = switchMode;

function updateUIForCurrentMode() {
  const breadcrumbActive = document.getElementById('breadcrumb-active');
  const sectionTitle = document.getElementById('section-title');
  const sectionSubtitle = document.getElementById('section-subtitle');
  const recommendedBanner = document.getElementById('recommended-active-banner');
  const resumeBanner = document.getElementById('resume-prompt-banner');
  const skillsSpan = document.getElementById('active-user-skills-list');

  // Update navbar active state
  Auth.renderNavbar('recommendations');

  // Header & breadcrumbs
  if (breadcrumbActive) breadcrumbActive.textContent = 'Recommended Companies';
  if (sectionTitle) sectionTitle.innerHTML = '<i class="bi bi-stars text-primary me-2"></i> Recommended Companies Tailored to Verified Skills';
  if (sectionSubtitle) {
    sectionSubtitle.textContent = 'Opportunities strictly tailored to your verified profile skills. Compare your extracted skill match percentage, view individual matching skill alignments, and check any missing skills required for 100% compatibility.';
  }

  // Show Skill Alignment filter in Recommended mode
  const minMatchContainer = document.getElementById('container-filter-min-match');
  if (minMatchContainer) minMatchContainer.classList.remove('d-none');

  // Default sort for recommended
  const sortSelect = document.getElementById('sort-options');
  if (sortSelect) {
    sortSelect.value = currentSortOption;
  }

  // Banners
  if (resumeBanner) resumeBanner.classList.add('d-none');
  if (recommendedBanner) {
    if (userSkillsList.length > 0) {
      recommendedBanner.classList.remove('d-none');
      if (skillsSpan) {
        skillsSpan.textContent = userSkillsList.slice(0, 8).join(', ') + (userSkillsList.length > 8 ? ` +${userSkillsList.length - 8} more` : '');
      }
    } else {
      recommendedBanner.classList.add('d-none');
    }
  }
}

function updateBadgeCounts() {
  const badgeRec = document.getElementById('badge-rec-count');
  if (badgeRec) {
    if (userSkillsList.length > 0) {
      const tailoredCount = allInternshipsData.filter((i) => (i.matchScore || 0) > 0 && i.matchingSkills && i.matchingSkills.length > 0).length;
      badgeRec.textContent = `${tailoredCount} Tailored`;
    } else {
      badgeRec.textContent = 'Resume Required';
    }
  }
}

function setupFilterListeners() {
  const searchInput = document.getElementById('search-input');
  const catSelect = document.getElementById('filter-category');
  const modeSelect = document.getElementById('filter-work-mode');
  const matchSelect = document.getElementById('filter-min-match');
  const sortSelect = document.getElementById('sort-options');
  const resetBtn = document.getElementById('btn-reset-filters');
  const loadMoreBtn = document.getElementById('btn-load-more');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilterSearch = e.target.value.trim();
      applyFiltersAndResetPagination();
    });
  }

  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      currentFilterCategory = e.target.value;
      applyFiltersAndResetPagination();
    });
  }

  if (modeSelect) {
    modeSelect.addEventListener('change', (e) => {
      currentFilterWorkMode = e.target.value;
      applyFiltersAndResetPagination();
    });
  }

  if (matchSelect) {
    matchSelect.addEventListener('change', (e) => {
      currentFilterMinMatch = e.target.value;
      applyFiltersAndResetPagination();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSortOption = e.target.value;
      applyFiltersAndResetPagination();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentFilterSearch = '';
      currentFilterCategory = 'All';
      currentFilterWorkMode = 'All';
      currentFilterMinMatch = '';
      currentSortOption = currentMode === 'recommended' ? 'match_desc' : 'newest';
      if (searchInput) searchInput.value = '';
      if (catSelect) catSelect.value = 'All';
      if (modeSelect) modeSelect.value = 'All';
      if (matchSelect) matchSelect.value = '';
      if (sortSelect) sortSelect.value = currentSortOption;
      applyFiltersAndResetPagination();
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentlyVisibleCount += PAGE_SIZE;
      renderCardsList();
    });
  }
}

async function loadInternships() {
  const container = document.getElementById('internships-container');
  if (!container) return;

  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted fw-semibold">Loading opportunities and computing skill-based compatibility...</p>
    </div>
  `;

  try {
    const headers = {};
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/internships', { headers });
    const data = await res.json();

    if (data.success && data.internships) {
      allInternshipsData = data.internships;
      userSkillsList = data.userSkills || [];

      updateBadgeCounts();
      updateUIForCurrentMode();
      applyFiltersAndResetPagination();
    } else {
      container.innerHTML = `<div class="col-12 text-center text-muted py-5">No internships found.</div>`;
    }
  } catch (err) {
    console.error('Error loading internships:', err);
    container.innerHTML = `<div class="col-12 text-center text-danger py-5">Failed to load internships. Please ensure server is running.</div>`;
  }
}

function applyFiltersAndResetPagination() {
  currentlyVisibleCount = PAGE_SIZE;

  // 1. Recommended Companies: Strictly filter to tailored matching opportunities
  if (!Auth.isLoggedIn() || userSkillsList.length === 0) {
    filteredInternships = [];
    renderRecommendedEmptyState();
    return;
  }
  let baseList = allInternshipsData.filter((item) => (item.matchScore || 0) > 0 && item.matchingSkills && item.matchingSkills.length > 0);

  // 2. Apply search filter
  if (currentFilterSearch) {
    const term = currentFilterSearch.toLowerCase();
    baseList = baseList.filter((item) => {
      const matchTitle = (item.title || '').toLowerCase().includes(term);
      const matchComp = (item.company || '').toLowerCase().includes(term);
      const matchDesc = (item.description || '').toLowerCase().includes(term);
      const matchLoc = (item.location || '').toLowerCase().includes(term);
      const matchSkills = (item.required_skills || []).some((s) => String(s).toLowerCase().includes(term));
      return matchTitle || matchComp || matchDesc || matchLoc || matchSkills;
    });
  }

  // 3. Apply category filter
  if (currentFilterCategory && currentFilterCategory !== 'All') {
    baseList = baseList.filter((item) => item.category === currentFilterCategory);
  }

  // 4. Apply work mode filter
  if (currentFilterWorkMode && currentFilterWorkMode !== 'All') {
    baseList = baseList.filter((item) => item.work_mode === currentFilterWorkMode);
  }

  // 5. Apply minimum match filter (if specified by user)
  if (currentFilterMinMatch) {
    const minVal = parseInt(currentFilterMinMatch, 10);
    baseList = baseList.filter((item) => (item.matchScore || 0) >= minVal);
  }

  // 6. Sorting
  if (currentSortOption === 'match_desc') {
    baseList.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || b.id - a.id);
  } else if (currentSortOption === 'match_asc') {
    baseList.sort((a, b) => (a.matchScore || 0) - (b.matchScore || 0) || b.id - a.id);
  } else if (currentSortOption === 'title_asc') {
    baseList.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else if (currentSortOption === 'newest') {
    baseList.sort((a, b) => b.id - a.id);
  }

  filteredInternships = baseList;
  renderCardsList();
}

let selectedInlineResumeFile = null;

function renderRecommendedEmptyState() {
  const container = document.getElementById('internships-container');
  const countLabel = document.getElementById('results-count-label');
  const loadMoreContainer = document.getElementById('load-more-container');
  if (loadMoreContainer) loadMoreContainer.classList.add('d-none');
  if (countLabel) countLabel.textContent = 'Upload Resume for Tailored Matches';

  if (!container) return;

  const isLoggedIn = Auth.isLoggedIn();
  container.innerHTML = `
    <div class="col-12 text-center py-4">
      <div class="card card-custom p-4 p-md-5 bg-white border max-w-700 mx-auto shadow-sm">
        <div class="rounded-circle d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary mx-auto mb-3" style="width: 72px; height: 72px; font-size: 2rem;">
          <i class="bi bi-file-earmark-arrow-up"></i>
        </div>
        <h4 class="fw-bold text-dark mb-2">Upload Your Resume for Recommended Companies</h4>
        <p class="text-secondary mb-4" style="max-width: 540px; margin: 0 auto;">
          The <strong>Recommended Companies</strong> section is strictly tailored to your verified technical skills. Upload your PDF or DOCX resume once, and relevant company recommendations will appear immediately below!
        </p>

        ${isLoggedIn ? `
          <!-- Inline Drag and Drop Resume Uploader -->
          <div id="inline-dropzone" class="border border-2 border-dashed rounded-4 p-4 mb-3 bg-light text-center" style="border-color: #cbd5e1 !important; cursor: pointer;">
            <i class="bi bi-cloud-arrow-up text-primary display-5 mb-2 d-block"></i>
            <div class="fw-bold text-dark" id="inline-drop-title">Click to choose or drag & drop your resume file</div>
            <small class="text-muted d-block">Supports PDF or DOCX formats (Max 5MB)</small>
            <input type="file" id="inline-resume-input" class="d-none" accept=".pdf,.docx,.doc">
            <div id="inline-selected-badge" class="badge bg-primary px-3 py-2 mt-2 d-none"></div>
          </div>

          <!-- Progress Bar -->
          <div id="inline-progress-box" class="mb-3 d-none">
            <div class="progress" style="height: 10px;">
              <div id="inline-progress-bar" class="progress-bar progress-bar-striped progress-bar-animated bg-primary" role="progressbar" style="width: 35%;"></div>
            </div>
            <small id="inline-progress-text" class="text-primary fw-semibold mt-2 d-block">Extracting skills and finding matching companies...</small>
          </div>

          <div class="d-flex flex-wrap justify-content-center gap-3">
            <button type="button" class="btn btn-brand px-4 py-2" id="btn-inline-upload-submit">
              <i class="bi bi-stars me-1"></i> Upload & Reveal Recommendations
            </button>
          </div>
        ` : `
          <div class="d-flex flex-wrap justify-content-center gap-3">
            <a href="login.html" class="btn btn-brand px-4 py-2">
              <i class="bi bi-box-arrow-in-right me-2"></i> Log In to Your Account
            </a>
          </div>
        `}
      </div>
    </div>
  `;

  if (isLoggedIn) {
    setupInlineResumeUpload();
  }
}

function setupInlineResumeUpload() {
  const dropzone = document.getElementById('inline-dropzone');
  const fileInput = document.getElementById('inline-resume-input');
  const badge = document.getElementById('inline-selected-badge');
  const submitBtn = document.getElementById('btn-inline-upload-submit');

  if (!dropzone || !fileInput) return;

  dropzone.onclick = () => fileInput.click();

  fileInput.onchange = (e) => {
    if (e.target.files && e.target.files[0]) {
      selectedInlineResumeFile = e.target.files[0];
      if (badge) {
        badge.textContent = `Selected: ${selectedInlineResumeFile.name}`;
        badge.classList.remove('d-none');
      }
    }
  };

  dropzone.ondragover = (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#4f46e5';
    dropzone.classList.add('bg-white');
  };

  dropzone.ondragleave = (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#cbd5e1';
    dropzone.classList.remove('bg-white');
  };

  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#cbd5e1';
    dropzone.classList.remove('bg-white');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectedInlineResumeFile = e.dataTransfer.files[0];
      if (badge) {
        badge.textContent = `Selected: ${selectedInlineResumeFile.name}`;
        badge.classList.remove('d-none');
      }
    }
  };

  if (submitBtn) {
    submitBtn.onclick = executeInlineResumeUpload;
  }
}

async function executeInlineResumeUpload() {
  if (!selectedInlineResumeFile) {
    Auth.showToast('Please select a PDF or DOCX resume first.', 'error');
    return;
  }

  const token = Auth.getToken();
  if (!token) {
    Auth.showToast('Please log in first to upload your resume.', 'error');
    return;
  }

  const progressBox = document.getElementById('inline-progress-box');
  const progressBar = document.getElementById('inline-progress-bar');
  const progressText = document.getElementById('inline-progress-text');
  const submitBtn = document.getElementById('btn-inline-upload-submit');

  if (submitBtn) submitBtn.disabled = true;
  if (progressBox) progressBox.classList.remove('d-none');
  if (progressBar) progressBar.style.width = '35%';
  if (progressText) progressText.textContent = 'Uploading resume document...';

  const formData = new FormData();
  formData.append('resume', selectedInlineResumeFile);

  try {
    if (progressBar) {
      setTimeout(() => {
        progressBar.style.width = '70%';
        if (progressText) progressText.textContent = 'Extracting skills and matching recommended companies...';
      }, 500);
    }

    const res = await fetch('/api/resume/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    if (progressBar) progressBar.style.width = '100%';

    if (data.success) {
      Auth.showToast('Resume parsed successfully! Displaying your tailored company recommendations.', 'success');

      // Update skills and reload data immediately
      userSkillsList = data.allUserSkills || data.detectedSkills || [];

      // Re-fetch internships to guarantee updated matching & missing skills calculations
      const fetchRes = await fetch('/api/internships', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const freshData = await fetchRes.json();
      if (freshData.success && freshData.internships) {
        allInternshipsData = freshData.internships;
        userSkillsList = freshData.userSkills || userSkillsList;
      }

      selectedInlineResumeFile = null;
      updateBadgeCounts();
      updateUIForCurrentMode();
      applyFiltersAndResetPagination();
    } else {
      Auth.showToast(data.message || 'Failed to analyze resume.', 'error');
      if (submitBtn) submitBtn.disabled = false;
      if (progressBox) progressBox.classList.add('d-none');
    }
  } catch (err) {
    console.error('Error during inline resume upload:', err);
    Auth.showToast('Network error while analyzing resume.', 'error');
    if (submitBtn) submitBtn.disabled = false;
    if (progressBox) progressBox.classList.add('d-none');
  }
}

function openInlineResumeUpload() {
  const container = document.getElementById('internships-container');
  if (!container) return;

  const uploadCardId = 'active-reupload-box';
  let existingBox = document.getElementById(uploadCardId);
  if (existingBox) {
    existingBox.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const uploadHtml = `
    <div class="col-12 mb-4" id="${uploadCardId}">
      <div class="card card-custom p-4 bg-white border border-primary border-opacity-50 shadow-sm">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold text-dark mb-0"><i class="bi bi-file-earmark-arrow-up text-primary me-2"></i> Update Your Resume</h5>
          <button type="button" class="btn-close" onclick="document.getElementById('${uploadCardId}').remove()"></button>
        </div>
        <p class="text-secondary small mb-3">Upload a new resume version to refresh your skills and update your recommended companies immediately.</p>
        
        <div id="inline-dropzone" class="border border-2 border-dashed rounded-4 p-4 mb-3 bg-light text-center" style="border-color: #cbd5e1 !important; cursor: pointer;">
          <i class="bi bi-cloud-arrow-up text-primary display-6 mb-2 d-block"></i>
          <div class="fw-bold text-dark">Click to select or drag & drop your updated resume</div>
          <small class="text-muted d-block">Supports PDF or DOCX format</small>
          <input type="file" id="inline-resume-input" class="d-none" accept=".pdf,.docx,.doc">
          <div id="inline-selected-badge" class="badge bg-primary px-3 py-2 mt-2 d-none"></div>
        </div>

        <div id="inline-progress-box" class="mb-3 d-none">
          <div class="progress" style="height: 10px;">
            <div id="inline-progress-bar" class="progress-bar progress-bar-striped progress-bar-animated bg-primary" role="progressbar" style="width: 35%;"></div>
          </div>
          <small id="inline-progress-text" class="text-primary fw-semibold mt-2 d-block">Analyzing resume and updating recommendations...</small>
        </div>

        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-secondary btn-sm" onclick="document.getElementById('${uploadCardId}').remove()">Cancel</button>
          <button type="button" class="btn btn-brand btn-sm px-4" id="btn-inline-upload-submit">
            <i class="bi bi-stars me-1"></i> Update & Refresh Recommendations
          </button>
        </div>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('afterbegin', uploadHtml);
  setupInlineResumeUpload();
  document.getElementById(uploadCardId).scrollIntoView({ behavior: 'smooth' });
}
window.openInlineResumeUpload = openInlineResumeUpload;

function renderCardsList() {
  const container = document.getElementById('internships-container');
  const countLabel = document.getElementById('results-count-label');
  const loadMoreContainer = document.getElementById('load-more-container');
  if (!container) return;

  const total = filteredInternships.length;
  const visibleItems = filteredInternships.slice(0, currentlyVisibleCount);

  if (countLabel) {
    if (currentMode === 'recommended') {
      if (total === 0) {
        countLabel.textContent = `0 tailored recommendations found`;
      } else {
        countLabel.textContent = `Showing ${visibleItems.length} of ${total} tailored opportunities matching your skills`;
      }
    } else {
      if (total === 0) {
        countLabel.textContent = `0 opportunities found`;
      } else {
        countLabel.textContent = `Showing ${visibleItems.length} of ${total} available opportunities across all domains`;
      }
    }
  }

  // Load More button visibility
  if (loadMoreContainer) {
    if (visibleItems.length < total) {
      loadMoreContainer.classList.remove('d-none');
      const loadBtn = document.getElementById('btn-load-more');
      if (loadBtn) {
        loadBtn.innerHTML = `<i class="bi bi-arrow-down-circle me-2"></i> Load More Opportunities (${total - visibleItems.length} remaining)`;
      }
    } else {
      loadMoreContainer.classList.add('d-none');
    }
  }

  if (total === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="text-warning fs-1 mb-2"><i class="bi bi-search"></i></div>
        <h5 class="fw-bold text-dark">No tailored recommendations match your active filters</h5>
        <p class="text-secondary small mb-3">Try clearing search terms or resetting alignment filters to see all tailored roles.</p>
        <div class="d-flex justify-content-center gap-2">
          <button class="btn btn-outline-primary btn-sm" onclick="document.getElementById('btn-reset-filters').click()">
            <i class="bi bi-arrow-counterclockwise me-1"></i> Reset Filters
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = visibleItems.map(renderInternshipCardFull).join('');
}

/**
 * Render single recommended company card:
 * - Extracted skill match percentage with progress bar
 * - List of matching skills with their individual alignment percentages
 * - List of required skills that are currently missing from the user's profile
 */
function renderInternshipCardFull(item) {
  const companyLogo = item.company_details?.logo_url || '';
  const logoHtml = companyLogo ? `
    <img src="${companyLogo}" alt="${item.company}" class="rounded-3 border me-2" style="width: 44px; height: 44px; object-fit: cover;" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'44\\' height=\\'44\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%236366f1\\'/><text x=\\'50%\\' y=\\'55%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'white\\' font-family=\\'sans-serif\\' font-weight=\\'bold\\' font-size=\\'18\\'>${item.company[0]}</text></svg>'">
  ` : `
    <div class="brand-icon-box me-2" style="width: 44px; height: 44px; font-size: 1.1rem;">${item.company[0]}</div>
  `;

  const isSaved = item.isSaved;
  const saveBtn = `
    <button class="btn btn-sm ${isSaved ? 'btn-warning text-dark' : 'btn-outline-secondary'}" onclick="handleToggleSave(${item.id})" title="${isSaved ? 'Remove from Saved' : 'Save Internship'}">
      <i class="bi ${isSaved ? 'bi-bookmark-heart-fill' : 'bi-bookmark-heart'} me-1"></i> ${isSaved ? 'Saved' : 'Save'}
    </button>
  `;

  // Total required skills and matching skills
  const reqSkillsList = item.required_skills || [];
  const totalRequiredSkills = reqSkillsList.length > 0 ? reqSkillsList.length : ((item.matchingSkills?.length || 0) + (item.missingSkills?.length || 0) || 1);
  const matchSkillsList = item.matchingSkills || [];
  const missingSkillsList = item.missingSkills || [];
  const matchingCount = matchSkillsList.length;

  let matchPercentage = 0;
  if (totalRequiredSkills > 0) {
    matchPercentage = Math.round((matchingCount / totalRequiredSkills) * 100);
  } else if (item.matchScore !== null && item.matchScore !== undefined) {
    matchPercentage = Math.round(Number(item.matchScore));
  }

  // Individual alignment percentage per required skill (e.g. 20%, 25%, 33.3%)
  const indAlignmentPct = totalRequiredSkills > 0 ? (100 / totalRequiredSkills).toFixed(1).replace('.0', '') : '0';

  const matchBadgeBg = matchPercentage >= 70 ? 'bg-success text-white' : (matchPercentage >= 40 ? 'bg-primary text-white' : 'bg-warning text-dark');
  const matchProgressBg = matchPercentage >= 70 ? 'bg-success' : (matchPercentage >= 40 ? 'bg-primary' : 'bg-warning');

  const matchingBadges = matchSkillsList.map(
    (s) => `<span class="skill-tag skill-tag-matched"><i class="bi bi-check2 text-success me-1"></i>${s} <span class="badge bg-success text-white ms-1 rounded-pill small">+${indAlignmentPct}%</span></span>`
  ).join('');

  const missingBadges = missingSkillsList.map(
    (s) => `<span class="skill-tag skill-tag-missing"><i class="bi bi-x-circle text-danger me-1"></i>${s} <span class="badge bg-danger text-white ms-1 rounded-pill small">Missing (-${indAlignmentPct}%)</span></span>`
  ).join('');

  return `
    <div class="col-lg-6 col-12 mb-4">
      <div class="card card-custom h-100 p-4 d-flex flex-column justify-content-between border-primary border-opacity-25 shadow-sm"
           onclick="if (!event.target.closest('button, a, input, select')) window.location.href='company-details.html?id=${item.id}'"
           style="cursor: pointer;"
           title="Click to view full Company Details for ${item.company}">
        <div>
          <!-- Header: Category & Match Percentage Badge -->
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill fw-semibold me-1">
                ${item.category}
              </span>
              <span class="badge bg-warning bg-opacity-10 text-dark px-2 py-1 rounded-pill small fw-semibold">
                Tailored Match
              </span>
            </div>
            <span class="badge ${matchBadgeBg} px-3 py-1 rounded-pill small fw-bold shadow-sm">
              <i class="bi bi-pie-chart-fill me-1"></i> ${matchPercentage}% Match
            </span>
          </div>

          <!-- Company Name & Internship Title -->
          <div class="d-flex align-items-center mt-3 mb-2">
            <a href="company-details.html?id=${item.id}" class="text-decoration-none">
              ${logoHtml}
            </a>
            <div>
              <a href="company-details.html?id=${item.id}" class="text-decoration-none text-dark">
                <h5 class="fw-bold mb-0 text-dark transition-hover">${item.title}</h5>
              </a>
              <div class="text-muted fw-semibold small mt-1">
                <a href="company-details.html?id=${item.id}" class="text-decoration-none text-muted">
                  <i class="bi bi-building me-1 text-primary"></i> <strong class="text-dark fs-6">${item.company}</strong>
                </a>
                &bull; <i class="bi bi-geo-alt me-1"></i> ${item.location}
              </div>
            </div>
          </div>

          <!-- Quick Specs Badges -->
          <div class="d-flex flex-wrap gap-2 mb-3 mt-2">
            <span class="badge bg-light text-dark border px-2 py-1"><i class="bi bi-laptop me-1 text-primary"></i> ${item.work_mode}</span>
            <span class="badge bg-light text-dark border px-2 py-1"><i class="bi bi-cash me-1 text-success"></i> ${item.stipend || 'Competitive'}</span>
            <span class="badge bg-light text-dark border px-2 py-1"><i class="bi bi-clock me-1 text-warning"></i> ${item.duration}</span>
            <span class="badge bg-light text-dark border px-2 py-1"><i class="bi bi-calendar-event me-1 text-danger"></i> Deadline: ${item.deadline || 'Ongoing'}</span>
          </div>

          <!-- Description Preview -->
          <p class="small text-secondary mb-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${item.description || ''}
          </p>

          <!-- Eligibility -->
          <p class="small text-secondary mb-3">
            <strong>Eligibility:</strong> ${item.eligibility}
          </p>

          <!-- 1. Extracted Skill Match Percentage & Simple Progress Bar -->
          <div class="card p-3 bg-light border mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="small fw-bold text-dark d-flex align-items-center">
                <i class="bi bi-speedometer2 text-primary me-2 fs-6"></i> Extracted Skill Match Percentage:
              </span>
              <span class="badge ${matchBadgeBg} px-2 py-1 fw-bold fs-6">
                ${matchPercentage}%
              </span>
            </div>
            <div class="progress" style="height: 10px; border-radius: 5px; background-color: #e2e8f0;">
              <div class="progress-bar ${matchProgressBg} progress-bar-striped" 
                   role="progressbar" 
                   style="width: ${matchPercentage}%;" 
                   aria-valuenow="${matchPercentage}" 
                   aria-valuemin="0" 
                   aria-valuemax="100">
              </div>
            </div>
            <div class="d-flex justify-content-between align-items-center small text-muted mt-2" style="font-size: 0.76rem;">
              <span><i class="bi bi-check2-circle text-success me-1"></i> ${matchingCount} of ${totalRequiredSkills} required skills matched</span>
              <span>Formula: (${matchingCount} / ${totalRequiredSkills}) &times; 100 = <strong>${matchPercentage}%</strong></span>
            </div>
          </div>

          <!-- 2. Matching Skills with Individual Alignment Percentages -->
          <div class="mb-3 p-3 rounded bg-white border border-success border-opacity-50">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <small class="fw-bold text-success d-flex align-items-center">
                <i class="bi bi-check-circle-fill me-1"></i> Matching Skills from Profile (${matchingCount}):
              </small>
              <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small">
                ${indAlignmentPct}% alignment each
              </span>
            </div>
            ${matchingBadges ? `
              <div class="d-flex flex-wrap gap-1">${matchingBadges}</div>
            ` : `
              <small class="text-muted fst-italic">No matching skills detected from profile.</small>
            `}
          </div>

          <!-- 3. Required Skills Currently Missing from User's Profile -->
          ${missingSkillsList.length > 0 ? `
            <div class="mb-3 p-3 rounded bg-light border border-danger border-opacity-25">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <small class="fw-bold text-danger d-flex align-items-center">
                  <i class="bi bi-exclamation-triangle-fill me-1"></i> Required Skills Missing From Profile (${missingSkillsList.length}):
                </small>
                <span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 small">
                  ${missingSkillsList.length} Missing
                </span>
              </div>
              <div class="d-flex flex-wrap gap-1">${missingBadges}</div>
              <small class="text-muted d-block mt-2" style="font-size: 0.74rem;">
                <i class="bi bi-info-circle text-primary me-1"></i> Adding these ${missingSkillsList.length} skill${missingSkillsList.length === 1 ? '' : 's'} will achieve a 100% match for ${item.company}.
              </small>
            </div>
          ` : `
            <div class="small mb-3 p-3 rounded bg-success bg-opacity-10 text-success border border-success border-opacity-25 fw-semibold">
              <i class="bi bi-patch-check-fill me-1"></i> 100% Verified Match! No missing skills &mdash; your verified skills fully cover this opportunity.
            </div>
          `}
        </div>

        <!-- Action Buttons: Company Details Page, Save, Apply Now -->
        <div class="pt-3 border-top d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
          <div class="d-flex gap-2">
            <a href="company-details.html?id=${item.id}" class="btn btn-outline-primary btn-sm px-3 fw-semibold">
              <i class="bi bi-building me-1"></i> Company Details
            </a>
            <button class="btn btn-outline-secondary btn-sm px-2" onclick="openDetailsModal(${item.id})" title="Quick Preview Modal">
              <i class="bi bi-info-circle me-1"></i>
            </button>
            ${saveBtn}
          </div>
          ${(item.hasApplied && (item.applicationStatus === 'Applied' || item.applicationStatus === 'Application Started'))
            ? `<button class="btn btn-success btn-sm px-3 shadow-sm" onclick="showAppliedSuccessModal(${item.id})">
                 <i class="bi bi-check-circle-fill me-1"></i> Applied
               </button>`
            : `<button class="btn btn-brand btn-sm px-3 shadow-sm" onclick="handleApplyClick(${item.id})">
                 <i class="bi bi-send me-1"></i> Apply Now
               </button>`
          }
        </div>
      </div>
    </div>
  `;
}

/**
 * Open Complete Company & Internship Details Modal (Feature 3)
 * Displays all details and roadmap to 100% match (without numeric percentages).
 */
function openDetailsModal(id) {
  const item = allInternshipsData.find((x) => x.id === id);
  if (!item) return;

  selectedInternship = item;
  const comp = item.company_details || {};

  document.getElementById('modal-title').textContent = item.title;
  document.getElementById('modal-company-name').textContent = comp.name || item.company;
  document.getElementById('modal-company-desc').textContent = comp.description || 'Enterprise technology organization.';
  
  // Full address
  const fullAddress = [comp.address, comp.city, comp.state, comp.country].filter(Boolean).join(', ') || item.location;
  document.getElementById('modal-company-address').textContent = fullAddress;

  // Contact emails
  const contactEmail = comp.contact_email || 'contact@example.com';
  const recruitEmail = comp.recruitment_email || contactEmail;
  document.getElementById('modal-contact-email').textContent = contactEmail;
  document.getElementById('modal-recruitment-email').textContent = recruitEmail;

  // Specs
  document.getElementById('modal-mode').textContent = item.work_mode;
  document.getElementById('modal-stipend').textContent = item.stipend || 'Competitive';
  document.getElementById('modal-duration').textContent = item.duration;
  document.getElementById('modal-deadline').textContent = item.deadline || 'Ongoing';
  document.getElementById('modal-eligibility').textContent = item.eligibility;
  document.getElementById('modal-description').textContent = item.description;

  // Required Technical Skills
  const reqSkillsList = document.getElementById('modal-required-skills');
  if (reqSkillsList) {
    reqSkillsList.innerHTML = (item.required_skills || []).map((s) => `<span class="skill-tag me-1 mb-1">${s}</span>`).join('');
  }

  // Skills Roadmap & Match Percentage in Modal (Strictly for Recommended Companies mode)
  const roadmapContainer = document.getElementById('modal-skills-roadmap-container');
  if (roadmapContainer) {
    if (userSkillsList && userSkillsList.length > 0) {
      const modalReqSkills = item.required_skills || [];
      const modalTotalReq = modalReqSkills.length > 0 ? modalReqSkills.length : 1;
      const modalMatching = (item.matchingSkills || []).length;
      let modalMatchPct = modalReqSkills.length > 0 ? Math.round((modalMatching / modalTotalReq) * 100) : (item.matchScore || 0);
      const indAlignmentPct = modalTotalReq > 0 ? (100 / modalTotalReq).toFixed(1).replace('.0', '') : '0';
      const modalProgressBg = modalMatchPct >= 70 ? 'bg-success' : (modalMatchPct >= 40 ? 'bg-primary' : 'bg-warning');
      const modalBadgeBg = modalMatchPct >= 70 ? 'bg-success text-white' : (modalMatchPct >= 40 ? 'bg-primary text-white' : 'bg-warning text-dark');

      const matchBadges = (item.matchingSkills || []).map((s) => `
        <span class="skill-tag skill-tag-matched">
          <i class="bi bi-check2 text-success me-1"></i>${s}
          <span class="badge bg-success text-white ms-1 rounded-pill small">+${indAlignmentPct}%</span>
        </span>
      `).join('');
      const missingBadges = (item.missingSkills || []).map((s) => `
        <span class="skill-tag skill-tag-missing">
          <i class="bi bi-x-circle text-danger me-1"></i>${s}
          <span class="badge bg-danger text-white ms-1 rounded-pill small">Missing (-${indAlignmentPct}%)</span>
        </span>
      `).join('');

      roadmapContainer.innerHTML = `
        <div class="card p-3 bg-light border mb-3">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="small fw-bold text-dark d-flex align-items-center">
              <i class="bi bi-speedometer2 text-primary me-2 fs-6"></i> Extracted Skill Match Percentage:
            </span>
            <span class="badge ${modalBadgeBg} px-2 py-1 fw-bold fs-6">
              ${modalMatchPct}%
            </span>
          </div>
          <div class="progress mb-2" style="height: 10px; border-radius: 5px; background-color: #e2e8f0;">
            <div class="progress-bar ${modalProgressBg} progress-bar-striped" role="progressbar" style="width: ${modalMatchPct}%;" aria-valuenow="${modalMatchPct}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
          <div class="d-flex justify-content-between small text-muted mb-3" style="font-size: 0.78rem;">
            <span><i class="bi bi-check2-circle text-success me-1"></i> ${modalMatching} of ${modalReqSkills.length} required skills matched</span>
            <span>Formula: (${modalMatching} / ${modalReqSkills.length}) &times; 100 = <strong>${modalMatchPct}%</strong></span>
          </div>

          <!-- Matching skills with individual alignment percentages -->
          <div class="mb-3 p-3 rounded bg-white border border-success border-opacity-50">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <small class="fw-bold text-success d-flex align-items-center">
                <i class="bi bi-check-circle-fill me-1"></i> Matching Skills from Profile (${modalMatching}):
              </small>
              <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small">
                ${indAlignmentPct}% alignment each
              </span>
            </div>
            ${matchBadges ? `
              <div class="d-flex flex-wrap gap-1">${matchBadges}</div>
            ` : `
              <small class="text-muted fst-italic">No matching skills detected from profile.</small>
            `}
          </div>

          <!-- Required skills missing from profile -->
          ${(item.missingSkills && item.missingSkills.length > 0) ? `
            <div class="p-3 rounded-3 bg-light border border-danger border-opacity-25 mt-2">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <small class="fw-bold text-danger d-flex align-items-center">
                  <i class="bi bi-exclamation-triangle-fill me-1"></i> Required Skills Missing From Profile (${item.missingSkills.length}):
                </small>
                <span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 small">
                  ${item.missingSkills.length} Missing
                </span>
              </div>
              <div class="d-flex flex-wrap gap-1">${missingBadges}</div>
              <small class="text-muted d-block mt-2" style="font-size: 0.74rem;">
                <i class="bi bi-info-circle text-primary me-1"></i> Adding these ${item.missingSkills.length} skill${item.missingSkills.length === 1 ? '' : 's'} will raise your alignment to 100% for ${comp.name || item.company}.
              </small>
            </div>
          ` : `
            <div class="p-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 mt-2">
              <small class="text-success fw-bold d-block">
                <i class="bi bi-patch-check-fill me-1"></i> 100% Match Achieved! You possess all required technical skills for ${comp.name || item.company}.
              </small>
            </div>
          `}
        </div>
      `;
    } else {
      roadmapContainer.innerHTML = '';
    }
  }

  // Perks
  const perksList = document.getElementById('modal-perks');
  if (perksList) {
    perksList.innerHTML = (item.perks || []).map((p) => `<li><i class="bi bi-award text-primary me-2"></i>${p}</li>`).join('');
  }

  // 0. Dedicated Company Details Page button
  const compDetailsBtn = document.getElementById('modal-btn-company-details');
  if (compDetailsBtn) {
    compDetailsBtn.href = `company-details.html?id=${item.id}`;
  }

  // 1. View Company Website button
  const websiteBtn = document.getElementById('modal-btn-website');
  if (websiteBtn) {
    websiteBtn.onclick = () => {
      const KNOWN_COMPANY_WEBSITES = {
        'Kissflow': 'https://kissflow.com',
        'Zoho Corporation': 'https://www.zoho.com',
        'Freshworks': 'https://www.freshworks.com',
        'GUVI Geek Networks': 'https://www.guvi.in',
        'Ramco Systems': 'https://www.ramco.com',
        'Chargebee Technologies': 'https://www.chargebee.com',
        'LatentView Analytics': 'https://www.latentview.com',
        'Kaar Technologies': 'https://www.kaartech.com'
      };
      const compName = item.company || comp.name || '';
      let url = comp.website;
      if (!url || url.startsWith('/demo-company') || url.includes('example.')) {
        url = KNOWN_COMPANY_WEBSITES[compName] || `https://${compName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    };
  }

  // 2. View on Google Maps button (Feature 3)
  const mapsBtn = document.getElementById('modal-btn-maps');
  if (mapsBtn) {
    mapsBtn.onclick = () => {
      const query = encodeURIComponent(fullAddress);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };
  }

  // 3. Email Company button (Feature 4)
  const emailBtn = document.getElementById('modal-btn-email');
  if (emailBtn) {
    emailBtn.onclick = () => {
      openEmailComposerModal(item, recruitEmail);
    };
  }

  // 4. Apply Now button (Feature 5)
  const applyBtn = document.getElementById('modal-btn-apply');
  if (applyBtn) {
    if (item.hasApplied && (item.applicationStatus === 'Applied' || item.applicationStatus === 'Application Started')) {
      applyBtn.className = 'btn btn-success btn-sm';
      applyBtn.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> Applied';
      applyBtn.onclick = () => {
        showAppliedSuccessModal(item.id);
      };
    } else {
      applyBtn.className = 'btn btn-brand btn-sm';
      applyBtn.innerHTML = '<i class="bi bi-send me-1"></i> Apply Now';
      applyBtn.onclick = () => {
        handleApplyClick(item.id);
      };
    }
  }

  // 5. Save Internship button (Feature 7)
  const saveBtn = document.getElementById('modal-btn-save');
  if (saveBtn) {
    saveBtn.className = item.isSaved ? 'btn btn-warning' : 'btn btn-outline-warning text-dark';
    saveBtn.innerHTML = `<i class="bi ${item.isSaved ? 'bi-bookmark-heart-fill' : 'bi-bookmark-heart'} me-1"></i> ${item.isSaved ? 'Saved' : 'Save Internship'}`;
    saveBtn.onclick = async () => {
      await handleToggleSave(item.id);
      saveBtn.className = item.isSaved ? 'btn btn-warning' : 'btn btn-outline-warning text-dark';
      saveBtn.innerHTML = `<i class="bi ${item.isSaved ? 'bi-bookmark-heart-fill' : 'bi-bookmark-heart'} me-1"></i> ${item.isSaved ? 'Saved' : 'Save Internship'}`;
    };
  }

  const modalInstance = new bootstrap.Modal(document.getElementById('internshipDetailsModal'));
  modalInstance.show();
}

/**
 * Email Company Modal with prefilled editable template (Feature 4)
 */
function openEmailComposerModal(item, targetEmail) {
  const user = Auth.getUser();
  const studentName = user?.name || 'Applicant';
  const roleTitle = item.title;

  const subject = `Internship Application Inquiry — ${roleTitle}`;
  const body = `Dear Recruitment Team,

I am interested in the ${roleTitle} internship opportunity at ${item.company}. I would like to learn more about the role, eligibility requirements, and application process.

Please find my details available in my application profile.

Thank you for your time and consideration.

Best regards,
${studentName}`;

  document.getElementById('email-composer-to').value = targetEmail;
  document.getElementById('email-composer-subject').value = subject;
  document.getElementById('email-composer-body').value = body;

  const launchMailtoBtn = document.getElementById('btn-launch-mailto');
  if (launchMailtoBtn) {
    launchMailtoBtn.onclick = () => {
      const to = encodeURIComponent(document.getElementById('email-composer-to').value);
      const sub = encodeURIComponent(document.getElementById('email-composer-subject').value);
      const msg = encodeURIComponent(document.getElementById('email-composer-body').value);

      const mailtoUrl = `mailto:${to}?subject=${sub}&body=${msg}`;
      window.location.href = mailtoUrl;

      Auth.showToast('Opened your default email application. Please review and send your message.', 'info');
      const emailModal = bootstrap.Modal.getInstance(document.getElementById('emailComposerModal'));
      if (emailModal) emailModal.hide();
    };
  }

  const emailModalInstance = new bootstrap.Modal(document.getElementById('emailComposerModal'));
  emailModalInstance.show();
}

/**
 * Handle Apply Now Click (Feature 5)
 * Immediately records application, marks as Applied, and displays celebratory Applied Successfully modal
 */
async function handleApplyClick(id) {
  if (!Auth.isLoggedIn()) {
    Auth.showToast('Please log in first to apply and track your internships.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
    return;
  }

  try {
    // 1. Record application click session
    await Auth.authFetch(`/api/internships/${id}/apply`, {
      method: 'POST'
    });

    // 2. Officially submit application to employer portal and mark as 'Applied'
    const res = await Auth.authFetch(`/api/internships/${id}/portal-submit`, {
      method: 'POST',
      body: JSON.stringify({ notes: 'Applied directly from platform recommendations' })
    });
    const data = await res.json();

    if (data.success) {
      // Update state in local data
      const item = allInternshipsData.find((x) => x.id === id);
      if (item) {
        item.hasApplied = true;
        item.applicationStatus = 'Applied';
      }

      // Show celebratory "Applied Successfully!" toast notification
      Auth.showToast(`Applied Successfully! 🎉 Your application for "${item?.title || 'this role'}" has been submitted.`, 'success');

      // Show celebratory "Applied Successfully!" modal popup
      showAppliedSuccessModal(id);

      // Re-render cards so button updates to green "Applied"
      renderCardsList();
    } else {
      Auth.showToast(data.message || 'Application tracking error.', 'error');
    }
  } catch (err) {
    console.error('Apply error:', err);
    Auth.showToast('Network error while processing application click.', 'error');
  }
}

/**
 * Show Celebratory "Applied Successfully!" Modal Popup or Sophisticated Particles Effect
 */
function showAppliedSuccessModal(id) {
  const item = allInternshipsData.find((x) => x.id === id) || selectedInternship;
  if (!item) return;

  // Close details modal if currently open
  const detailsModalEl = document.getElementById('internshipDetailsModal');
  if (detailsModalEl) {
    const detailsModal = bootstrap.Modal.getInstance(detailsModalEl);
    if (detailsModal) detailsModal.hide();
  }

  // Trigger sophisticated floating particles effect & subtle accomplishment notification
  if (window.ApplicationSuccessEffect) {
    const portalUrl = `/demo-application-portal.html?id=${item.id}`;
    let matchPct = null;
    const reqSkills = item.required_skills || [];
    if (reqSkills.length > 0 && item.matchingSkills) {
      matchPct = Math.round((item.matchingSkills.length / reqSkills.length) * 100);
    } else if (item.matchScore !== null && item.matchScore !== undefined) {
      matchPct = Math.round(Number(item.matchScore));
    }

    window.ApplicationSuccessEffect.trigger({
      roleTitle: item.title,
      companyName: item.company,
      matchScore: matchPct,
      portalUrl: portalUrl
    });
    return;
  }

  const roleEl = document.getElementById('success-modal-role');
  const compEl = document.getElementById('success-modal-company');
  const compNameEl = document.getElementById('success-modal-comp-name');
  const dateEl = document.getElementById('success-modal-date');
  const portalBtn = document.getElementById('success-modal-portal-btn');

  if (roleEl) roleEl.textContent = item.title;
  if (compEl) compEl.textContent = item.company;
  if (compNameEl) compNameEl.textContent = item.company;
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ' (Just Now)';
  }
  if (portalBtn) {
    portalBtn.href = `/demo-application-portal.html?id=${item.id}`;
  }

  const successModalEl = document.getElementById('appliedSuccessModal');
  if (successModalEl) {
    const successModal = new bootstrap.Modal(successModalEl);
    successModal.show();
  }
}

/**
 * Toggle Save / Bookmark Internship (Feature 7)
 */
async function handleToggleSave(id) {
  if (!Auth.isLoggedIn()) {
    Auth.showToast('Please log in first to save internships.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
    return;
  }

  const item = allInternshipsData.find((x) => x.id === id);
  if (!item) return;

  const isCurrentlySaved = item.isSaved;
  const endpoint = `/api/internships/${id}/save`;
  const method = isCurrentlySaved ? 'DELETE' : 'POST';

  try {
    const res = await Auth.authFetch(endpoint, { method });
    const data = await res.json();

    if (data.success) {
      item.isSaved = !isCurrentlySaved;
      Auth.showToast(data.message, 'success');
      renderCardsList();
    } else {
      Auth.showToast(data.message || 'Could not update saved status.', 'error');
    }
  } catch (err) {
    console.error('Save error:', err);
    Auth.showToast('Network error while updating saved internship.', 'error');
  }
}
