import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import profileModel from "../models/profileModel.js";
import opportunityModel from "../models/opportunityModel.js";
import assessmentModel from "../models/assessmentModel.js";
import applicationModel from "../models/applicationModel.js";
import membershipModel from "../models/membershipModel.js";
import mentorshipModel from "../models/mentorshipModel.js";
import communitySpaceModel from "../models/communitySpaceModel.js";
import communityMessageModel from "../models/communityMessageModel.js";
import openSourceProjectModel from "../models/openSourceProjectModel.js";
import contributionModel from "../models/contributionModel.js";

dotenv.config();

function getMongoUri(): string {
    const raw = process.env.MONGO_URL || process.env.MONGODB_URI || "mongodb://root:rootpassword@localhost:27017";
    if (raw.includes("/PortalAcademia")) {
        return raw;
    }
    if (raw.includes("?")) {
        return raw.replace("?", "/PortalAcademia?");
    }
    return `${raw.replace(/\/+$/, "")}/PortalAcademia`;
}

const MONGO_URI = getMongoUri();

async function seed() {
    try {
        const atlasUri = getMongoUri();
        try {
            console.log("Connecting to MongoDB Atlas cluster...");
            await mongoose.connect(atlasUri, { dbName: "PortalAcademia", serverSelectionTimeoutMS: 5000 });
            console.log("Connected to MongoDB Atlas successfully.");
        } catch (atlasErr: any) {
            console.warn("Notice: MongoDB Atlas connection unreachable (IP whitelist or network):", atlasErr?.message);
            console.log("Falling back to authenticated local MongoDB instance (root:rootpassword@localhost:27017)...");
            try {
                await mongoose.connect("mongodb://root:rootpassword@localhost:27017/PortalAcademia?authSource=admin", { serverSelectionTimeoutMS: 5000 });
                console.log("Connected to authenticated local MongoDB instance successfully.");
            } catch (authErr) {
                await mongoose.connect("mongodb://localhost:27017/PortalAcademia", { serverSelectionTimeoutMS: 5000 });
                console.log("Connected to local MongoDB instance successfully.");
            }
        }

        const hashedPassword = await bcrypt.hash("Password123!", 10);

        // 1. Ensure test users exist with hashed password
        const usersToSeed = [
            { email: "student.test@portalacademia.ac.in", isOnboarded: true },
            { email: "industry.test@company.com", isOnboarded: true },
            { email: "iitb.admin@portalacademia.ac.in", isOnboarded: true },
            { email: "faculty.test@portalacademia.ac.in", isOnboarded: true },
            { email: "new.student@portalacademia.ac.in", isOnboarded: true },
            // Senior Scholar Peer Mentors (Free Registration)
            { email: "arjun.mentor@portalacademia.ac.in", isOnboarded: true },
            { email: "meera.mentor@portalacademia.ac.in", isOnboarded: true },
            { email: "kabir.mentor@portalacademia.ac.in", isOnboarded: true },
            { email: "ananya.mentor@portalacademia.ac.in", isOnboarded: true },
            { email: "rohan.mentor@portalacademia.ac.in", isOnboarded: true },
        ];

        const seededUserDocs: Record<string, any> = {};
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
            } else {
                doc.password = hashedPassword;
                doc.isVerified = true;
                doc.isOnboarded = u.isOnboarded;
                await doc.save();
            }
            seededUserDocs[u.email] = doc;
        }

        const studentUser = seededUserDocs["student.test@portalacademia.ac.in"];
        const juniorStudent = seededUserDocs["new.student@portalacademia.ac.in"];
        const industryUser = seededUserDocs["industry.test@company.com"];
        const institutionUser = seededUserDocs["iitb.admin@portalacademia.ac.in"];
        const facultyUser = seededUserDocs["faculty.test@portalacademia.ac.in"];
        const mentor1 = seededUserDocs["arjun.mentor@portalacademia.ac.in"];
        const mentor2 = seededUserDocs["meera.mentor@portalacademia.ac.in"];
        const mentor3 = seededUserDocs["kabir.mentor@portalacademia.ac.in"];
        const mentor4 = seededUserDocs["ananya.mentor@portalacademia.ac.in"];
        const mentor5 = seededUserDocs["rohan.mentor@portalacademia.ac.in"];

        // 2. Configure Student as Active Premium User
        const premiumExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await userModel.findByIdAndUpdate(studentUser._id, {
            isPremium: true,
            planTier: "paid",
            premiumExpiresAt: premiumExpiry,
        });

        await membershipModel.deleteMany({ userId: studentUser._id });
        await membershipModel.create({
            userId: studentUser._id,
            planType: "premium",
            amount: 200,
            currency: "INR",
            status: "active",
            startDate: new Date(),
            expiresAt: premiumExpiry,
        });

        // 3. Ensure Core Profiles exist
        await profileModel.findOneAndUpdate(
            { userId: studentUser._id },
            {
                userId: studentUser._id,
                category: "individual",
                accountType: "student",
                name: "Priya Sharma",
                headline: "4th Year CS Scholar · Distributed Systems & Web Architect",
                academicYear: "4th Year",
                graduationYear: new Date().getFullYear() + 1,
                bio: "Final-year Computer Science undergraduate at IIT Bombay focused on distributed systems, WebRTC signaling, and high-performance React architectures.",
                location: "Mumbai, Maharashtra",
                institution: "Indian Institute of Technology Bombay",
                institutionEmail: "priya.sharma@iitb.ac.in",
                isEmailVerified: true,
                isPremium: true,
                premiumExpiresAt: premiumExpiry,
                isMentor: true,
                isMentorVerified: true,
                mentorBio: "4th-year senior scholar at IIT Bombay specializing in distributed backends, WebSocket signaling, and React architecture. Happy to advise juniors on thesis design, ATS resumes, and internship interview prep.",
                mentorTopics: ["React 19", "Distributed Systems", "Full-Stack System Design", "Resume Review", "Mock Interviews"],
                mentorTermsAccepted: true,
                mentorTermsAcceptedAt: new Date(),
                atsBoostPoints: 20,
                skills: ["React", "TypeScript", "Node.js", "Python", "Docker", "Distributed Systems"],
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
                        isVerified: false,
                    },
                ],
            },
            { upsert: true, new: true }
        );

        // Seed Junior Mentee Profile (Aarav Patel)
        await profileModel.findOneAndUpdate(
            { userId: juniorStudent._id },
            {
                userId: juniorStudent._id,
                category: "individual",
                accountType: "student",
                name: "Aarav Patel",
                headline: "2nd Year CS Undergrad · Open Source Enthusiast",
                academicYear: "2nd Year",
                graduationYear: new Date().getFullYear() + 3,
                institution: "Indian Institute of Technology Bombay",
                institutionEmail: "aarav.patel@iitb.ac.in",
                bio: "Sophomore studying computer science at IIT Bombay. Currently exploring full-stack engineering and asynchronous event pipelines.",
                location: "Mumbai, Maharashtra",
                skills: ["React", "JavaScript", "Tailwind CSS", "Node.js"],
            },
            { upsert: true, new: true }
        );

        await profileModel.findOneAndUpdate(
            { userId: industryUser._id },
            {
                userId: industryUser._id,
                category: "organization",
                accountType: "industry",
                name: "Razorpay Engineering",
                companyName: "Razorpay Software Pvt. Ltd.",
                industryType: "FinTech & Payment Rails",
                officialWebsite: "https://razorpay.com",
                workEmail: "tech@razorpay.com",
                employees: "1000+",
                location: "Bengaluru, Karnataka",
                bio: "Building developer-friendly payment rails and financial infrastructure for Indian and global commerce.",
            },
            { upsert: true, new: true }
        );

        await profileModel.findOneAndUpdate(
            { userId: institutionUser._id },
            {
                userId: institutionUser._id,
                category: "organization",
                accountType: "institution",
                name: "IIT Bombay Academic Administration",
                institutionName: "Indian Institute of Technology Bombay",
                aisheCode: "U-0306",
                officialEmail: "admin@iitb.ac.in",
                contact: "+91-22-2576-7000",
                location: "Powai, Mumbai, Maharashtra",
                bio: "Premier engineering institute in India committed to excellence in scientific education and technological innovation.",
            },
            { upsert: true, new: true }
        );

        await profileModel.findOneAndUpdate(
            { userId: facultyUser._id },
            {
                userId: facultyUser._id,
                category: "individual",
                accountType: "faculty",
                name: "Dr. A. K. Sundaram",
                institution: "Indian Institute of Technology Bombay",
                designation: "Professor & Department Head",
                department: "Computer Science & Engineering",
                expertise: ["Distributed Systems", "Consensus Protocols", "Cloud Infrastructure"],
                researchInterests: ["Fault-Tolerant State Machines", "Ayurvedic Medical Informatics"],
                location: "Mumbai, Maharashtra",
                bio: "20+ years of research and teaching in distributed algorithms, consensus mechanisms, and high-availability database architectures.",
            },
            { upsert: true, new: true }
        );

        // 4. Seed Senior Scholar Peer Mentors (Free Registration, Accepted Terms)
        await profileModel.findOneAndUpdate(
            { userId: mentor1._id },
            {
                userId: mentor1._id,
                category: "individual",
                accountType: "student",
                name: "Arjun Venkatraman",
                headline: "4th Year CS Scholar · Distributed Systems Specialist",
                institution: "IIT Madras",
                academicYear: "4th Year",
                graduationYear: new Date().getFullYear() + 1,
                isMentor: true,
                isMentorVerified: true,
                mentorBio: "Final-year undergrad focusing on Golang, consensus engines, and Kubernetes internals. Open for system design and architecture reviews.",
                mentorTopics: ["Distributed Systems", "Go", "Docker", "Consensus Algorithms", "Resume Review"],
                mentorTermsAccepted: true,
                mentorTermsAcceptedAt: new Date(),
                atsBoostPoints: 20,
                skills: ["Go", "Kubernetes", "Distributed Systems", "Docker"],
            },
            { upsert: true, new: true }
        );

        await profileModel.findOneAndUpdate(
            { userId: mentor2._id },
            {
                userId: mentor2._id,
                category: "individual",
                accountType: "student",
                name: "Meera Krishnan",
                headline: "Senior Engineering Fellow · Full-Stack Lead",
                institution: "BITS Pilani",
                academicYear: "4th Year",
                graduationYear: new Date().getFullYear(),
                isMentor: true,
                isMentorVerified: true,
                mentorBio: "Passionate about modern React 19, TypeScript compiler tools, and high-performance WebRTC applications. 5+ completed terms.",
                mentorTopics: ["React 19", "Full-Stack System Design", "TypeScript", "Performance Tuning"],
                mentorTermsAccepted: true,
                mentorTermsAcceptedAt: new Date(),
                atsBoostPoints: 20,
                skills: ["React", "TypeScript", "Node.js", "WebRTC", "System Design"],
            },
            { upsert: true, new: true }
        );

        await profileModel.findOneAndUpdate(
            { userId: mentor3._id },
            {
                userId: mentor3._id,
                category: "individual",
                accountType: "student",
                name: "Kabir Sen",
                headline: "AI/ML Research Fellow",
                institution: "IIIT Hyderabad",
                academicYear: "4th Year",
                graduationYear: new Date().getFullYear() + 1,
                isMentor: true,
                isMentorVerified: true,
                mentorBio: "Researching Transformer model quantization and lightweight inference pipelines with PyTorch and ONNX.",
                mentorTopics: ["Machine Learning", "Transformers", "PyTorch", "NLP", "Model Quantization"],
                mentorTermsAccepted: true,
                mentorTermsAcceptedAt: new Date(),
                atsBoostPoints: 20,
                skills: ["Python", "PyTorch", "Machine Learning", "Transformers"],
            },
            { upsert: true, new: true }
        );

        await profileModel.findOneAndUpdate(
            { userId: mentor4._id },
            {
                userId: mentor4._id,
                category: "individual",
                accountType: "student",
                name: "Ananya Deshmukh",
                headline: "Cloud Architect & SRE Specialist",
                institution: "IIT Delhi",
                academicYear: "4th Year",
                graduationYear: new Date().getFullYear() + 1,
                isMentor: true,
                isMentorVerified: true,
                mentorBio: "Specializing in AWS cloud topologies, Terraform IaC, and Kubernetes cluster reliability. Experienced in conducting mock cloud design interviews.",
                mentorTopics: ["Cloud Architecture", "AWS", "Kubernetes", "DevOps & CI/CD", "System Design"],
                mentorTermsAccepted: true,
                mentorTermsAcceptedAt: new Date(),
                atsBoostPoints: 20,
                skills: ["AWS", "Kubernetes", "Terraform", "Docker", "Go"],
            },
            { upsert: true, new: true }
        );

        await profileModel.findOneAndUpdate(
            { userId: mentor5._id },
            {
                userId: mentor5._id,
                category: "individual",
                accountType: "student",
                name: "Rohan Verma",
                headline: "Compilers & Systems Fellow",
                institution: "BITS Goa",
                academicYear: "4th Year",
                graduationYear: new Date().getFullYear() + 1,
                isMentor: true,
                isMentorVerified: true,
                mentorBio: "Focusing on Rust compiler internals, WebAssembly runtimes, and low-level Linux performance tuning. Eager to help scholars with OS and systems questions.",
                mentorTopics: ["Rust", "Operating Systems", "Compilers", "WebAssembly", "C++"],
                mentorTermsAccepted: true,
                mentorTermsAcceptedAt: new Date(),
                atsBoostPoints: 20,
                skills: ["Rust", "C++", "Compilers", "Linux", "WASM"],
            },
            { upsert: true, new: true }
        );

        // 5. Seed Mentorship Pairings (Outgoing & Incoming, Active & Completed)
        await mentorshipModel.deleteMany({});

        // Outgoing Pairing 1: Active Pairing (Priya Sharma with mentor Arjun Venkatraman)
        await mentorshipModel.create({
            mentorId: mentor1._id,
            menteeId: studentUser._id,
            status: "active",
            startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            targetEndDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
            topics: ["Distributed Systems", "Go", "Docker"],
            notes: "Bi-weekly architecture check-ins for distributed cache thesis implementation.",
            callSessions: [
                {
                    callRoomId: "session-call-101",
                    startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
                    durationMinutes: 25,
                },
            ],
            totalCallDurationMinutes: 25,
        });

        // Outgoing Pairing 2: Completed Pairing (Priya Sharma with mentor Meera Krishnan)
        await mentorshipModel.create({
            mentorId: mentor2._id,
            menteeId: studentUser._id,
            status: "completed",
            startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
            targetEndDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            topics: ["React 19", "System Design"],
            notes: "Frontend performance optimization and WebSocket state handling.",
            callSessions: [
                {
                    callRoomId: "session-call-201",
                    startedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                    endedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
                    durationMinutes: 20,
                },
                {
                    callRoomId: "session-call-202",
                    startedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                    endedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
                    durationMinutes: 25,
                },
            ],
            totalCallDurationMinutes: 45,
            menteeRating: 5,
            menteeFeedback: "Exceptional architecture review. Directly assisted with our thesis microservice topology and WebRTC signaling.",
            ratedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            certificateIssued: true,
            certificateIssuedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            certificateId: "CERT-MENTOR-M8K2X1",
        });

        // Incoming Pairing 3: Active Pairing (Priya Sharma as Mentor advising junior Aarav Patel)
        await mentorshipModel.create({
            mentorId: studentUser._id,
            menteeId: juniorStudent._id,
            status: "active",
            startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            targetEndDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
            topics: ["React 19", "Resume Review"],
            notes: "Advising on component state machine design and ATS formatting for campus hackathon project.",
            callSessions: [
                {
                    callRoomId: "session-call-priya-aarav",
                    startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    endedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
                    durationMinutes: 30,
                },
            ],
            totalCallDurationMinutes: 30,
        });

        // Incoming Pairing 4: Completed Pairing (Priya Sharma as Mentor advising a completed mentee)
        await mentorshipModel.create({
            mentorId: studentUser._id,
            menteeId: mentor3._id, // Kabir as sample mentee
            status: "completed",
            startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
            targetEndDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            topics: ["Distributed Systems", "Full-Stack System Design"],
            notes: "End-to-end distributed system review for ML model deployment service.",
            callSessions: [
                {
                    callRoomId: "session-call-priya-kabir-1",
                    startedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
                    endedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000),
                    durationMinutes: 35,
                },
            ],
            totalCallDurationMinutes: 35,
            menteeRating: 5,
            menteeFeedback: "Priya gave me invaluable feedback on my system architecture and mock interview readiness. Truly top tier!",
            ratedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            certificateIssued: true,
            certificateIssuedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            certificateId: "CERT-PRIYA-MENTOR-2026",
        });

        // 6. Seed Community Spaces & Real-time Messages
        await communitySpaceModel.deleteMany({});
        await communityMessageModel.deleteMany({});

        const space1 = await communitySpaceModel.create({
            name: "Google Cloud Student Developer Forum",
            description: "High-throughput cloud architecture, Kubernetes clusters, and Go microservices discussions.",
            industry: "Cloud Computing",
            focus: "Distributed Cloud Architecture, K8s, Golang",
            creatorId: industryUser._id,
            members: [studentUser._id, facultyUser._id, industryUser._id],
            memberCount: 412,
        });

        const space2 = await communitySpaceModel.create({
            name: "Microsoft Open Source Ecosystem",
            description: "Collaborative repository discussions, TypeScript tooling, and Azure SDK contributions.",
            industry: "Software Engineering",
            focus: "TypeScript, Azure Functions, Semantic Kernel",
            creatorId: industryUser._id,
            members: [studentUser._id, mentor2._id],
            memberCount: 389,
        });

        const space3 = await communitySpaceModel.create({
            name: "Razorpay Financial Engineering Hub",
            description: "Payment infrastructure, low-latency transaction processing, and circuit-breaker patterns.",
            industry: "FinTech",
            focus: "Payment Rails, High-Throughput Microservices",
            creatorId: industryUser._id,
            members: [studentUser._id, facultyUser._id, industryUser._id],
            memberCount: 275,
        });

        const space4 = await communitySpaceModel.create({
            name: "AI & Neural Modeling Consortium",
            description: "Research community focusing on large language models, model compression, and inference pipelines.",
            industry: "Artificial Intelligence",
            focus: "Transformers, Model Optimization, LLM Tooling",
            creatorId: facultyUser._id,
            members: [studentUser._id, mentor3._id, facultyUser._id],
            memberCount: 512,
        });

        // Initial discussion entries
        await communityMessageModel.create([
            {
                spaceId: space1._id,
                senderId: industryUser._id,
                senderName: "Razorpay Engineering",
                senderRole: "industry",
                content: "Welcome scholars! We're discussing distributed consensus edge cases this week. Check out the Raft consensus benchmarks in the repo.",
            },
            {
                spaceId: space1._id,
                senderId: facultyUser._id,
                senderName: "Dr. A. K. Sundaram",
                senderRole: "faculty",
                content: "IIT Bombay research scholars are actively benchmarking leader-election latency on heterogenous networks. Happy to collaborate.",
            },
            {
                spaceId: space3._id,
                senderId: industryUser._id,
                senderName: "Razorpay Engineering",
                senderRole: "industry",
                content: "New circuit breaker patterns for IndiaStack UPI payment callbacks just published. Open-source PRs welcome!",
            },
        ]);

        // 7. Seed Open Source Repositories & Verified Contribution
        await openSourceProjectModel.deleteMany({});
        await contributionModel.deleteMany({});

        const ossProject1 = await openSourceProjectModel.create({
            postedBy: industryUser._id,
            companyName: "Razorpay Engineering",
            title: "Razorpay High-Performance Circuit Breaker",
            description: "Ultra-low-latency resilience and failover library built in Go for distributed transaction rails. Handles millions of concurrent payment invocations.",
            repoUrl: "https://github.com/razorpay/circuit-breaker-core",
            repoFullName: "razorpay/circuit-breaker-core",
            techStack: ["Go", "Distributed Systems", "gRPC", "Docker"],
            difficulty: "intermediate",
            openIssuesCount: 14,
            webhookSecret: "portalacademia_wh_secret_razorpay_2026",
            isActive: true,
        });

        const ossProject2 = await openSourceProjectModel.create({
            postedBy: industryUser._id,
            companyName: "Google Open Source",
            title: "TensorFlow Rust Bindings & WASM Inference",
            description: "High-performance WebAssembly runtime bindings for executing optimized neural graph inferences directly in browser sandboxes.",
            repoUrl: "https://github.com/tensorflow/tf-rust-wasm",
            repoFullName: "tensorflow/tf-rust-wasm",
            techStack: ["Rust", "WASM", "WebAssembly", "AI/ML"],
            difficulty: "advanced",
            openIssuesCount: 8,
            webhookSecret: "portalacademia_wh_secret_google_2026",
            isActive: true,
        });

        // Verified contribution for Priya Sharma
        await contributionModel.create({
            projectId: ossProject1._id,
            companyId: industryUser._id,
            studentId: studentUser._id,
            studentName: "Priya Sharma",
            githubUsername: "priyasharma-dev",
            prUrl: "https://github.com/razorpay/circuit-breaker-core/pull/42",
            prTitle: "fix(telemetry): eliminate memory allocation leak during exponential backoff state transitions",
            prNumber: 42,
            mergedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            certificateIssued: true,
            certificateIssuedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        });

        // 8. Standardized Assessments
        await assessmentModel.deleteMany({});
        await assessmentModel.create([
            {
                title: "Standardized Python & Distributed Systems Diagnostic",
                category: "Technical",
                assessmentType: "technical",
                skillVectors: ["Python", "Distributed Systems"],
                description: "National benchmark assessment evaluating mastery of Python memory model, concurrent processing, and distributed network RPCs.",
                durationMinutes: 45,
                passPercentage: 70,
                difficulty: "Intermediate",
                badgeAwarded: "Certified Python Practitioner",
                questions: [
                    {
                        questionId: "q1",
                        questionText: "What is the primary operational distinction between threading and multiprocessing in standard CPython?",
                        options: [
                            "Threading is CPU-bound while multiprocessing is strictly for I/O operations.",
                            "Threading is subject to the Global Interpreter Lock (GIL) in CPython, while multiprocessing spawns distinct OS processes with dedicated memory spaces.",
                            "Multiprocessing cannot execute in parallel across multiple physical cores.",
                            "CPython automatically compiles multithreaded scripts to WebAssembly.",
                        ],
                        correctOptionIndex: 1,
                        weight: 1,
                        explanation: "Due to the GIL, only one thread executes Python bytecode at a time in CPython. Multiprocessing bypasses this by spawning separate OS processes.",
                    },
                    {
                        questionId: "q2",
                        questionText: "Which HTTP status code is most appropriate when a client request violates an active rate-limiting policy?",
                        options: ["401 Unauthorized", "403 Forbidden", "429 Too Many Requests", "503 Service Unavailable"],
                        correctOptionIndex: 2,
                        weight: 1,
                        explanation: "RFC 6585 specifies HTTP 429 Too Many Requests when a client sends excessive requests in a given amount of time.",
                    },
                    {
                        questionId: "q3",
                        questionText: "In distributed systems, which property does the Raft consensus protocol guarantee during network partitions?",
                        options: [
                            "Zero latency on all writes",
                            "Strict consistency with safety guarantees preventing split-brain states",
                            "Infinite scalability without heartbeat exchanges",
                            "Automatic master-master asynchronous replication",
                        ],
                        correctOptionIndex: 1,
                        weight: 1,
                        explanation: "Raft guarantees safety (consistency) by requiring a majority quorum for leader election and log entry commits, preventing split-brain.",
                    },
                ],
                createdBy: institutionUser._id,
            },
        ]);

        // 9. Seed Core Opportunities
        await opportunityModel.deleteMany({});
        const opp1 = await opportunityModel.create({
            title: "Distributed Systems Engineering Internship (Summer 2026)",
            description: "Join Razorpay's Core Reliability Engineering team to build next-generation event-streaming infrastructure and payment retry engines.",
            organization: "Razorpay Software Pvt. Ltd.",
            createdBy: industryUser._id,
            category: "internship",
            domain: "Backend Infrastructure",
            location: "Bengaluru, Karnataka / Hybrid",
            mode: "Hybrid",
            duration: "6 Months",
            stipendOrPrize: "₹85,000 / month",
            requiredSkills: ["React", "TypeScript", "Node.js", "Python", "Docker"],
            eligibility: "B.Tech/M.Tech Computer Science students graduating in 2026 or 2027.",
            deadline: "2026-10-30",
            status: "active",
            targetAudience: "student",
            recommendedToStudentsBy: [institutionUser._id],
            applicantCount: 1,
        });

        // 10. Sample Application
        await applicationModel.deleteMany({});
        await applicationModel.create({
            opportunityId: opp1._id,
            applicantId: studentUser._id,
            applicantName: "Priya Sharma",
            applicantEmail: "priya.sharma@iitb.ac.in",
            applicantInstitution: "Indian Institute of Technology Bombay",
            applicantSkills: ["React", "TypeScript", "Node.js", "Python", "Docker"],
            matchScore: 94,
            status: "Shortlisted",
            appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            notes: "Hands-on experience building distributed systems, WebRTC video calling, and React dashboards.",
            reviewerNotes: "Top tier profile. Passed standardized diagnostic with 94%. Advancing to final round.",
        });

        console.log("Database seeded successfully to MongoDB Atlas!");
        console.log(`- Seeded 7 Users: Student, Industry, Institution, Faculty, 3 Senior Mentors`);
        console.log(`- Seeded Active Premium Membership for Priya Sharma`);
        console.log(`- Seeded 3 Senior Mentors with Free Registration & Accepted Terms`);
        console.log(`- Seeded 2 Mentorship Pairings: 1 Active (WebRTC ready) & 1 Completed (5.0★ + Certificate)`);
        console.log(`- Seeded 4 Enterprise Community Spaces with Live Messages`);
        console.log(`- Seeded 2 Open Source Projects & 1 Verified GitHub PR Credential`);
        console.log(`- Seeded Standardized Assessments & Core Opportunities`);

        process.exit(0);
    } catch (err) {
        console.error("Database seed error:", err);
        process.exit(1);
    }
}

seed();
