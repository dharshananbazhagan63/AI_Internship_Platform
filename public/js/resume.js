/**
 * Resume Upload & Analysis logic (upload-resume.html)
 */

let selectedResumeFile = null;

document.addEventListener('DOMContentLoaded', () => {
  Auth.renderNavbar('upload');

  if (!Auth.requireAuth()) return;

  setupDropzone();
  loadCurrentResume();
});

function setupDropzone() {
  const dropzone = document.getElementById('resume-dropzone');
  const fileInput = document.getElementById('resume-file-input');
  const browseBtn = document.getElementById('btn-browse-file');
  const analyzeBtn = document.getElementById('btn-analyze-resume');
  const removeBtn = document.getElementById('btn-remove-selected-file');

  if (!dropzone || !fileInput) return;

  browseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    fileInput.click();
  });

  dropzone.addEventListener('click', (e) => {
    if (e.target !== browseBtn && !e.target.closest('button')) {
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  // Drag and drop events
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelected(files[0]);
    }
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      clearSelectedFile();
    });
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => {
      uploadAndAnalyzeResume();
    });
  }
}

function handleFileSelected(file) {
  // Validate extension
  const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  if (!validExtensions.includes(ext)) {
    Auth.showToast('Please select a valid PDF, DOCX, or TXT file.', 'error');
    return;
  }

  // Validate size (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    Auth.showToast('File size exceeds 5MB limit. Please upload a smaller file.', 'error');
    return;
  }

  selectedResumeFile = file;

  // Update UI with selected file info
  document.getElementById('selected-file-container').classList.remove('d-none');
  document.getElementById('selected-file-name').textContent = file.name;
  document.getElementById('selected-file-size').textContent = `${(file.size / 1024).toFixed(1)} KB`;
  document.getElementById('btn-analyze-resume').disabled = false;

  Auth.showToast(`Selected "${file.name}". Click "Analyze Resume" to proceed.`, 'info');
}

function clearSelectedFile() {
  selectedResumeFile = null;
  const fileInput = document.getElementById('resume-file-input');
  if (fileInput) fileInput.value = '';

  document.getElementById('selected-file-container').classList.add('d-none');
  document.getElementById('btn-analyze-resume').disabled = true;
  document.getElementById('upload-progress-container').classList.add('d-none');
}

async function uploadAndAnalyzeResume() {
  if (!selectedResumeFile) {
    Auth.showToast('Please choose a resume file first.', 'error');
    return;
  }

  const analyzeBtn = document.getElementById('btn-analyze-resume');
  const progressContainer = document.getElementById('upload-progress-container');
  const progressBar = document.getElementById('upload-progress-bar');
  const progressText = document.getElementById('upload-progress-text');

  analyzeBtn.disabled = true;
  progressContainer.classList.remove('d-none');
  progressBar.style.width = '20%';
  progressText.textContent = 'Uploading resume document...';

  const formData = new FormData();
  formData.append('resume', selectedResumeFile);

  try {
    // Simulate upload step animation
    setTimeout(() => {
      progressBar.style.width = '60%';
      progressText.textContent = 'Extracting text and identifying technical skills...';
    }, 600);

    const token = Auth.getToken();
    const res = await fetch('/api/resume/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    progressBar.style.width = '100%';
    progressText.textContent = 'Analysis complete!';

    if (data.success) {
      Auth.showToast('Resume parsed successfully! Skills and sections extracted.', 'success');
      setTimeout(() => {
        progressContainer.classList.add('d-none');
        renderAnalysisResults(data);
      }, 700);
    } else {
      Auth.showToast(data.message || 'Failed to analyze resume.', 'error');
      analyzeBtn.disabled = false;
      progressContainer.classList.add('d-none');
    }
  } catch (err) {
    console.error('Upload error:', err);
    Auth.showToast('Network error while uploading resume.', 'error');
    analyzeBtn.disabled = false;
    progressContainer.classList.add('d-none');
  }
}

function renderAnalysisResults(data) {
  const resultsContainer = document.getElementById('analysis-results-section');
  if (!resultsContainer) return;

  resultsContainer.classList.remove('d-none');

  // 1. Detected skills
  const skillsContainer = document.getElementById('detected-skills-tags');
  if (skillsContainer) {
    if (data.detectedSkills && data.detectedSkills.length > 0) {
      skillsContainer.innerHTML = data.detectedSkills
        .map((skill) => `<span class="skill-tag skill-tag-matched"><i class="bi bi-check2"></i> ${skill}</span>`)
        .join('');
    } else {
      skillsContainer.innerHTML = `<span class="text-muted small">No technical keywords recognized from taxonomy. You can manually add them in your profile.</span>`;
    }
  }

  // 2. Education
  const eduContainer = document.getElementById('extracted-education-list');
  if (eduContainer) {
    const list = data.education || [];
    eduContainer.innerHTML = list.length > 0
      ? list.map((item) => `<li class="list-group-item bg-transparent"><i class="bi bi-mortarboard text-primary me-2"></i>${item}</li>`).join('')
      : `<li class="list-group-item bg-transparent text-muted">Education section not detected.</li>`;
  }

  // 3. Projects
  const projContainer = document.getElementById('extracted-projects-list');
  if (projContainer) {
    const list = data.projects || [];
    projContainer.innerHTML = list.length > 0
      ? list.map((item) => `<li class="list-group-item bg-transparent"><i class="bi bi-code-slash text-indigo me-2"></i>${item}</li>`).join('')
      : `<li class="list-group-item bg-transparent text-muted">No explicit project bullet lines detected.</li>`;
  }

  // 4. Experience
  const expContainer = document.getElementById('extracted-experience-list');
  if (expContainer) {
    const list = data.experience || [];
    expContainer.innerHTML = list.length > 0
      ? list.map((item) => `<li class="list-group-item bg-transparent"><i class="bi bi-briefcase text-success me-2"></i>${item}</li>`).join('')
      : `<li class="list-group-item bg-transparent text-muted">Fresher / No corporate experience entries listed.</li>`;
  }

  // 5. Extracted Text Preview
  const previewBox = document.getElementById('raw-text-preview');
  if (previewBox) {
    previewBox.textContent = data.extractedTextPreview || 'No readable text content extracted.';
  }

  // Scroll smoothly down to results
  resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

async function loadCurrentResume() {
  try {
    const res = await Auth.authFetch('/api/resume/my-resume');
    const data = await res.json();

    const activeResumeCard = document.getElementById('current-resume-card');
    if (!activeResumeCard) return;

    if (data.success && data.hasResume && data.resume) {
      activeResumeCard.classList.remove('d-none');
      document.getElementById('current-resume-name').textContent = data.resume.original_name;
      document.getElementById('current-resume-date').textContent = new Date(data.resume.uploaded_at).toLocaleDateString();
      document.getElementById('current-resume-skills-count').textContent = `${(data.resume.detected_skills || []).length} Skills Extracted`;

      // Set up delete button
      const deleteBtn = document.getElementById('btn-delete-current-resume');
      if (deleteBtn) {
        deleteBtn.onclick = async () => {
          if (confirm('Are you sure you want to delete your current resume? This will clear your analyzed skills.')) {
            const delRes = await Auth.authFetch('/api/resume/delete', { method: 'DELETE' });
            const delData = await delRes.json();
            if (delData.success) {
              Auth.showToast('Resume removed successfully.', 'info');
              activeResumeCard.classList.add('d-none');
              document.getElementById('analysis-results-section').classList.add('d-none');
            } else {
              Auth.showToast(delData.message || 'Failed to delete resume.', 'error');
            }
          }
        };
      }
    } else {
      activeResumeCard.classList.add('d-none');
    }
  } catch (err) {
    console.warn('Error loading current resume:', err);
  }
}
