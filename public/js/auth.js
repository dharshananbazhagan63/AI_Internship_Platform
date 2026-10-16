/**
 * AI Internship Aggregator and Recommendation Platform
 * Client-Side Authentication and Global Utilities
 */

const Auth = {
  TOKEN_KEY: 'ai_internship_jwt_token',
  USER_KEY: 'ai_internship_user_data',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setSession(token, user) {
    if (token) localStorage.setItem(this.TOKEN_KEY, token);
    if (user) localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  isLoggedIn() {
    const token = this.getToken();
    return !!token;
  },

  logout() {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    this.clearSession();
    window.location.href = 'login.html';
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  requireGuest() {
    if (this.isLoggedIn()) {
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  },

  apiUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (window.location.protocol === 'file:') {
      return 'http://localhost:3000' + (url.startsWith('/') ? '' : '/') + url;
    }
    return url;
  },

  /**
   * Wrapper for fetch with JWT authorization header automatically attached
   */
  async authFetch(url, options = {}) {
    const fullUrl = this.apiUrl(url);
    const headers = options.headers ? new Headers(options.headers) : new Headers();
    const token = this.getToken();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(fullUrl, { ...options, headers });

    if (response.status === 401) {
      // Session expired or invalid
      this.clearSession();
      if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
        window.location.href = 'login.html';
      }
    }

    return response;
  },

  /**
   * Dynamically renders standard navigation bar
   */
  renderNavbar(activePage = '') {
    const navPlaceholder = document.getElementById('navbar-container');
    if (!navPlaceholder) return;

    const loggedIn = this.isLoggedIn();
    const user = this.getUser();

    const html = `
      <nav class="navbar navbar-expand-lg navbar-custom sticky-top">
        <div class="container">
          <a class="navbar-brand navbar-brand-logo" href="index.html">
            <span class="brand-icon-box"><i class="bi bi-cpu"></i></span>
            <span>AI InternHub</span>
          </a>
          <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navMenu">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
              <li class="nav-item">
                <a class="nav-link ${activePage === 'home' ? 'active' : ''}" href="index.html">
                  <i class="bi bi-house me-1"></i> Home
                </a>
              </li>
              ${loggedIn ? `
                <li class="nav-item">
                  <a class="nav-link ${activePage === 'upload' ? 'active' : ''}" href="upload-resume.html">
                    <i class="bi bi-file-earmark-arrow-up me-1"></i> Upload Resume
                  </a>
                </li>
              ` : ''}
              <li class="nav-item">
                <a class="nav-link ${activePage === 'internships' ? 'active' : ''}" href="internships.html">
                  <i class="bi bi-briefcase me-1"></i> Find Internships
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link ${activePage === 'recommendations' ? 'active' : ''}" href="internships.html?filter=recommended">
                  <i class="bi bi-stars me-1"></i> Recommended Companies
                </a>
              </li>
              ${loggedIn ? `
                <li class="nav-item">
                  <a class="nav-link ${activePage === 'saved' ? 'active' : ''}" href="saved.html">
                    <i class="bi bi-bookmark-heart me-1"></i> Saved Internships
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link ${activePage === 'applications' ? 'active' : ''}" href="applications.html">
                    <i class="bi bi-kanban me-1"></i> My Applications
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link ${activePage === 'profile' ? 'active' : ''}" href="profile.html">
                    <i class="bi bi-person-lines-fill me-1"></i> My Profile
                  </a>
                </li>
              ` : ''}
            </ul>

            <div class="d-flex align-items-center gap-2">
              ${loggedIn ? `
                <div class="dropdown">
                  <button class="btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2 rounded-pill px-3 py-1" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle text-primary fs-5"></i>
                    <span class="fw-semibold text-truncate" style="max-width: 130px;">${user?.name || 'Student'}</span>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 mt-2">
                    <li class="px-3 py-2 border-bottom">
                      <div class="fw-bold text-dark">${user?.name || 'Student'}</div>
                      <small class="text-muted">${user?.college_name || 'College Student'}</small>
                    </li>
                    <li><a class="dropdown-item py-2" href="dashboard.html"><i class="bi bi-speedometer2 me-2 text-primary"></i> Dashboard</a></li>
                    <li><a class="dropdown-item py-2" href="applications.html"><i class="bi bi-kanban me-2 text-success"></i> My Applications</a></li>
                    <li><a class="dropdown-item py-2" href="saved.html"><i class="bi bi-bookmark-heart me-2 text-warning"></i> Saved Internships</a></li>
                    <li><a class="dropdown-item py-2" href="profile.html"><i class="bi bi-person-lines-fill me-2 text-primary"></i> My Profile</a></li>
                    <li><a class="dropdown-item py-2" href="upload-resume.html"><i class="bi bi-file-earmark-text me-2 text-primary"></i> My Resume</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger py-2" href="#" onclick="Auth.logout()"><i class="bi bi-box-arrow-right me-2"></i> Logout</a></li>
                  </ul>
                </div>
              ` : `
                <a href="login.html" class="btn btn-brand-outline btn-sm px-3">Login</a>
                <a href="register.html" class="btn btn-brand btn-sm px-3">Create Account</a>
              `}
            </div>
          </div>
        </div>
      </nav>
    `;

    navPlaceholder.innerHTML = html;
  },

  /**
   * Dynamically renders standard footer
   */
  renderFooter() {
    const footerPlaceholder = document.getElementById('footer-container');
    if (!footerPlaceholder) return;

    const html = `
      <footer class="footer-custom">
        <div class="container">
          <div class="row g-4">
            <div class="col-lg-4 col-md-6">
              <div class="d-flex align-items-center gap-2 mb-3">
                <span class="brand-icon-box"><i class="bi bi-cpu"></i></span>
                <span class="fs-5 fw-bold text-white">AI InternHub</span>
              </div>
              <p class="small text-secondary mb-3">
                AI Internship Aggregator and Recommendation Platform. Developed as a modern college capstone project powered by Node.js, Express, and SQLite.
              </p>
              <div class="d-flex gap-2">
                <span class="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-50">Node.js</span>
                <span class="badge bg-indigo bg-opacity-25 text-info border border-info border-opacity-50">Express</span>
                <span class="badge bg-secondary bg-opacity-25 text-light border border-light border-opacity-25">SQLite</span>
                <span class="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50">JWT</span>
              </div>
            </div>

            <div class="col-lg-2 col-md-6">
              <h6 class="text-white fw-bold mb-3">Platform Links</h6>
              <a href="index.html" class="footer-link">Home</a>
              <a href="internships.html" class="footer-link">Find Internships</a>
              <a href="internships.html?filter=recommended" class="footer-link">Recommended Companies</a>
              <a href="upload-resume.html" class="footer-link">Upload Resume</a>
              <a href="dashboard.html" class="footer-link">Student Dashboard</a>
            </div>

            <div class="col-lg-3 col-md-6">
              <h6 class="text-white fw-bold mb-3">Key Features</h6>
              <div class="footer-link"><i class="bi bi-check2 text-primary me-2"></i> PDF & DOCX Parsing</div>
              <div class="footer-link"><i class="bi bi-check2 text-primary me-2"></i> Automatic Skill Extraction</div>
              <div class="footer-link"><i class="bi bi-check2 text-primary me-2"></i> Skill Gap Analysis</div>
              <div class="footer-link"><i class="bi bi-check2 text-primary me-2"></i> Zero XAMPP / Native SQLite</div>
            </div>

            <div class="col-lg-3 col-md-6">
              <h6 class="text-white fw-bold mb-3">College Project Demo</h6>
              <p class="small text-secondary">
                Designed for college faculty demonstrations. Real-time recommendation calculations comparing student resume skills against role requirements.
              </p>
              <p class="small text-secondary mb-0">
                <i class="bi bi-shield-check text-success me-1"></i> Passwords secured with bcrypt
              </p>
            </div>
          </div>

          <hr class="border-secondary my-4">

          <div class="d-flex flex-wrap justify-content-between align-items-center small text-secondary">
            <div>&copy; 2026 AI Internship Aggregator and Recommendation Platform. All rights reserved.</div>
            <div class="mt-2 mt-sm-0">Runs locally on Node.js & SQLite (No Apache/MySQL/PHP required)</div>
          </div>
        </div>
      </footer>
    `;

    footerPlaceholder.innerHTML = html;
  },

  /**
   * Helper to show toast messages
   */
  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || (() => {
      const el = document.createElement('div');
      el.id = 'toast-container';
      el.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      el.style.zIndex = '1100';
      document.body.appendChild(el);
      return el;
    })();

    const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-primary';
    const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white ${bgClass} border-0 shadow-lg rounded-3 mb-2`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icon} fs-5"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    toastContainer.appendChild(toastEl);
    const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
    bsToast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  }
};
