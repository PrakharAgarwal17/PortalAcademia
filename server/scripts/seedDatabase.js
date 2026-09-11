import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import profileModel from "../models/profileModel.js";
import opportunityModel from "../models/opportunityModel.js";
import assessmentModel from "../models/assessmentModel.js";
import applicationModel from "../models/applicationModel.js";
dotenv.config();
const MONGO_URI = process.env.MONGO_URL
    ? `${process.env.MONGO_URL}/PortalAcademia`
    : process.env.MONGODB_URI || "mongodb://root:rootpassword@localhost:27017/PortalAcademia";
async function seed() {
    try {
        console.log("Connecting to MongoDB for database seeding...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB successfully.");
        const hashedPassword = await bcrypt.hash("Password123!", 10);
        // 1. Ensure test users exist with hashed password
        const usersToSeed = [
            { email: "student.test@portalacademia.ac.in", isOnboarded: true },
            { email: "industry.test@company.com", isOnboarded: true },
            { email: "iitb.admin@portalacademia.ac.in", isOnboarded: true },
            { email: "faculty.test@portalacademia.ac.in", isOnboarded: true },
            { email: "new.student@portalacademia.ac.in", isOnboarded: false },
        ];
        const seededUserDocs = {};
        for (const u of usersToSeed) {
            let doc = await userModel.findOne({ email: u.email });
            if (!doc) {
                doc = await userModel.create({
                    email: u.email,
                    password: hashedPassword,
                    isVerified: true,
                    isOnboarded: u.isOnboarded,
                    provider: "local",
                });
            }
            else {
                doc.password = hashedPassword;
                doc.isVerified = true;
                doc.isOnboarded = u.isOnboarded;
                await doc.save();
            }
            seededUserDocs[u.email] = doc;
        }
        const studentUser = seededUserDocs["student.test@portalacademia.ac.in"];
        const industryUser = seededUserDocs["industry.test@company.com"];
        const institutionUser = seededUserDocs["iitb.admin@portalacademia.ac.in"];
        const facultyUser = seededUserDocs["faculty.test@portalacademia.ac.in"];
        // 2. Ensure Profiles exist
        await profileModel.findOneAndUpdate({ userId: studentUser._id }, {
            userId: studentUser._id,
            category: "individual",
            accountType: "student",
            name: "Priya Sharma",
            bio: "Pre-final year Computer Science undergraduate at IIT Bombay focused on distributed systems and AI applications.",
            location: "Mumbai, Maharashtra",
            institution: "Indian Institute of Technology Bombay",
            institutionEmail: "priya.sharma@iitb.ac.in",
            isEmailVerified: true,
            skills: ["React", "TypeScript", "Node.js", "Python", "Docker"],
            certifications: [
                {
                    title: "Meta Certified Front-End Developer",
                    issuer: "Meta / Coursera",
                    credentialUrl: "https://coursera.org/verify/meta-fe-12345",
                    isVerified: true,
                    verifiedAt: new Date(),
                },
                {
                    title: "AWS Certified Solutions Architect Associate",
                    issuer: "Amazon Web Services",
                    credentialUrl: "https://aws.amazon.com/verification/SAA-987654",
                    isVerified: false, // Pending Institution Verification Gate
                },
                {
                    title: "NPTEL Ayurvedic Informatics & Data Analytics",
                    issuer: "Ministry of Ayush / NPTEL",
                    credentialUrl: "https://nptel.ac.in/verify/ayush-345",
                    isVerified: false, // Pending Institution Verification Gate
                },
            ],
            pastExperience: [
                {
                    title: "Full-Stack Engineering Intern",
                    organization: "Zerodha",
                    timeline: "May 2025 - July 2025",
                    description: "Optimized WebSocket market feed processing pipeline reducing rendering latency by 38%.",
                    isVerified: true,
                    verifiedAt: new Date(),
                },
            ],
        }, { upsert: true, new: true });
        await profileModel.findOneAndUpdate({ userId: industryUser._id }, {
            userId: industryUser._id,
            category: "organization",
            accountType: "industry",
            name: "Tata Consultancy Services Recruiter",
            companyName: "Tata Consultancy Services",
            industryType: "IT & Digital Transformation",
            officialWebsite: "https://www.tcs.com",
            workEmail: "industry.test@company.com",
            employees: "1000+",
            location: "Mumbai, Maharashtra",
            bio: "Leading global IT services and consulting enterprise partnering with premier academic institutions across India.",
        }, { upsert: true, new: true });
        await profileModel.findOneAndUpdate({ userId: institutionUser._id }, {
            userId: institutionUser._id,
            category: "organization",
            accountType: "institution",
            name: "IIT Bombay Training & Placement Cell",
            institutionName: "Indian Institute of Technology Bombay",
            aisheCode: "U-0306",
            officialEmail: "iitb.admin@portalacademia.ac.in",
            contact: "+91 22 2576 7000",
            location: "Powai, Mumbai",
            bio: "Official Training & Placement Office managing undergraduate, postgraduate, and faculty industry immersion pipelines.",
        }, { upsert: true, new: true });
        await profileModel.findOneAndUpdate({ userId: facultyUser._id }, {
            userId: facultyUser._id,
            category: "individual",
            accountType: "faculty",
            name: "Dr. Rajesh Kulkarni",
            designation: "Associate Professor",
            department: "Computer Science & Engineering",
            institution: "Indian Institute of Technology Bombay",
            institutionEmail: "faculty.test@portalacademia.ac.in",
            isEmailVerified: true,
            expertise: ["Distributed Systems", "Cloud Security", "Applied ML"],
            researchInterests: ["High-Throughput Consensus", "Ayurvedic Medical Informatics"],
            bio: "14+ years of academic research and consulting in distributed cloud architectures.",
        }, { upsert: true, new: true });
        // 3. Seed Standardized Skill Assessments
        await assessmentModel.deleteMany({});
        console.log("Seeding standardized skill assessments...");
        const pythonAssessment = await assessmentModel.create({
            title: "Python for Data & Systems Benchmark",
            description: "Objective evaluation testing proficiency in memory models, list comprehensions, data frames, and algorithmic efficiency.",
            category: "Technical",
            skillVectors: ["Python", "Pandas", "Data Structures"],
            durationMinutes: 10,
            passPercentage: 70,
            difficulty: "Intermediate",
            badgeAwarded: "Verified Python Practitioner",
            questions: [
                {
                    questionId: "py-1",
                    questionText: "What is the primary difference between Python's 'is' and '==' operators?",
                    options: [
                        "'is' checks object identity (memory address), while '==' checks value equality",
                        "'is' checks value equality, while '==' checks object type",
                        "'is' is faster because it automatically casts types",
                        "There is no difference in modern Python 3"
                    ],
                    correctOptionIndex: 0,
                    explanation: "'is' evaluates reference equality in memory (id(a) == id(b)), whereas '==' calls the __eq__ method.",
                    weight: 1,
                },
                {
                    questionId: "py-2",
                    questionText: "Which data structure in Python provides O(1) average time complexity for key lookups?",
                    options: ["List", "Tuple", "Dictionary (Hash Map)", "Binary Search Tree"],
                    correctOptionIndex: 2,
                    explanation: "Python dictionaries are implemented using high-density hash tables providing amortized O(1) lookup.",
                    weight: 1,
                },
                {
                    questionId: "py-3",
                    questionText: "What does the GIL (Global Interpreter Lock) in CPython prevent?",
                    options: [
                        "Multiple processes from running simultaneously",
                        "Multiple native threads from executing Python bytecode in parallel",
                        "Asyncio event loops from handling I/O operations",
                        "Garbage collection cycles"
                    ],
                    correctOptionIndex: 1,
                    explanation: "The GIL ensures thread-safe memory management in CPython by allowing only one thread to execute bytecode at a time.",
                    weight: 1,
                },
                {
                    questionId: "py-4",
                    questionText: "In Pandas, what is the most memory-efficient way to handle a column with few unique string values?",
                    options: [
                        "Convert dtype to 'category'",
                        "Convert dtype to 'object'",
                        "Store as raw byte strings",
                        "Leave as default string format"
                    ],
                    correctOptionIndex: 0,
                    explanation: "Categorical dtypes encode distinct values into an integer dictionary, drastically reducing RAM utilization.",
                    weight: 1,
                },
                {
                    questionId: "py-5",
                    questionText: "What will `[x**2 for x in range(5) if x % 2 == 0]` produce?",
                    options: ["[0, 4, 16]", "[0, 1, 4, 9, 16]", "[1, 9]", "[4, 16]"],
                    correctOptionIndex: 0,
                    explanation: "Range(5) yields 0, 1, 2, 3, 4. Even values are 0, 2, 4. Squared: 0, 4, 16.",
                    weight: 1,
                },
            ],
        });
        const cloudAssessment = await assessmentModel.create({
            title: "Cloud Infrastructure & Containerization Assessment",
            description: "Standardized evaluation on Docker container isolation, image layers, and microservice networking.",
            category: "Technical",
            skillVectors: ["Docker", "Cloud", "Linux"],
            durationMinutes: 10,
            passPercentage: 70,
            difficulty: "Intermediate",
            badgeAwarded: "Certified Container Specialist",
            questions: [
                {
                    questionId: "cl-1",
                    questionText: "What Linux kernel primitives form the core foundation of Docker container isolation?",
                    options: [
                        "Namespaces and cgroups",
                        "KVM and QEMU hypervisors",
                        "Systemd and Cron daemons",
                        "IPTables and BPF filters only"
                    ],
                    correctOptionIndex: 0,
                    explanation: "Namespaces provide workspace isolation (PID, NET, MNT), and cgroups limit resource consumption (CPU, RAM).",
                    weight: 1,
                },
                {
                    questionId: "cl-2",
                    questionText: "Why is multi-stage Docker builds recommended for production deployments?",
                    options: [
                        "It makes containers run 10x faster",
                        "It excludes compilation toolchains and build dependencies from the final lightweight runtime image",
                        "It bypasses root user requirements automatically",
                        "It creates multiple container instances concurrently"
                    ],
                    correctOptionIndex: 1,
                    explanation: "Multi-stage builds allow copying only built artifacts into a minimal base image (like alpine or distroless).",
                    weight: 1,
                },
                {
                    questionId: "cl-3",
                    questionText: "What does the `EXPOSE` instruction in a Dockerfile do?",
                    options: [
                        "Automatically publishes the port to the host network interface",
                        "Serves as documentation metadata indicating which port the container listens on",
                        "Opens firewall rules in the operating system",
                        "Encrypts incoming traffic"
                    ],
                    correctOptionIndex: 1,
                    explanation: "`EXPOSE` functions purely as operational documentation. Host port publishing requires the `-p` runtime flag.",
                    weight: 1,
                },
                {
                    questionId: "cl-4",
                    questionText: "In AWS architecture, which service provides serverless event-driven compute?",
                    options: ["Amazon EC2", "AWS Lambda", "Amazon EBS", "Amazon RDS"],
                    correctOptionIndex: 1,
                    explanation: "AWS Lambda executes code in response to events and automatically manages the underlying compute infrastructure.",
                    weight: 1,
                },
            ],
        });
        // 4. Seed Marketplace Opportunities across all 6 categories
        await opportunityModel.deleteMany({});
        console.log("Seeding marketplace opportunities across all 6 categories...");
        const opp1 = await opportunityModel.create({
            title: "AI Research & Applied NLP Engineering Intern",
            description: "Work directly with senior AI researchers at TCS Innovation Labs developing domain-adapted LLMs and knowledge graphs for enterprise search.",
            organization: "Tata Consultancy Services",
            createdBy: industryUser._id,
            category: "internship",
            domain: "Machine Learning & Natural Language Processing",
            location: "Bengaluru, KA",
            mode: "Hybrid",
            duration: "6 Months",
            stipendOrPrize: "₹45,000 / mo",
            requiredSkills: ["Python", "PyTorch", "NLP", "React"],
            eligibility: "Pre-final / final year B.Tech, M.Tech, or MCA candidates with verified Python competency.",
            deadline: "2026-10-30",
            status: "active",
            recommendedToStudentsBy: [institutionUser._id],
            applicantCount: 3,
        });
        const opp2 = await opportunityModel.create({
            title: "Smart Ayush Healthcare Innovation Challenge 2026",
            description: "National hackathon sponsored by Ministry of Ayush tackling digital herbarium classification, clinical telemetry standardization, and patient symptom triaging.",
            organization: "Ministry of Ayush / SIH",
            createdBy: industryUser._id,
            category: "hackathon",
            domain: "Ayurvedic Healthcare Telemetry",
            location: "New Delhi (Grand Finale) / Virtual Sprints",
            mode: "Hybrid",
            duration: "48 Hours",
            stipendOrPrize: "₹3,50,000 Prize Pool",
            requiredSkills: ["React", "Node.js", "Data Analysis", "MongoDB"],
            eligibility: "Student teams of 4-6 members enrolled in accredited AISHE Indian institutions.",
            deadline: "2026-11-15",
            status: "active",
            recommendedToStudentsBy: [institutionUser._id],
            applicantCount: 14,
        });
        const opp3 = await opportunityModel.create({
            title: "AWS Cloud Practitioner & Serverless Architecture Masterclass",
            description: "4-week hands-on deep dive covering AWS Lambda, API Gateway, DynamoDB, and infrastructure-as-code with official certification examination vouchers.",
            organization: "AWS Academy & PortalAcademia",
            createdBy: industryUser._id,
            category: "workshop",
            domain: "Cloud Architecture & DevOps",
            location: "Remote (Interactive Virtual Lab)",
            mode: "Remote",
            duration: "4 Weeks",
            stipendOrPrize: "Free Certified Voucher (Value ₹12,000)",
            requiredSkills: ["Cloud", "Linux", "Docker"],
            eligibility: "Open to all students and faculty seeking official AWS Cloud certification.",
            deadline: "2026-10-15",
            status: "active",
            recommendedToStudentsBy: [institutionUser._id],
            recommendedToFacultyBy: [institutionUser._id],
            applicantCount: 28,
        });
        const opp4 = await opportunityModel.create({
            title: "Faculty Development Program (FDP) on AI & Pedagogical Modernization",
            description: "Intensive 2-week hybrid refresher program empowering university professors to integrate live industry telemetry, case studies, and ML tools into syllabus design.",
            organization: "IIT Bombay & Ministry of Education",
            createdBy: institutionUser._id,
            category: "fdp",
            domain: "Higher Education Curriculum Modernization",
            location: "Mumbai, Maharashtra",
            mode: "Hybrid",
            duration: "2 Weeks",
            stipendOrPrize: "MHRD Certified Credit Badge",
            requiredSkills: ["Machine Learning", "Curriculum Design", "Python"],
            eligibility: "Accredited university professors, assistant professors, and lecturers across all departments.",
            deadline: "2026-10-25",
            status: "active",
            recommendedToFacultyBy: [institutionUser._id],
            applicantCount: 9,
        });
        const opp5 = await opportunityModel.create({
            title: "Industrial Sabbatical in Autonomous Systems & Robotics",
            description: "Corporate sabbatical residency at DRDO laboratories for university faculty to conduct defense robotics research, unmanned aerial system simulation, and embedded control testing.",
            organization: "DRDO Research & Development Center",
            createdBy: industryUser._id,
            category: "sabbatical",
            domain: "Robotics, Autonomous Navigation & Control",
            location: "Pune, Maharashtra",
            mode: "On-site",
            duration: "3 - 6 Months",
            stipendOrPrize: "₹1,20,000 / mo Fellowship",
            requiredSkills: ["Robotics", "Embedded Systems", "C++", "Linux"],
            eligibility: "Tenured or contract faculty with Ph.D. or 5+ years academic teaching experience in engineering.",
            deadline: "2026-11-30",
            status: "active",
            recommendedToFacultyBy: [institutionUser._id],
            applicantCount: 4,
        });
        const opp6 = await opportunityModel.create({
            title: "Joint Industry-Academia Ayurvedic Telemetry Knowledge Graph",
            description: "Sponsored corporate-academic research grant to build a unified ontologic knowledge graph linking classical Ayurvedic formulations with modern biochemical telemetry.",
            organization: "Dabur Research & Ministry of Ayush",
            createdBy: industryUser._id,
            category: "research",
            domain: "Medical Informatics & Knowledge Graphs",
            location: "New Delhi / Remote",
            mode: "Hybrid",
            duration: "12 Months",
            stipendOrPrize: "₹15,00,000 Seed Grant",
            requiredSkills: ["Knowledge Graphs", "Python", "Data Analysis"],
            eligibility: "Joint proposals led by a university professor paired with student researchers.",
            deadline: "2026-12-15",
            status: "active",
            recommendedToFacultyBy: [institutionUser._id],
            applicantCount: 6,
        });
        // 5. Seed Initial Sample Application
        await applicationModel.deleteMany({});
        await applicationModel.create({
            opportunityId: opp1._id,
            applicantId: studentUser._id,
            applicantName: "Priya Sharma",
            applicantEmail: "priya.sharma@iitb.ac.in",
            applicantInstitution: "Indian Institute of Technology Bombay",
            applicantSkills: ["React", "TypeScript", "Node.js", "Python", "Docker"],
            matchScore: 92,
            status: "Shortlisted",
            appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            notes: "I have hands-on experience building NLP text processing pipelines and modern React dashboards.",
            reviewerNotes: "Excellent profile. Passed standardized Python test with 90%. Advancing to interview.",
        });
        console.log("Database seeded successfully!");
        console.log(`- Seeded 4 User Profiles: Student, Industry, Institution, Faculty`);
        console.log(`- Seeded 2 Standardized Assessments: Python & Cloud/Containers`);
        console.log(`- Seeded 6 Opportunities across all categories: Internship, Hackathon, Workshop, FDP, Sabbatical, Research`);
        console.log(`- Seeded 1 Active Application for Priya Sharma (Shortlisted)`);
        process.exit(0);
    }
    catch (err) {
        console.error("Database seed error:", err);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=seedDatabase.js.map