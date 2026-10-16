const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Dictionary of identifiable skills with regex matching patterns
const SKILL_TAXONOMY = [
  // Programming Languages
  { name: 'JavaScript', pattern: /\b(javascript|js|es6|es2015)\b/i },
  { name: 'TypeScript', pattern: /\b(typescript|ts)\b/i },
  { name: 'Python', pattern: /\b(python|py)\b/i },
  { name: 'Java', pattern: /\b(java)\b(?!\s*script)/i },
  { name: 'C++', pattern: /\b(c\+\+)\b/i },
  { name: 'C#', pattern: /\b(c#|c-sharp)\b/i },
  { name: 'C', pattern: /\b(c language)\b|\bc\s+(?=programming)/i },
  { name: 'PHP', pattern: /\b(php)\b/i },
  { name: 'Ruby', pattern: /\b(ruby)\b/i },
  { name: 'Go', pattern: /\b(golang|go\s+language)\b/i },
  { name: 'Rust', pattern: /\b(rust)\b/i },
  { name: 'Kotlin', pattern: /\b(kotlin)\b/i },
  { name: 'Swift', pattern: /\b(swift)\b/i },
  { name: 'Dart', pattern: /\b(dart)\b/i },
  { name: 'R', pattern: /\b(r\s+language|r\s+programming)\b/i },
  { name: 'SQL', pattern: /\b(sql)\b/i },
  { name: 'HTML5', pattern: /\b(html|html5)\b/i },
  { name: 'CSS3', pattern: /\b(css|css3|sass|scss)\b/i },
  { name: 'Bash', pattern: /\b(bash|shell\s+scripting)\b/i },

  // Frameworks & Libraries
  { name: 'Node.js', pattern: /\b(node\.?js|nodejs|node)\b/i },
  { name: 'Express.js', pattern: /\b(express\.?js|express)\b/i },
  { name: 'React', pattern: /\b(react|react\.?js|reactjs)\b/i },
  { name: 'Angular', pattern: /\b(angular|angular\.?js)\b/i },
  { name: 'Vue.js', pattern: /\b(vue|vue\.?js|vuejs)\b/i },
  { name: 'Next.js', pattern: /\b(next\.?js|nextjs)\b/i },
  { name: 'Django', pattern: /\b(django)\b/i },
  { name: 'Flask', pattern: /\b(flask)\b/i },
  { name: 'FastAPI', pattern: /\b(fastapi)\b/i },
  { name: 'Spring Boot', pattern: /\b(spring\s*boot|spring\s*framework)\b/i },
  { name: 'Bootstrap', pattern: /\b(bootstrap|bootstrap\s*5)\b/i },
  { name: 'Tailwind CSS', pattern: /\b(tailwind|tailwind\s*css)\b/i },
  { name: 'jQuery', pattern: /\b(jquery)\b/i },
  { name: 'Flutter', pattern: /\b(flutter)\b/i },
  { name: 'React Native', pattern: /\b(react\s*native)\b/i },

  // Databases & Cloud
  { name: 'SQLite', pattern: /\b(sqlite|sqlite3)\b/i },
  { name: 'MySQL', pattern: /\b(mysql)\b/i },
  { name: 'PostgreSQL', pattern: /\b(postgres|postgresql|psql)\b/i },
  { name: 'MongoDB', pattern: /\b(mongo|mongodb)\b/i },
  { name: 'Redis', pattern: /\b(redis)\b/i },
  { name: 'Firebase', pattern: /\b(firebase|firestore)\b/i },
  { name: 'AWS', pattern: /\b(aws|amazon\s+web\s+services)\b/i },
  { name: 'Azure', pattern: /\b(azure|microsoft\s+azure)\b/i },
  { name: 'Google Cloud', pattern: /\b(gcp|google\s+cloud)\b/i },
  { name: 'Docker', pattern: /\b(docker|containerization)\b/i },
  { name: 'Kubernetes', pattern: /\b(k8s|kubernetes)\b/i },
  { name: 'Git', pattern: /\b(git|github|gitlab|version\s+control)\b/i },
  { name: 'Linux', pattern: /\b(linux|ubuntu|debian|centos)\b/i },
  { name: 'CI/CD', pattern: /\b(ci\/cd|continuous\s+integration|github\s+actions)\b/i },

  // AI & Data Science
  { name: 'Machine Learning', pattern: /\b(machine\s+learning|ml)\b/i },
  { name: 'Deep Learning', pattern: /\b(deep\s+learning)\b/i },
  { name: 'Artificial Intelligence', pattern: /\b(artificial\s+intelligence|ai)\b/i },
  { name: 'NLP', pattern: /\b(natural\s+language\s+processing|nlp)\b/i },
  { name: 'Computer Vision', pattern: /\b(computer\s+vision|opencv)\b/i },
  { name: 'TensorFlow', pattern: /\b(tensorflow)\b/i },
  { name: 'PyTorch', pattern: /\b(pytorch)\b/i },
  { name: 'Scikit-Learn', pattern: /\b(scikit-learn|sklearn)\b/i },
  { name: 'Pandas', pattern: /\b(pandas)\b/i },
  { name: 'NumPy', pattern: /\b(numpy)\b/i },
  { name: 'Data Analysis', pattern: /\b(data\s+analysis|data\s+analytics)\b/i },
  { name: 'Power BI', pattern: /\b(power\s*bi)\b/i },
  { name: 'Tableau', pattern: /\b(tableau)\b/i },

  // Concepts & Other
  { name: 'REST APIs', pattern: /\b(rest|restful|rest\s+api|apis)\b/i },
  { name: 'GraphQL', pattern: /\b(graphql)\b/i },
  { name: 'Microservices', pattern: /\b(microservices)\b/i },
  { name: 'OOP', pattern: /\b(oop|object\s+oriented)\b/i },
  { name: 'Data Structures', pattern: /\b(data\s+structures|algorithms|dsa)\b/i },
  { name: 'UI/UX Design', pattern: /\b(ui\/ux|user\s+interface|user\s+experience)\b/i },
  { name: 'Figma', pattern: /\b(figma)\b/i },
  { name: 'Cybersecurity', pattern: /\b(cybersecurity|network\s+security|penetration\s+testing|ethical\s+hacking)\b/i },
  { name: 'OWASP', pattern: /\b(owasp)\b/i }
];

class ResumeParserService {
  /**
   * Extract readable text content from PDF or DOCX file
   */
  static async extractRawText(filePath, mimeType, originalName) {
    const ext = path.extname(originalName || filePath).toLowerCase();

    if (ext === '.pdf' || mimeType === 'application/pdf') {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const parsed = await pdfParse(dataBuffer);
        return parsed.text || '';
      } catch (pdfErr) {
        console.warn('[!] PDF parser encountered an error, falling back to text stream extraction:', pdfErr.message);
        // Fallback: extract ASCII/UTF-8 readable chunks from buffer
        const buf = fs.readFileSync(filePath);
        const text = buf.toString('latin1').replace(/[^\x20-\x7E\t\n\r]/g, ' ');
        return text;
      }
    } else if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    } else {
      // Fallback: try reading as text
      return fs.readFileSync(filePath, 'utf-8');
    }
  }

  /**
   * Extract skills using keyword taxonomy matching
   */
  static extractSkills(text) {
    if (!text) return [];
    const detected = [];

    for (const item of SKILL_TAXONOMY) {
      if (item.pattern.test(text)) {
        detected.push(item.name);
      }
    }

    return Array.from(new Set(detected));
  }

  /**
   * Extract education details from text
   */
  static extractEducation(text) {
    if (!text) return [];
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const educationItems = [];

    const degreeKeywords = [
      /\b(b\.?\s*tech|bachelor\s+of\s+technology|b\.?\s*e\.?|bachelor\s+of\s+engineering)\b/i,
      /\b(bca|bachelor\s+of\s+computer\s+applications)\b/i,
      /\b(m\.?\s*tech|master\s+of\s+technology|mca|master\s+of\s+computer\s+applications)\b/i,
      /\b(b\.?\s*sc|bachelor\s+of\s+science|m\.?\s*sc)\b/i,
      /\b(computer\s+science|information\s+technology|data\s+science|software\s+engineering)\b/i,
      /\b(university|institute|college|school)\b/i,
      /\b(cgpa|gpa|percentage|marks|grade)\b/i
    ];

    for (const line of lines) {
      if (degreeKeywords.some((regex) => regex.test(line)) && line.length < 120) {
        if (!educationItems.includes(line)) {
          educationItems.push(line);
        }
      }
      if (educationItems.length >= 4) break;
    }

    return educationItems.length > 0 ? educationItems : ['Pursuing Computer Science / Engineering Degree'];
  }

  /**
   * Extract projects mentioned in the resume
   */
  static extractProjects(text) {
    if (!text) return [];
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const projects = [];

    const projectIndicators = /\b(project|developed|built|created|implemented|system|platform|application|app|portal)\b/i;

    let inProjectsSection = false;
    for (const line of lines) {
      if (/^(projects|academic projects|personal projects|key projects)/i.test(line)) {
        inProjectsSection = true;
        continue;
      }

      if (inProjectsSection) {
        // Stop if another major section begins
        if (/^(skills|education|experience|certifications|achievements)/i.test(line)) {
          break;
        }
        if (line.length > 10 && line.length < 150) {
          projects.push(line.replace(/^[•\-\*]\s*/, ''));
        }
        if (projects.length >= 5) break;
      } else if (projectIndicators.test(line) && line.length > 20 && line.length < 120) {
        if (projects.length < 3) {
          projects.push(line.replace(/^[•\-\*]\s*/, ''));
        }
      }
    }

    return projects;
  }

  /**
   * Extract experience / internships mentioned
   */
  static extractExperience(text) {
    if (!text) return [];
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const experience = [];

    let inExpSection = false;
    for (const line of lines) {
      if (/^(experience|work experience|internships|professional experience)/i.test(line)) {
        inExpSection = true;
        continue;
      }

      if (inExpSection) {
        if (/^(skills|education|projects|certifications)/i.test(line)) {
          break;
        }
        if (line.length > 10 && line.length < 150) {
          experience.push(line.replace(/^[•\-\*]\s*/, ''));
        }
        if (experience.length >= 4) break;
      }
    }

    return experience;
  }

  /**
   * Complete parser orchestration
   */
  static async parseResume(filePath, mimeType, originalName) {
    const rawText = await this.extractRawText(filePath, mimeType, originalName);
    const skills = this.extractSkills(rawText);
    const education = this.extractEducation(rawText);
    const projects = this.extractProjects(rawText);
    const experience = this.extractExperience(rawText);

    return {
      rawText,
      skills,
      education,
      projects,
      experience
    };
  }
}

module.exports = ResumeParserService;
