/**
 * AI Internship Aggregator and Recommendation Platform
 * Sophisticated Application Success Animation & Floating Particles Effect
 * 
 * Features:
 * - High-performance 60fps canvas particle engine with upward-drifting luminescence
 * - Micro-orbs, starlight sparkles, geometric diamond shards, and delicate rings
 * - Smooth Brownian sine-wave horizontal flutter with air-drag deceleration
 * - Graceful fade-out giving a sense of accomplishment without relying on any specific color palette
 * - Refined, subtle glassmorphic success notification with animated SVG checkmark draw
 */

(function () {
  'use strict';

  const SuccessEffect = {
    canvas: null,
    ctx: null,
    particles: [],
    animationFrameId: null,
    overlayEl: null,
    notificationEl: null,
    isActive: false,

    /**
     * Trigger the full application success animation
     * @param {Object} options - { roleTitle, companyName, matchScore, portalUrl }
     */
    trigger(options = {}) {
      const {
        roleTitle = 'Internship Opportunity',
        companyName = 'Partner Company',
        matchScore = null,
        portalUrl = '#'
      } = options;

      // 1. Initialize or reset canvas
      this.initCanvas();

      // 2. Spawn sophisticated upward-drifting particles
      this.spawnParticles();

      // 3. Render and display the subtle glassmorphic success notification
      this.displayNotification({ roleTitle, companyName, matchScore, portalUrl });

      // 4. Start the 60fps animation loop
      if (!this.isActive) {
        this.isActive = true;
        this.lastTime = performance.now();
        this.animate = this.animate.bind(this);
        this.animationFrameId = requestAnimationFrame(this.animate);
      }
    },

    /**
     * Create or resize full-screen high-DPI canvas overlay
     */
    initCanvas() {
      let canvas = document.getElementById('success-particles-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'success-particles-canvas';
        canvas.className = 'success-particles-canvas';
        document.body.appendChild(canvas);
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';

      this.ctx = canvas.getContext('2d');
      this.ctx.scale(dpr, dpr);
      this.canvas = canvas;

      // Window resize listener
      window.onresize = () => {
        if (!this.canvas) return;
        const currentDpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = window.innerWidth * currentDpr;
        this.canvas.height = window.innerHeight * currentDpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        if (this.ctx) this.ctx.scale(currentDpr, currentDpr);
      };
    },

    /**
     * Spawn an elegant burst of light, upward-drifting particles & geometric shards
     */
    spawnParticles() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const originX = width / 2;
      const originY = height * 0.65; // Emerge from around the notification origin

      // Number of ethereal particles (55 to 70 for a lush, subtle ambient feel)
      const particleCount = 65;

      for (let i = 0; i < particleCount; i++) {
        // Broad initial distribution for natural atmospheric presence
        const startX = originX + (Math.random() - 0.5) * (width * 0.7);
        const startY = originY + (Math.random() - 0.5) * 160 + (Math.random() * 80);

        // Particle shape types:
        // 'orb' (soft glowing sphere), 'star' (4-point sparkle), 'diamond' (delicate rhombus), 'ring' (hollow micro-circle)
        const types = ['orb', 'star', 'diamond', 'ring', 'spark'];
        const type = types[Math.floor(Math.random() * types.length)];

        // Particle size (light, subtle: 2px to 8px)
        const size = Math.random() * 6 + 2.5;

        // Upward buoyant velocity with gentle random spread
        const vy = -(Math.random() * 2.2 + 1.2); // Upward drift
        const vx = (Math.random() - 0.5) * 1.4;  // Gentle lateral spread

        // Brownian flutter parameters (horizontal sine wave)
        const flutterFreq = Math.random() * 0.003 + 0.0015;
        const flutterAmp = Math.random() * 30 + 15;
        const flutterOffset = Math.random() * Math.PI * 2;

        // Rotation
        const rotation = Math.random() * Math.PI * 2;
        const rotSpeed = (Math.random() - 0.5) * 0.03;

        // Lifespan & opacity (2.8 to 4.2 seconds duration)
        const maxLife = Math.random() * 1200 + 2600;
        const birthTime = performance.now() + (Math.random() * 400); // Staggered spawn

        // Monochromatic luminescence (no specific color palette dependency):
        // Soft neutral translucent whites, silver highlights, pearl warmth
        const luminosity = Math.floor(Math.random() * 25 + 230); // 230 to 255 (neutral bright)
        const baseAlpha = Math.random() * 0.5 + 0.35; // 0.35 to 0.85

        this.particles.push({
          x: startX,
          y: startY,
          baseX: startX,
          vx,
          vy,
          size,
          type,
          flutterFreq,
          flutterAmp,
          flutterOffset,
          rotation,
          rotSpeed,
          birthTime,
          maxLife,
          luminosity,
          baseAlpha
        });
      }

      // Also spawn 6 floating DOM icon motes for depth parallax
      this.spawnFloatingMotes();
    },

    /**
     * Spawn ethereal floating DOM icon motes that drift upward alongside
     */
    spawnFloatingMotes() {
      // Remove any existing motes container
      const existing = document.getElementById('success-motes-container');
      if (existing) existing.remove();

      const container = document.createElement('div');
      container.id = 'success-motes-container';
      container.className = 'success-motes-container';
      document.body.appendChild(container);

      const icons = ['bi-patch-check', 'bi-stars', 'bi-check2-circle', 'bi-sparkles', 'bi-send-check', 'bi-award'];
      const moteCount = 8;
      const width = window.innerWidth;

      for (let i = 0; i < moteCount; i++) {
        const mote = document.createElement('div');
        mote.className = 'app-floating-mote';
        const iconClass = icons[i % icons.length];
        mote.innerHTML = `<i class="bi ${iconClass}"></i>`;

        // Position across screen width
        const leftPercent = 15 + Math.random() * 70;
        const animDelay = Math.random() * 0.6;
        const animDuration = 3.2 + Math.random() * 1.5;
        const sizePx = 14 + Math.random() * 12;

        mote.style.left = `${leftPercent}%`;
        mote.style.fontSize = `${sizePx}px`;
        mote.style.animationDelay = `${animDelay}s`;
        mote.style.animationDuration = `${animDuration}s`;

        container.appendChild(mote);
      }

      // Auto-clean motes after 5 seconds
      setTimeout(() => {
        if (container.parentNode) container.remove();
      }, 5000);
    },

    /**
     * Subtle glassmorphic success notification
     */
    displayNotification(details) {
      // Remove existing notification if open
      const existing = document.getElementById('application-success-notification');
      if (existing) existing.remove();

      const notification = document.createElement('div');
      notification.id = 'application-success-notification';
      notification.className = 'app-success-notification-backdrop';

      const matchScorePill = (details.matchScore !== null && details.matchScore !== undefined)
        ? `<span class="app-success-pill"><i class="bi bi-pie-chart-fill me-1"></i> ${details.matchScore}% Skill Alignment</span>`
        : `<span class="app-success-pill"><i class="bi bi-stars me-1"></i> Tailored Skill Match</span>`;

      notification.innerHTML = `
        <div class="app-success-card" role="dialog" aria-modal="true" aria-labelledby="app-success-title">
          
          <!-- Subtle Top Luminous Bar -->
          <div class="app-success-shimmer-line"></div>

          <!-- Ambient Light Glow Behind Checkmark -->
          <div class="app-success-ambient-glow"></div>

          <!-- Animated SVG Drawing Checkmark Badge -->
          <div class="app-success-icon-container">
            <svg class="app-success-checkmark-svg" viewBox="0 0 52 52">
              <circle class="app-success-circle" cx="26" cy="26" r="23" fill="none"/>
              <path class="app-success-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>

          <!-- Header & Accomplishment Confirmation -->
          <div class="app-success-content">
            <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
              <span class="app-success-badge-tag">
                <i class="bi bi-shield-check me-1"></i> Verified Submission
              </span>
              ${matchScorePill}
            </div>

            <h3 class="app-success-title" id="app-success-title">
              Application Successfully Submitted
            </h3>

            <p class="app-success-subtitle">
              Your application for <strong class="app-success-role">${details.roleTitle}</strong> at <strong class="app-success-company">${details.companyName}</strong> has been logged in your SQLite ATS tracker.
            </p>

            <!-- Verification Milestone Ribbon -->
            <div class="app-success-milestone-box">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="small text-muted fw-semibold">
                  <i class="bi bi-kanban me-1 text-primary"></i> Application Status
                </span>
                <span class="badge bg-light text-dark border px-2 py-1 fw-bold rounded-pill">
                  <i class="bi bi-check-circle-fill text-success me-1"></i> Applied
                </span>
              </div>
              <div class="d-flex align-items-center justify-content-between">
                <span class="small text-muted fw-semibold">
                  <i class="bi bi-file-earmark-check me-1 text-primary"></i> Resume & Profile
                </span>
                <span class="small text-success fw-bold">
                  <i class="bi bi-patch-check-fill me-1"></i> Synced with Employer
                </span>
              </div>
            </div>

            <!-- Action Controls -->
            <div class="app-success-actions">
              <a href="applications.html" class="btn app-btn-primary">
                <i class="bi bi-kanban me-2"></i> Track in ATS Dashboard
              </a>
              <a href="${details.portalUrl}" target="_blank" class="btn app-btn-secondary" id="app-success-portal-btn">
                <i class="bi bi-box-arrow-up-right me-1"></i> Open Career Portal
              </a>
              <button type="button" class="btn app-btn-subtle" id="app-success-close-btn">
                Continue Exploring Opportunities
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(notification);
      this.notificationEl = notification;

      // Close handlers
      const closeBtn = notification.querySelector('#app-success-close-btn');
      if (closeBtn) {
        closeBtn.onclick = () => this.dismissNotification();
      }

      notification.onclick = (e) => {
        if (e.target === notification) {
          this.dismissNotification();
        }
      };

      // Escape key handler
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          this.dismissNotification();
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);

      // Trigger entrance animation
      requestAnimationFrame(() => {
        notification.classList.add('app-success-visible');
      });
    },

    /**
     * Gracefully dismiss the success notification
     */
    dismissNotification() {
      if (!this.notificationEl) return;
      this.notificationEl.classList.remove('app-success-visible');
      this.notificationEl.classList.add('app-success-hiding');
      setTimeout(() => {
        if (this.notificationEl && this.notificationEl.parentNode) {
          this.notificationEl.remove();
          this.notificationEl = null;
        }
      }, 400);
    },

    /**
     * 60fps Particle Animation Loop
     */
    animate(currentTime) {
      if (!this.ctx || !this.canvas) {
        this.isActive = false;
        return;
      }

      const ctx = this.ctx;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Clear canvas smoothly
      ctx.clearRect(0, 0, width, height);

      const activeParticles = [];

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];

        // Wait until birth time (for gentle staggered emergence)
        if (currentTime < p.birthTime) {
          activeParticles.push(p);
          continue;
        }

        const elapsed = currentTime - p.birthTime;
        const progress = elapsed / p.maxLife;

        // If particle finished lifespan, let it retire
        if (progress >= 1) continue;

        // Easing curves:
        // Fade in rapidly in first 15%, then gently fade out towards 0
        let currentAlpha = 0;
        if (progress < 0.15) {
          currentAlpha = (progress / 0.15) * p.baseAlpha;
        } else {
          // Graceful fade out curve (cubic ease-out)
          const remainingProgress = (progress - 0.15) / 0.85;
          currentAlpha = p.baseAlpha * Math.pow(1 - remainingProgress, 1.6);
        }

        // Air drag deceleration
        const dragFactor = Math.pow(0.992, elapsed / 16);
        p.y += p.vy * dragFactor;

        // Smooth horizontal Brownian sine wave sway
        const flutter = Math.sin((elapsed * p.flutterFreq) + p.flutterOffset) * p.flutterAmp;
        p.x = p.baseX + (p.vx * (elapsed / 16)) + flutter;

        // Rotation
        p.rotation += p.rotSpeed;

        // Draw particle based on type
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Soft luminescence shadow
        ctx.shadowColor = `rgba(${p.luminosity}, ${p.luminosity}, ${p.luminosity}, ${currentAlpha * 0.75})`;
        ctx.shadowBlur = p.size * 2;

        if (p.type === 'orb') {
          // Soft luminous micro-orb
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
          grad.addColorStop(0, `rgba(255, 255, 255, ${currentAlpha})`);
          grad.addColorStop(0.5, `rgba(${p.luminosity}, ${p.luminosity}, ${p.luminosity}, ${currentAlpha * 0.6})`);
          grad.addColorStop(1, `rgba(${p.luminosity}, ${p.luminosity}, ${p.luminosity}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'star') {
          // Delicate 4-point sparkle star
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.95})`;
          ctx.beginPath();
          const s = p.size * 1.3;
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s);
          ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.fill();
        } else if (p.type === 'diamond') {
          // Subtle rotating diamond shard
          ctx.fillStyle = `rgba(${p.luminosity}, ${p.luminosity}, ${p.luminosity}, ${currentAlpha * 0.85})`;
          ctx.beginPath();
          const s = p.size;
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.6, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.6, 0);
          ctx.closePath();
          ctx.fill();
        } else if (p.type === 'ring') {
          // Delicate hollow circle ring
          ctx.strokeStyle = `rgba(255, 255, 255, ${currentAlpha * 0.8})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Gentle spark point
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        activeParticles.push(p);
      }

      this.particles = activeParticles;

      // Continue animation while particles remain or notification is visible
      if (this.particles.length > 0 || this.notificationEl) {
        this.animationFrameId = requestAnimationFrame(this.animate);
      } else {
        this.isActive = false;
        if (this.canvas) {
          ctx.clearRect(0, 0, width, height);
        }
      }
    }
  };

  // Expose globally
  window.ApplicationSuccessEffect = SuccessEffect;

})();
