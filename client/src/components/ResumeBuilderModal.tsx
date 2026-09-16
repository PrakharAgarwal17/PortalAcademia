import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  FileText,
  Download,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Check,
  User,
  GraduationCap,
  Briefcase,
  Award,
  Printer,
  FileCheck,
  Info,
  Upload,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { jsPDF } from "jspdf";
import SkillBadge from "./SkillBadge";
import { calculateAtsScore, type AtsScoreBreakdown } from "../utils/atsScoring";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

export interface ResumeData {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
  skills: string[];
  education: Array<{
    education: string;
    course?: string;
    institution?: string;
    timeline?: string;
    grade?: string;
    description?: string;
  }>;
  experience: Array<{
    title: string;
    organization?: string;
    timeline?: string;
    description?: string;
  }>;
  certifications: Array<{
    title: string;
    issuer?: string;
    timeline?: string;
    summary?: string;
    credentialUrl?: string;
  }>;
}

function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateResumePrintHtml(resume: ResumeData): string {
  const contactParts = [
    resume.email,
    resume.phone,
    resume.location,
    resume.linkedin ? `LinkedIn: ${resume.linkedin}` : "",
    resume.github ? `GitHub: ${resume.github}` : "",
    resume.website ? `Portfolio: ${resume.website}` : "",
  ].filter(Boolean);

  const skillsHtml = (resume.skills || [])
    .map(
      (s) =>
        `<span style="display:inline-block;padding:2px 8px;margin:2px 4px 2px 0;background:#f3f4f6;border:1px solid #d1d5db;border-radius:4px;font-size:10.5px;font-family:monospace;font-weight:600;color:#1f2937;">${escapeHtml(s)}</span>`
    )
    .join(" ");

  const experienceHtml = (resume.experience || [])
    .map(
      (exp) => `
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <strong style="font-size:12px;color:#111827;">${escapeHtml(exp.title)}</strong>
          <span style="font-size:10.5px;color:#6b7280;font-family:monospace;">${escapeHtml(exp.timeline || "")}</span>
        </div>
        ${exp.organization ? `<div style="font-size:11px;color:#4b5563;font-style:italic;margin-top:1px;">${escapeHtml(exp.organization)}</div>` : ""}
        ${exp.description ? `<div style="font-size:11px;color:#374151;margin-top:3px;line-height:1.45;">${escapeHtml(exp.description)}</div>` : ""}
      </div>
    `
    )
    .join("");

  const educationHtml = (resume.education || [])
    .map((edu) => {
      const degree = edu.course ? `${edu.education} — ${edu.course}` : edu.education;
      return `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <strong style="font-size:12px;color:#111827;">${escapeHtml(degree)}</strong>
          <span style="font-size:10.5px;color:#6b7280;font-family:monospace;">${escapeHtml(edu.timeline || "")}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;font-size:11px;color:#4b5563;margin-top:1px;">
          <span>${escapeHtml(edu.institution || "")}</span>
          ${edu.grade ? `<span style="font-family:monospace;font-weight:700;color:#111827;">${escapeHtml(edu.grade)}</span>` : ""}
        </div>
        ${edu.description ? `<div style="font-size:10.5px;color:#6b7280;margin-top:2px;">${escapeHtml(edu.description)}</div>` : ""}
      </div>
    `;
    })
    .join("");

  const certsHtml = (resume.certifications || [])
    .map(
      (cert) => `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <strong style="font-size:12px;color:#111827;">${escapeHtml(cert.title)}</strong>
          <span style="font-size:10.5px;color:#6b7280;font-family:monospace;">${escapeHtml(cert.timeline || "")}</span>
        </div>
        ${cert.issuer ? `<div style="font-size:11px;color:#4b5563;font-weight:500;margin-top:1px;">${escapeHtml(cert.issuer)}</div>` : ""}
        ${cert.summary ? `<div style="font-size:10.5px;color:#6b7280;margin-top:2px;line-height:1.4;">${escapeHtml(cert.summary)}</div>` : ""}
      </div>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(resume.fullName || "Candidate")}_Resume</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111827;
            margin: 0;
            padding: 20px 25px;
            line-height: 1.45;
            background: #ffffff;
            font-size: 11px;
          }
          h1 {
            font-size: 24px;
            margin: 0 0 3px 0;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 800;
          }
          .headline {
            font-size: 11.5px;
            color: #374151;
            margin: 0 0 8px 0;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .contact {
            font-size: 10px;
            color: #4b5563;
            margin-bottom: 12px;
            font-family: monospace;
            line-height: 1.5;
          }
          .header-line {
            border-bottom: 2px solid #111827;
            margin-bottom: 12px;
          }
          .section-title {
            font-size: 11.5px;
            font-weight: 800;
            text-transform: uppercase;
            border-bottom: 1.5px solid #111827;
            padding-bottom: 3px;
            margin-top: 14px;
            margin-bottom: 8px;
            color: #111827;
            letter-spacing: 0.75px;
            font-family: monospace;
          }
          .summary-text {
            font-size: 11px;
            color: #374151;
            line-height: 1.45;
            margin: 0 0 6px 0;
          }
        </style>
      </head>
      <body>
        <div>
          <h1>${escapeHtml(resume.fullName || "Candidate Name")}</h1>
          ${resume.headline ? `<div class="headline">${escapeHtml(resume.headline)}</div>` : ""}
          <div class="contact">
            ${contactParts.map((c) => escapeHtml(c)).join(" &nbsp;|&nbsp; ")}
          </div>
          <div class="header-line"></div>
        </div>

        ${
          resume.summary
            ? `
          <div>
            <div class="section-title">Professional Summary</div>
            <p class="summary-text">${escapeHtml(resume.summary)}</p>
          </div>
        `
            : ""
        }

        ${
          resume.skills && resume.skills.length > 0
            ? `
          <div>
            <div class="section-title">Technical &amp; Core Skills</div>
            <div style="margin-top:4px;">${skillsHtml}</div>
          </div>
        `
            : ""
        }

        ${
          resume.experience && resume.experience.length > 0
            ? `
          <div>
            <div class="section-title">Work Experience &amp; Internships</div>
            ${experienceHtml}
          </div>
        `
            : ""
        }

        ${
          resume.education && resume.education.length > 0
            ? `
          <div>
            <div class="section-title">Education &amp; Qualifications</div>
            ${educationHtml}
          </div>
        `
            : ""
        }

        ${
          resume.certifications && resume.certifications.length > 0
            ? `
          <div>
            <div class="section-title">Certifications &amp; Licenses</div>
            ${certsHtml}
          </div>
        `
            : ""
        }
      </body>
    </html>
  `;
}

interface ResumeBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: any;
  opportunity?: any;
  onAttachResume: (resumeData: ResumeData, pdfUrl?: string, atsScore?: number) => void;
}

export default function ResumeBuilderModal({
  isOpen,
  onClose,
  profileData,
  opportunity,
  onAttachResume,
}: ResumeBuilderModalProps) {
  const resumePrintRef = useRef<HTMLDivElement>(null);

  // Resume form state pre-filled from student profile
  const [resume, setResume] = useState<ResumeData>({
    fullName: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    website: "",
    summary: "",
    skills: [],
    education: [],
    experience: [],
    certifications: [],
  });

  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "upload">("edit");
  const [newSkillInput, setNewSkillInput] = useState("");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedResult, setUploadedResult] = useState<{
    url: string;
    filename: string;
    atsAnalysis: AtsScoreBreakdown;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authoritative Unified ATS Analysis for the built resume
  const atsAnalysis = useMemo(() => {
    return calculateAtsScore(
      {
        fullName: resume.fullName,
        email: resume.email,
        phone: resume.phone,
        location: resume.location,
        summary: resume.summary,
        skills: resume.skills,
        verifiedSkills: profileData?.verifiedSkills || [],
        institutionCredentials: (profileData?.certifications || []).map((c: any) => ({
          title: c.title,
          isVerified: Boolean(c.isVerified),
        })),
        education: resume.education,
        experience: resume.experience,
        certifications: resume.certifications,
      },
      {
        requiredSkills: opportunity?.requiredSkills || [],
        title: opportunity?.title,
        category: opportunity?.category,
      }
    );
  }, [resume, profileData, opportunity]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isDocx = file.type.includes("word") || file.name.toLowerCase().endsWith(".docx");
    if (!isPdf && !isDocx) {
      setUploadError("Please select a PDF or Word document (.docx).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5MB limit.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      if (opportunity?._id) {
        formData.append("opportunityId", opportunity._id);
      }
      if (opportunity?.requiredSkills) {
        formData.append("requiredSkills", JSON.stringify(opportunity.requiredSkills));
      }

      const res = await fetch(`${API_BASE}/api/upload/resume-score`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to process resume upload.");
      }

      setUploadedResult({
        url: data.url,
        filename: data.filename,
        atsAnalysis: data.atsAnalysis,
      });
    } catch (err: any) {
      console.error("Resume upload error:", err);
      setUploadError(err.message || "Network error while uploading resume.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAttachUploaded = () => {
    if (!uploadedResult) return;
    onAttachResume(resume, uploadedResult.url, uploadedResult.atsAnalysis.totalScore);
    onClose();
  };

  // Sync profile data when modal opens - directly fetched from student profile
  useEffect(() => {
    if (!isOpen || !profileData) return;

    // Map education from profile or supply current institution as baseline
    const mappedEducation: ResumeData["education"] = Array.isArray(profileData.education) && profileData.education.length > 0
      ? profileData.education.map((edu: any) => ({
          education: edu.education || edu.degree || "Bachelor of Technology",
          course: edu.course || edu.field || "",
          institution: edu.institution || profileData.institution || profileData.institutionName || "",
          timeline: edu.timeline || edu.year || "",
          grade: edu.grade || "",
          description: edu.description || "",
        }))
      : [
          {
            education: "Bachelor of Technology (B.Tech)",
            course: "Computer Science & Engineering",
            institution: profileData.institution || profileData.institutionName || "Academic Institution",
            timeline: "2022 - 2026",
            grade: "",
            description: "",
          },
        ];

    // Map experience from profile
    const mappedExperience: ResumeData["experience"] = Array.isArray(profileData.pastExperience) && profileData.pastExperience.length > 0
      ? profileData.pastExperience.map((exp: any) => ({
          title: exp.title || "",
          organization: exp.organization || exp.company || "",
          timeline: exp.timeline || "",
          description: exp.description || "",
        }))
      : [];

    // Map certifications directly fetched from profile
    const mappedCertifications: ResumeData["certifications"] = Array.isArray(profileData.certifications) && profileData.certifications.length > 0
      ? profileData.certifications.map((cert: any) => ({
          title: cert.title || "",
          issuer: cert.issuer || "",
          timeline: cert.timeline || cert.year || "",
          summary: cert.summary || cert.description || "",
          credentialUrl: cert.credentialUrl || "",
        }))
      : [];

    setResume({
      fullName: profileData.name || profileData.companyName || "Student Candidate",
      headline: profileData.headline || "Computer Science & Engineering Student",
      email: profileData.institutionEmail || profileData.email || profileData.workEmail || "student@portalacademia.ac.in",
      phone: profileData.contact || "+91 98765 43210",
      location: profileData.location || "India",
      linkedin: profileData.linkedin || "",
      github: profileData.github || "",
      website: profileData.website || profileData.officialWebsite || "",
      summary:
        profileData.bio ||
        "Dedicated student seeking high-impact technical opportunities. Proficient in modern architectures, algorithmic problem solving, and software engineering principles.",
      skills: profileData.skills ? [...profileData.skills] : [],
      education: mappedEducation,
      experience: mappedExperience,
      certifications: mappedCertifications,
    });
  }, [isOpen, profileData]);

  if (!isOpen) return null;

  // Skill Management
  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    if (!resume.skills.includes(newSkillInput.trim())) {
      setResume((prev) => ({ ...prev, skills: [...prev.skills, newSkillInput.trim()] }));
    }
    setNewSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setResume((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  // Education Handlers
  const handleAddEducation = () => {
    setResume((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          education: "Bachelor of Technology",
          institution: "Indian Institute of Technology",
          timeline: "2022 - 2026",
          grade: "CGPA: 8.5 / 10",
          course: "Computer Science",
          description: "",
        },
      ],
    }));
  };

  const handleUpdateEducation = (index: number, field: string, value: string) => {
    setResume((prev) => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  };

  const handleRemoveEducation = (index: number) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  // Experience Handlers
  const handleAddExperience = () => {
    setResume((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: "Software Engineering Intern",
          organization: "Tech Company",
          timeline: "May 2025 - July 2025",
          description: "Developed and optimized microservices and REST APIs.",
        },
      ],
    }));
  };

  const handleUpdateExperience = (index: number, field: string, value: string) => {
    setResume((prev) => {
      const updated = [...prev.experience];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experience: updated };
    });
  };

  const handleRemoveExperience = (index: number) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  // Certification Handlers
  const handleAddCertification = () => {
    setResume((prev) => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        {
          title: "Professional Certification",
          issuer: "Coursera / AWS / Meta",
          timeline: "2025",
          summary: "Demonstrated practical proficiency in cloud architecture and software engineering.",
          credentialUrl: "https://",
        },
      ],
    }));
  };

  const handleUpdateCertification = (index: number, field: string, value: string) => {
    setResume((prev) => {
      const updated = [...prev.certifications];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, certifications: updated };
    });
  };

  const handleRemoveCertification = (index: number) => {
    setResume((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  // 1-Click Direct ATS PDF Download using jsPDF
  const handleDownloadJsPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let y = 45;

    const addSectionHeader = (title: string) => {
      if (y > 750) {
        doc.addPage();
        y = 45;
      }
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text(title.toUpperCase(), margin, y);
      y += 4;
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.75);
      doc.line(margin, y, margin + contentWidth, y);
      y += 12;
    };

    // Header: Full Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(17, 24, 39);
    doc.text(resume.fullName.toUpperCase(), margin, y);
    y += 15;

    // Headline
    if (resume.headline) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(resume.headline.toUpperCase(), margin, y);
      y += 13;
    }

    // Contact info line
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    const contactParts = [
      resume.email,
      resume.phone,
      resume.location,
      resume.linkedin ? `LinkedIn: ${resume.linkedin}` : null,
      resume.github ? `GitHub: ${resume.github}` : null,
    ].filter(Boolean);
    const contactLine = contactParts.join("  |  ");
    const splitContact = doc.splitTextToSize(contactLine, contentWidth);
    doc.text(splitContact, margin, y);
    y += splitContact.length * 11 + 6;

    // Divider
    doc.setDrawColor(17, 24, 39);
    doc.setLineWidth(1.5);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;

    // Professional Summary
    if (resume.summary) {
      addSectionHeader("Professional Summary");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(55, 65, 81);
      const splitSummary = doc.splitTextToSize(resume.summary, contentWidth);
      doc.text(splitSummary, margin, y);
      y += splitSummary.length * 12 + 4;
    }

    // Technical Skills
    if (resume.skills.length > 0) {
      addSectionHeader("Technical & Core Skills");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(55, 65, 81);
      const skillsStr = resume.skills.join("   •   ");
      const splitSkills = doc.splitTextToSize(skillsStr, contentWidth);
      doc.text(splitSkills, margin, y);
      y += splitSkills.length * 12 + 4;
    }

    // Work Experience
    if (resume.experience.length > 0) {
      addSectionHeader("Work Experience & Internships");
      resume.experience.forEach((exp) => {
        if (y > 760) {
          doc.addPage();
          y = 45;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(17, 24, 39);
        doc.text(exp.title, margin, y);

        if (exp.timeline) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(107, 114, 128);
          doc.text(exp.timeline, margin + contentWidth - doc.getTextWidth(exp.timeline), y);
        }
        y += 12;

        if (exp.organization) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(75, 85, 99);
          doc.text(exp.organization, margin, y);
          y += 12;
        }

        if (exp.description) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(55, 65, 81);
          const splitDesc = doc.splitTextToSize(exp.description, contentWidth);
          doc.text(splitDesc, margin, y);
          y += splitDesc.length * 11 + 6;
        }
      });
    }

    // Education
    if (resume.education.length > 0) {
      addSectionHeader("Education & Qualifications");
      resume.education.forEach((edu) => {
        if (y > 760) {
          doc.addPage();
          y = 45;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(17, 24, 39);
        const eduTitle = edu.course ? `${edu.education} — ${edu.course}` : edu.education;
        doc.text(eduTitle, margin, y);

        if (edu.timeline) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(107, 114, 128);
          doc.text(edu.timeline, margin + contentWidth - doc.getTextWidth(edu.timeline), y);
        }
        y += 12;

        if (edu.institution) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(75, 85, 99);
          doc.text(edu.institution, margin, y);
          if (edu.grade) {
            doc.text(edu.grade, margin + contentWidth - doc.getTextWidth(edu.grade), y);
          }
          y += 12;
        }
      });
    }

    // Certifications
    if (resume.certifications.length > 0) {
      addSectionHeader("Certifications & Licenses");
      resume.certifications.forEach((cert) => {
        if (y > 760) {
          doc.addPage();
          y = 45;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(17, 24, 39);
        doc.text(cert.title, margin, y);

        if (cert.timeline) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(107, 114, 128);
          doc.text(cert.timeline, margin + contentWidth - doc.getTextWidth(cert.timeline), y);
        }
        y += 12;

        if (cert.issuer) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(75, 85, 99);
          doc.text(cert.issuer, margin, y);
          y += 11;
        }

        if (cert.summary) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(55, 65, 81);
          const splitSummary = doc.splitTextToSize(cert.summary, contentWidth);
          doc.text(splitSummary, margin, y);
          y += splitSummary.length * 11 + 6;
        }
      });
    }

    const filename = `${resume.fullName.trim().replace(/\s+/g, "_") || "Candidate"}_ATS_Resume.pdf`;
    doc.save(filename);
  };

  // Client-Side Print Resume using hidden iframe with dynamic HTML generation
  const handlePrintPDF = () => {
    const printHtml = generateResumePrintHtml(resume);

    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";
      iframe.setAttribute("aria-hidden", "true");
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc || !iframe.contentWindow) {
        throw new Error("Unable to access iframe document");
      }

      iframeDoc.open();
      iframeDoc.write(printHtml);
      iframeDoc.close();

      const iframeWin = iframe.contentWindow;
      setTimeout(() => {
        iframeWin.focus();
        iframeWin.print();
        setTimeout(() => {
          try {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          } catch (_) {}
        }, 1500);
      }, 250);
    } catch (err) {
      console.warn("Iframe printing failed, attempting popup window print:", err);
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      } else {
        window.print();
      }
    }
  };

  const handleAttachAndSave = () => {
    onAttachResume(resume, undefined, atsAnalysis.totalScore);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">ATS Custom Resume Builder</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Tailor your ATS resume specifically for {opportunity ? `"${opportunity.title}"` : "this application"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Real-time ATS Score Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <div className="text-left">
                <span className="text-[10px] text-muted-foreground uppercase font-mono block leading-none">
                  ATS Match Score
                </span>
                <span className="text-xs font-mono font-extrabold text-primary">
                  {uploadedResult ? uploadedResult.atsAnalysis.totalScore : atsAnalysis.totalScore}% Compatible
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-3 border-b border-border flex items-center gap-2 bg-background">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`text-xs font-semibold px-4 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "edit"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Customize Fields</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`text-xs font-semibold px-4 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "preview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Live PDF Preview &amp; Download</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`text-xs font-semibold px-4 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "upload"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Resume (PDF / DOCX)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "upload" ? (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="text-center space-y-1">
                <h4 className="text-base font-bold text-foreground">Upload Existing Resume</h4>
                <p className="text-xs text-muted-foreground">
                  Upload your pre-existing PDF or Word resume (.docx) to extract skills and compute an instant live ATS score against {opportunity ? `"${opportunity.title}"` : "this opportunity"}.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-primary/50 hover:bg-secondary/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">
                    {isUploading
                      ? "Analyzing document structure & calculating ATS match..."
                      : "Drag & drop your resume here, or browse files"}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Supported: PDF, DOCX (Max: 5MB)
                  </p>
                </div>
              </div>

              {uploadError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Uploaded Result Card */}
              {uploadedResult && (
                <div className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-4 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-foreground">{uploadedResult.filename}</h5>
                        <p className="text-[10.5px] font-mono text-muted-foreground">
                          Parsed &amp; Scored via Authoritative ATS Engine
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                        ATS Match Score
                      </span>
                      <span className="text-xl font-mono font-extrabold text-primary">
                        {uploadedResult.atsAnalysis.totalScore}%
                      </span>
                    </div>
                  </div>

                  {/* Score Breakdown Bar */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-card border border-border">
                      <span className="text-[10px] text-muted-foreground block uppercase">Technical Skills Match (60%)</span>
                      <span className="font-bold text-foreground text-sm">
                        {uploadedResult.atsAnalysis.skillScore}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-card border border-border">
                      <span className="text-[10px] text-muted-foreground block uppercase">Profile Completeness (40%)</span>
                      <span className="font-bold text-foreground text-sm">
                        {uploadedResult.atsAnalysis.completenessScore}%
                      </span>
                    </div>
                  </div>

                  {/* Matched Skills */}
                  {uploadedResult.atsAnalysis.matchedSkills.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                        Matched Skills in Document:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {uploadedResult.atsAnalysis.matchedSkills.map((sk) => (
                          <span
                            key={sk.skill}
                            className="text-[10.5px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold"
                          >
                            <Check className="w-3 h-3" />
                            <span>{sk.skill}</span>
                            <span className="text-[9px] opacity-75">({Math.round(sk.weight * 100)}%)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {uploadedResult.atsAnalysis.missingSkills.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                        Missing Opportunity Skills:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {uploadedResult.atsAnalysis.missingSkills.map((sk) => (
                          <span
                            key={sk}
                            className="text-[10.5px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action row in card */}
                  <div className="pt-2 border-t border-border flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleAttachUploaded}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Attach Uploaded Resume ({uploadedResult.atsAnalysis.totalScore}%)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "edit" ? (
            <div className="space-y-8">
              {/* Profile Sync Notice Banner */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-primary">
                    This data is directly fetched from your profile.
                  </p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    You can edit, add, or customize any details below specifically for this application without altering your permanent profile.
                  </p>
                </div>
              </div>

              {/* Target Opportunity Requirements Alert */}
              {opportunity && (
                <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5 font-mono text-primary">
                      <Sparkles className="w-4 h-4" />
                      Role Skill Requirements Match
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {atsAnalysis.matchedSkills.filter((s) => s.source !== "unmatched").length} of {opportunity.requiredSkills?.length || 0} Skills Matched
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(opportunity.requiredSkills || []).map((reqSkill: string, idx: number) => {
                      const isMatched = resume.skills.some((s) =>
                        s.toLowerCase().includes(reqSkill.toLowerCase().trim())
                      );
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (!isMatched) {
                              setResume((prev) => ({ ...prev, skills: [...prev.skills, reqSkill] }));
                            }
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-full font-mono font-medium border flex items-center gap-1 transition-all cursor-pointer ${
                            isMatched
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                          }`}
                          title={isMatched ? "Skill Matched" : "Click to add this required skill to resume"}
                        >
                          {isMatched ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          {reqSkill}
                          {!isMatched && <span className="text-[9px] font-bold underline ml-1">Add</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 1: Personal Information */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h2 className="text-sm font-black uppercase tracking-wider text-foreground font-mono flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Personal Information &amp; Contact
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={resume.fullName}
                      onChange={(e) => setResume({ ...resume, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Professional Headline</label>
                    <input
                      type="text"
                      value={resume.headline}
                      onChange={(e) => setResume({ ...resume, headline: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={resume.email}
                      onChange={(e) => setResume({ ...resume, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Phone / Contact</label>
                    <input
                      type="text"
                      value={resume.phone}
                      onChange={(e) => setResume({ ...resume, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Location / City</label>
                    <input
                      type="text"
                      value={resume.location}
                      onChange={(e) => setResume({ ...resume, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">LinkedIn Profile</label>
                    <input
                      type="text"
                      value={resume.linkedin}
                      onChange={(e) => setResume({ ...resume, linkedin: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">GitHub / Code Repository</label>
                    <input
                      type="text"
                      value={resume.github}
                      onChange={(e) => setResume({ ...resume, github: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Portfolio / Website</label>
                    <input
                      type="text"
                      value={resume.website}
                      onChange={(e) => setResume({ ...resume, website: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Professional Summary */}
              <div className="space-y-3">
                <div className="border-b border-border pb-2">
                  <h2 className="text-sm font-black uppercase tracking-wider text-foreground font-mono flex items-center justify-between">
                    <span>Professional Summary</span>
                    <span className="text-[10px] text-muted-foreground font-normal lowercase">
                      {resume.summary.length} characters
                    </span>
                  </h2>
                </div>
                <textarea
                  value={resume.summary}
                  onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none leading-relaxed"
                  placeholder="Provide a concise 2-3 line summary highlighting your core strengths and academic background..."
                />
              </div>

              {/* SECTION 3: Technical & Core Skills */}
              <div className="space-y-3">
                <div className="border-b border-border pb-2 flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-wider text-foreground font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Technical &amp; Core Skills ({resume.skills.length})
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2 p-3.5 rounded-xl bg-secondary/30 border border-border min-h-[50px]">
                  {resume.skills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-card border border-border text-xs font-medium text-foreground group"
                    >
                      <SkillBadge skill={skill} size="xs" />
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer ml-1"
                        title="Remove skill"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                    placeholder="Add custom skill (e.g., Python, Docker, PyTorch)…"
                    className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    Add Skill
                  </button>
                </div>
              </div>

              {/* SECTION 4: Education & Qualifications */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2 flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-wider text-foreground font-mono flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    Education &amp; Academic Qualifications
                  </h2>
                  <button
                    type="button"
                    onClick={handleAddEducation}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Education</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {resume.education.map((edu, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-card border border-border space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground font-mono">
                          Degree Entry #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(idx)}
                          className="text-muted-foreground hover:text-destructive text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Degree / Qualification</label>
                          <input
                            type="text"
                            value={edu.education}
                            onChange={(e) => handleUpdateEducation(idx, "education", e.target.value)}
                            placeholder="e.g. Bachelor of Technology (B.Tech)"
                            className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Institution / University</label>
                          <input
                            type="text"
                            value={edu.institution || ""}
                            onChange={(e) => handleUpdateEducation(idx, "institution", e.target.value)}
                            placeholder="e.g. Indian Institute of Technology Bombay"
                            className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Major / Course Field</label>
                          <input
                            type="text"
                            value={edu.course || ""}
                            onChange={(e) => handleUpdateEducation(idx, "course", e.target.value)}
                            placeholder="e.g. Computer Science & Engineering"
                            className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Timeline / Year</label>
                            <input
                              type="text"
                              value={edu.timeline || ""}
                              onChange={(e) => handleUpdateEducation(idx, "timeline", e.target.value)}
                              placeholder="e.g. 2022 - 2026"
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Score / CGPA</label>
                            <input
                              type="text"
                              value={edu.grade || ""}
                              onChange={(e) => handleUpdateEducation(idx, "grade", e.target.value)}
                              placeholder="e.g. CGPA: 8.9 / 10"
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 5: Work Experience & Internships */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2 flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-wider text-foreground font-mono flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Work Experience &amp; Internships
                  </h2>
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Experience</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {resume.experience.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                      No experience listed. Click &quot;Add Experience&quot; to include internships or projects.
                    </div>
                  ) : (
                    resume.experience.map((exp, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-card border border-border space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground font-mono">
                            Experience Entry #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExperience(idx)}
                            className="text-muted-foreground hover:text-destructive text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Role / Job Title</label>
                            <input
                              type="text"
                              value={exp.title}
                              onChange={(e) => handleUpdateExperience(idx, "title", e.target.value)}
                              placeholder="e.g. Full-Stack Developer Intern"
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Company / Organization</label>
                            <input
                              type="text"
                              value={exp.organization || ""}
                              onChange={(e) => handleUpdateExperience(idx, "organization", e.target.value)}
                              placeholder="e.g. Zerodha / Microsoft"
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Timeline / Duration</label>
                            <input
                              type="text"
                              value={exp.timeline || ""}
                              onChange={(e) => handleUpdateExperience(idx, "timeline", e.target.value)}
                              placeholder="e.g. May 2025 - July 2025"
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Key Responsibilities &amp; Impact Description
                          </label>
                          <textarea
                            value={exp.description || ""}
                            onChange={(e) => handleUpdateExperience(idx, "description", e.target.value)}
                            rows={2}
                            placeholder="e.g. Built automated ETL pipelines with Python and Docker reducing processing latency by 35%..."
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECTION 6: Certifications & Licenses (Fetched from Profile) */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2 flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-wider text-foreground font-mono flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    Certifications &amp; Licenses
                  </h2>
                  <button
                    type="button"
                    onClick={handleAddCertification}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Certificate</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {resume.certifications.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                      No certifications listed. Click &quot;Add Certificate&quot; to include credentials.
                    </div>
                  ) : (
                    resume.certifications.map((cert, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-card border border-border space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground font-mono">
                            Certification Entry #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCertification(idx)}
                            className="text-muted-foreground hover:text-destructive text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Certificate Title</label>
                            <input
                              type="text"
                              value={cert.title}
                              onChange={(e) => handleUpdateCertification(idx, "title", e.target.value)}
                              placeholder="e.g. Meta Certified Front-End Developer"
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Issuing Organization</label>
                            <input
                              type="text"
                              value={cert.issuer || ""}
                              onChange={(e) => handleUpdateCertification(idx, "issuer", e.target.value)}
                              placeholder="e.g. Meta / Coursera / AWS"
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Timeline / Year</label>
                            <input
                              type="text"
                              value={cert.timeline || ""}
                              onChange={(e) => handleUpdateCertification(idx, "timeline", e.target.value)}
                              placeholder="e.g. 2025"
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                              Summary / Key Competencies Verified
                            </label>
                            <input
                              type="text"
                              value={cert.summary || ""}
                              onChange={(e) => handleUpdateCertification(idx, "summary", e.target.value)}
                              placeholder="e.g. Tested mastery in React, state management, and modern web APIs."
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Credential URL (Optional)</label>
                            <input
                              type="text"
                              value={cert.credentialUrl || ""}
                              onChange={(e) => handleUpdateCertification(idx, "credentialUrl", e.target.value)}
                              placeholder="e.g. https://coursera.org/verify/..."
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Live PDF Preview View */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/50 border border-border text-xs">
                <span className="font-medium text-foreground flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ATS-Standard Formatted Document Ready
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadJsPDF}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
                    title="1-Click Direct Vector PDF Download using jsPDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF (jsPDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintPDF}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-semibold border border-border transition-colors cursor-pointer"
                    title="Open browser print dialog"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Resume</span>
                  </button>
                </div>
              </div>

              {/* ATS Resume Sheet */}
              <div
                ref={resumePrintRef}
                className="bg-white text-gray-900 p-8 sm:p-10 rounded-xl border border-gray-300 shadow-lg max-w-3xl mx-auto space-y-6 text-left"
              >
                {/* Header */}
                <div className="border-b-2 border-gray-900 pb-3">
                  <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">
                    {resume.fullName}
                  </h1>
                  <p className="text-xs font-bold text-gray-700 mt-1 uppercase tracking-wide">
                    {resume.headline}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mt-2 font-mono">
                    <span>{resume.email}</span>
                    <span>• {resume.phone}</span>
                    {resume.location && <span>• {resume.location}</span>}
                    {resume.linkedin && <span>• {resume.linkedin}</span>}
                    {resume.github && <span>• {resume.github}</span>}
                  </div>
                </div>

                {/* Summary */}
                {resume.summary && (
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2 font-mono">
                      Professional Summary
                    </h2>
                    <p className="text-xs text-gray-700 leading-relaxed">{resume.summary}</p>
                  </div>
                )}

                {/* Technical Skills */}
                {resume.skills.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2 font-mono">
                      Technical &amp; Core Skills
                    </h2>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {resume.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-300 font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Experience */}
                {resume.experience.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2 font-mono">
                      Experience &amp; Internships
                    </h2>
                    <div className="space-y-3">
                      {resume.experience.map((exp, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-baseline text-xs font-bold text-gray-900">
                            <span>{exp.title}</span>
                            <span className="font-mono text-[11px] text-gray-600">{exp.timeline}</span>
                          </div>
                          {exp.organization && <p className="text-xs font-semibold text-gray-700">{exp.organization}</p>}
                          {exp.description && <p className="text-xs text-gray-600 leading-relaxed">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {resume.education.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2 font-mono">
                      Education &amp; Qualifications
                    </h2>
                    <div className="space-y-2.5">
                      {resume.education.map((edu, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex justify-between items-baseline text-xs text-gray-900">
                            <div>
                              <span className="font-bold">{edu.education}</span>
                              {edu.course && <span className="text-gray-700 font-medium"> — {edu.course}</span>}
                              {edu.institution && <p className="text-xs text-gray-600">{edu.institution}</p>}
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-[11px] text-gray-600 block">{edu.timeline}</span>
                              {edu.grade && <span className="font-mono text-[11px] text-gray-800 font-bold block">{edu.grade}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {resume.certifications.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2 font-mono">
                      Certifications &amp; Licenses
                    </h2>
                    <div className="space-y-2.5">
                      {resume.certifications.map((cert, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex justify-between items-baseline text-xs text-gray-900">
                            <span className="font-bold">{cert.title}</span>
                            <span className="font-mono text-[11px] text-gray-600">{cert.timeline}</span>
                          </div>
                          {cert.issuer && <p className="text-xs text-gray-700 font-semibold">{cert.issuer}</p>}
                          {cert.summary && <p className="text-xs text-gray-600 leading-relaxed">{cert.summary}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-muted/20">
          <div className="flex items-center gap-2">
            {activeTab === "upload" ? (
              uploadedResult ? (
                <button
                  type="button"
                  onClick={handleAttachUploaded}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Attach Uploaded Resume ({uploadedResult.atsAnalysis.totalScore}% ATS) &amp; Continue</span>
                </button>
              ) : (
                <p className="text-xs text-muted-foreground font-mono">
                  Select or drop a resume above to calculate live ATS score.
                </p>
              )
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleDownloadJsPDF}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-semibold border border-border transition-colors cursor-pointer"
                  title="Direct ATS PDF Download via jsPDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF (jsPDF)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintPDF}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-semibold border border-border transition-colors cursor-pointer"
                  title="Open browser print dialog"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Resume</span>
                </button>

                <button
                  type="button"
                  onClick={handleAttachAndSave}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Attach Resume &amp; Continue Application</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
