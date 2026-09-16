import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import profileModel from "../models/profileModel.js";
import opportunityModel from "../models/opportunityModel.js";
import applicationModel from "../models/applicationModel.js";


dotenv.config();

const MONGO_URI =
    process.env.MONGO_URL
        ? `${process.env.MONGO_URL}/PortalAcademia`
        : process.env.MONGODB_URI || "mongodb://root:rootpassword@localhost:27017/PortalAcademia";

interface TopCandidateSeed {
    name: string;
    email: string;
    phone: string;
    institution: string;
    location: string;
    headline: string;
    bio: string;
    skills: string[];
    education: {
        education: string;
        course: string;
        institution: string;
        timeline: string;
        grade: string;
        description: string;
    }[];
    experience: {
        title: string;
        organization: string;
        timeline: string;
        description: string;
    }[];
    certifications: {
        title: string;
        issuer: string;
        timeline: string;
        credentialUrl: string;
        summary?: string;
    }[];
    projects: {
        title: string;
        technologies: string[];
        link: string;
        description: string;
    }[];
    website: string;
    atsScore: number;
    status: "Applied" | "Under Review" | "Shortlisted" | "Technical Interview" | "Offered";
    notes: string;
    daysAgo: number;
}

const TOP_10_CANDIDATES: TopCandidateSeed[] = [
    {
        name: "Aarohi Deshpande",
        email: "aarohi.deshpande.cse@iitd.ac.in",
        phone: "+91 98112 55401",
        institution: "Indian Institute of Technology Delhi",
        location: "New Delhi, Delhi",
        headline: "B.Tech Computer Science | Distributed Consensus & High-Throughput Storage Engines",
        bio: "Undergraduate researcher at IIT Delhi focusing on Raft consensus protocols, LSM-tree storage engines, and zero-copy networking. Author of an open-source Rust key-value store with 1.4k GitHub stars. Incoming Systems Intern at Microsoft Azure Core.",
        skills: ["Python", "Go", "Rust", "PostgreSQL", "Git", "Docker", "Kubernetes", "Linux", "Distributed Systems", "Claude Code"],
        education: [
            {
                education: "Bachelor of Technology (B.Tech)",
                course: "Computer Science & Engineering",
                institution: "Indian Institute of Technology Delhi",
                timeline: "2022 - 2026",
                grade: "9.74 CGPA",
                description: "Department Rank 1. Institute Merit Scholar. Coursework: Advanced Distributed Systems, Operating System Internals, Database Engine Implementation."
            }
        ],
        experience: [
            {
                title: "Software Engineering Intern (Systems Core)",
                organization: "Microsoft",
                timeline: "May 2025 - Jul 2025",
                description: "Engineered zero-copy memory serialization pipeline for Azure Blob Storage microservices using Rust and io_uring, slashing P99 tail latency by 34% on 100GbE fabric."
            },
            {
                title: "Quantitative Technology Intern",
                organization: "D. E. Shaw India",
                timeline: "Dec 2024 - Jan 2025",
                description: "Developed lock-free concurrent order book matching engine simulator processing 850k orders/sec with deterministic microsecond replay."
            }
        ],
        certifications: [
            {
                title: "AWS Certified Solutions Architect – Professional",
                issuer: "Amazon Web Services",
                timeline: "2025",
                credentialUrl: "https://aws.amazon.com/verification/SAP-882194",
                summary: "Advanced architectural validation of multi-region fault tolerance and cost-optimized distributed systems."
            },
            {
                title: "Linux Foundation Certified System Administrator (LFCS)",
                issuer: "The Linux Foundation",
                timeline: "2024",
                credentialUrl: "https://www.credly.com/org/the-linux-foundation/lfcs-7718"
            }
        ],
        projects: [
            {
                title: "AetherDB — Distributed Multi-Raft Key-Value Engine",
                technologies: ["Rust", "Raft", "RocksDB", "gRPC", "Docker"],
                link: "https://github.com/aarohidesh/aether-db",
                description: "High-performance distributed transactional store with multi-raft sharding, snapshot compaction, and pluggable storage backends."
            },
            {
                title: "AsyncRing — Zero-Copy Linux io_uring Wrapper",
                technologies: ["Rust", "Linux", "C", "Networking"],
                link: "https://github.com/aarohidesh/async-ring",
                description: "Asynchronous network I/O crate for high-throughput HTTP/gRPC multiplexers bypassing Linux kernel syscall overhead."
            }
        ],
        website: "https://aarohi.dev",
        atsScore: 98,
        status: "Shortlisted",
        notes: "My research in distributed storage engines and hands-on experience with high-throughput cloud services directly aligns with TCS enterprise requirements.",
        daysAgo: 2
    },
    {
        name: "Tanishq Singhania",
        email: "tanishq.singhania@smail.iitm.ac.in",
        phone: "+91 94441 89201",
        institution: "Indian Institute of Technology Madras",
        location: "Chennai, Tamil Nadu",
        headline: "Dual Degree (B.Tech + M.Tech) CSE | LLM Agentic Workflows, Claude Code & Neural Retrieval",
        bio: "AI researcher at Robert Bosch Centre for Data Science and AI (RBCDSAI). Co-authored ACL 2025 paper on context compression for retrieval-augmented generation. Built enterprise Claude Code automation pipelines and resilient hybrid vector search infrastructure.",
        skills: ["Python", "JavaScript", "Claude Code", "PyTorch", "LangChain", "MongoDB", "PostgreSQL", "FastAPI", "Docker", "Git"],
        education: [
            {
                education: "Dual Degree (B.Tech + M.Tech)",
                course: "Computer Science & Engineering",
                institution: "Indian Institute of Technology Madras",
                timeline: "2021 - 2026",
                grade: "9.61 CGPA",
                description: "Specializing in Large Language Model Architectures and Semantic Search. Recipient of the Academic Excellence Award."
            }
        ],
        experience: [
            {
                title: "Research Engineering Intern",
                organization: "Google DeepMind",
                timeline: "May 2025 - Aug 2025",
                description: "Optimized multi-hop reasoning over hybrid dense-sparse vector databases; achieved 22% better groundedness on complex enterprise Q&A benchmarks."
            },
            {
                title: "AI Platform Intern",
                organization: "Postman",
                timeline: "May 2024 - Jul 2024",
                description: "Designed semantic prompt-caching proxy for enterprise LLM integrations with Claude and OpenAI, reducing token API spend by 48% across 100k daily developer requests."
            }
        ],
        certifications: [
            {
                title: "DeepLearning.AI Generative AI with Large Language Models",
                issuer: "DeepLearning.AI & AWS",
                timeline: "2025",
                credentialUrl: "https://coursera.org/verify/GENAI-IITM-902",
                summary: "Mastery in instruction fine-tuning, RLHF, PEFT/LoRA, and agentic orchestration."
            },
            {
                title: "Anthropic Claude Developer Certified Specialist",
                issuer: "Anthropic Partner Network",
                timeline: "2025",
                credentialUrl: "https://anthropic.com/verify/CLAUDE-981"
            }
        ],
        projects: [
            {
                title: "CognitiveMesh — Autonomous Multi-Agent Workflows",
                technologies: ["Python", "Claude Code", "LangChain", "FastAPI", "PostgreSQL"],
                link: "https://github.com/tanishq-singh/cognitive-mesh",
                description: "Open-source multi-agent LLM orchestrator leveraging Claude Code tools, deterministic fallback execution graphs, and automated code review."
            },
            {
                title: "SparseVectorX — SIMD-Accelerated BM25 + Embeddings Fusion",
                technologies: ["Python", "C++", "PyTorch", "NumPy"],
                link: "https://github.com/tanishq-singh/sparse-vector-x",
                description: "Hybrid vector search engine fusing inverted index BM25 scores with dense embeddings in sub-10ms latency."
            }
        ],
        website: "https://tanishqai.io",
        atsScore: 97,
        status: "Technical Interview",
        notes: "I bring production expertise in Claude Code integration, LLM agent development, and enterprise semantic retrieval architectures.",
        daysAgo: 4
    },
    {
        name: "Devansh Mathur",
        email: "f20220194@pilani.bits-pilani.ac.in",
        phone: "+91 99280 77123",
        institution: "Birla Institute of Technology and Science, Pilani",
        location: "Pilani, Rajasthan",
        headline: "B.E. Computer Science | Distributed Event-Driven Systems & Full-Stack Platform Engineering",
        bio: "Passionate product engineer with deep experience in event-driven backend microservices, PostgreSQL performance tuning, and React/Next.js architectures. Led technical engineering for BITS Pilani ACM Student Chapter.",
        skills: ["Python", "JavaScript", "PostgreSQL", "MongoDB", "Git", "React", "Node.js", "Express", "Docker", "Redis", "Claude Code"],
        education: [
            {
                education: "Bachelor of Engineering (B.E. Hons.)",
                course: "Computer Science",
                institution: "BITS Pilani, Pilani Campus",
                timeline: "2022 - 2026",
                grade: "9.38 CGPA",
                description: "Teaching Assistant for Data Structures & Algorithms. Led team of 14 engineers in university ERP modernization."
            }
        ],
        experience: [
            {
                title: "Backend Engineering Intern",
                organization: "CRED",
                timeline: "Jan 2025 - Jun 2025",
                description: "Architected automated credit card bill payment reconciliation pipeline in Node.js and PostgreSQL, reducing dispute settlement latency from 48 hours to under 4 minutes."
            },
            {
                title: "Platform Engineering Intern",
                organization: "Zepto",
                timeline: "May 2024 - Jul 2024",
                description: "Built real-time delivery rider dispatching geohash index using Redis geospatial primitives, supporting 90k peak deliveries/hour with sub-20ms response time."
            }
        ],
        certifications: [
            {
                title: "MongoDB Certified Developer Associate",
                issuer: "MongoDB, Inc.",
                timeline: "2025",
                credentialUrl: "https://mongodb.com/credentials/DEV-99120"
            },
            {
                title: "Meta Certified Full-Stack Developer",
                issuer: "Meta & Coursera",
                timeline: "2024",
                credentialUrl: "https://coursera.org/verify/META-FULLSTACK-441"
            }
        ],
        projects: [
            {
                title: "PulsePay — Double-Entry Idempotent Banking Ledger",
                technologies: ["Node.js", "PostgreSQL", "Redis", "Docker", "Jest"],
                link: "https://github.com/devansh-mathur/pulse-pay",
                description: "FinTech ledger with strict ACID compliance, PostgreSQL advisory locks, and zero-loss automated reconciliation."
            },
            {
                title: "LiveCollab — CRDT-Powered Collaborative Editor",
                technologies: ["React", "TypeScript", "WebSockets", "Redis PubSub"],
                link: "https://github.com/devansh-mathur/live-collab",
                description: "Real-time collaborative document workspace with conflict-free replicated data types (Yjs) and presence tracking."
            }
        ],
        website: "https://devanshmathur.com",
        atsScore: 95,
        status: "Shortlisted",
        notes: "Experienced across the full MERN + PostgreSQL stack with high-traffic production internships at CRED and Zepto.",
        daysAgo: 5
    },
    {
        name: "Niharika Reddy",
        email: "niharika.reddy@research.iiit.ac.in",
        phone: "+91 90002 33418",
        institution: "International Institute of Information Technology Hyderabad",
        location: "Hyderabad, Telangana",
        headline: "Dual Degree CSE | Cloud Platforms, Kubernetes Orchestration & SRE Observability",
        bio: "Kubernetes upstream contributor and open-source infrastructure engineer. Researches container scheduling heuristics and eBPF network telemetry at IIIT Hyderabad's Center for Security, Theory and Algorithmic Research (CSTAR).",
        skills: ["Python", "Docker", "Kubernetes", "Terraform", "Linux", "AWS", "CI/CD", "Git", "PostgreSQL", "Go", "Bash"],
        education: [
            {
                education: "Dual Degree (B.Tech + MS by Research)",
                course: "Computer Science & Engineering",
                institution: "IIIT Hyderabad",
                timeline: "2021 - 2026",
                grade: "9.42 CGPA",
                description: "Published research on container runtime security and eBPF network observability in IEEE Cloud 2025."
            }
        ],
        experience: [
            {
                title: "Site Reliability & Platform Intern",
                organization: "Uber",
                timeline: "May 2025 - Aug 2025",
                description: "Maintained multi-region Kubernetes clusters running 4,500+ microservices; automated canary release validation using Argo Rollouts and Prometheus metric anomaly checks."
            },
            {
                title: "Cloud Infrastructure Intern",
                organization: "HackerRank",
                timeline: "May 2024 - Jul 2024",
                description: "Optimized Terraform infrastructure provisioning time by 60% with parallel state locking and automated AWS EC2 spot fleet bidding."
            }
        ],
        certifications: [
            {
                title: "Certified Kubernetes Administrator (CKA)",
                issuer: "Cloud Native Computing Foundation (CNCF)",
                timeline: "2025",
                credentialUrl: "https://www.credly.com/org/cncf/cka-982184"
            },
            {
                title: "HashiCorp Certified: Terraform Associate (003)",
                issuer: "HashiCorp",
                timeline: "2024",
                credentialUrl: "https://www.credly.com/org/hashicorp/terraform-5512"
            }
        ],
        projects: [
            {
                title: "KubeGuard — eBPF-Powered Kubernetes Admission Controller",
                technologies: ["Go", "Kubernetes", "eBPF", "Docker", "Linux"],
                link: "https://github.com/niharika-r/kube-guard",
                description: "Real-time security admission controller enforcing pod resource limits and blocking unsigned container image launches."
            },
            {
                title: "InfraPulse — Multi-Cloud Cost Anomaly Watcher",
                technologies: ["Python", "Terraform", "AWS SDK", "Slack API"],
                link: "https://github.com/niharika-r/infra-pulse",
                description: "Automated daemon analyzing CloudWatch and GCP billing metrics to alert engineering squads on unbudgeted spikes."
            }
        ],
        website: "https://niharikareddy.cloud",
        atsScore: 96,
        status: "Under Review",
        notes: "Certified Kubernetes Administrator with hands-on experience scaling enterprise container platforms and multi-region AWS environments.",
        daysAgo: 6
    },
    {
        name: "Siddharth S. Sundaram",
        email: "siddharth.sundaram@iitkgp.ac.in",
        phone: "+91 97488 66205",
        institution: "Indian Institute of Technology Kharagpur",
        location: "Kharagpur, West Bengal",
        headline: "Integrated M.Tech Data Science & AI | Real-Time Kafka Pipelines & Lakehouse Architecture",
        bio: "Specializes in distributed stream processing, Lakehouse architectures, and petabyte-scale data transformation pipelines with Apache Spark, Kafka, Airflow, and PostgreSQL.",
        skills: ["Python", "Spark", "Kafka", "PostgreSQL", "Airflow", "Docker", "Git", "SQL", "MongoDB", "Linux", "AWS"],
        education: [
            {
                education: "Integrated Master of Technology (M.Tech)",
                course: "Data Science & Engineering",
                institution: "Indian Institute of Technology Kharagpur",
                timeline: "2021 - 2026",
                grade: "9.29 CGPA",
                description: "Core focus on Distributed Systems, High-Performance Database Systems, and Large-Scale Stream Computing."
            }
        ],
        experience: [
            {
                title: "Data Platform Engineering Intern",
                organization: "Flipkart",
                timeline: "May 2025 - Jul 2025",
                description: "Scaled Big Billion Days clickstream ingestion pipeline to 1.8M events/second using Apache Kafka and Spark Streaming on AWS EMR with zero consumer lag."
            },
            {
                title: "Analytics Engineering Intern",
                organization: "Swiggy",
                timeline: "May 2024 - Jul 2024",
                description: "Constructed automated dbt and Apache Airflow DAGs for delivery partner incentive modeling, auditing 12M historical daily orders."
            }
        ],
        certifications: [
            {
                title: "Databricks Certified Data Engineer Associate",
                issuer: "Databricks",
                timeline: "2025",
                credentialUrl: "https://credentials.databricks.com/verify/DB-DE-881"
            },
            {
                title: "Snowflake SnowPro Core Certification",
                issuer: "Snowflake",
                timeline: "2024",
                credentialUrl: "https://snowflake.com/credentials/CO-90218"
            }
        ],
        projects: [
            {
                title: "StreamLake — Real-Time CDC to Apache Iceberg",
                technologies: ["Python", "Kafka", "Debezium", "Apache Iceberg", "PostgreSQL"],
                link: "https://github.com/siddharth-s/stream-lake",
                description: "Zero-data-loss change data capture pipeline streaming PostgreSQL WAL logs directly into Iceberg lakehouse tables."
            },
            {
                title: "FlowCheck — Automated Kafka Schema Drift Guardian",
                technologies: ["Python", "Apache Kafka", "Docker", "FastAPI"],
                link: "https://github.com/siddharth-s/flow-check",
                description: "Schema registry validator preventing breaking schema modifications across distributed microservices."
            }
        ],
        website: "https://siddharthsundaram.dev",
        atsScore: 94,
        status: "Shortlisted",
        notes: "Proven experience engineering high-throughput Kafka and Spark pipelines processing millions of events per second.",
        daysAgo: 8
    },
    {
        name: "Meghna Sengupta",
        email: "meghna.sengupta@ug.jadavpuruniversity.in",
        phone: "+91 98305 11984",
        institution: "Jadavpur University",
        location: "Kolkata, West Bengal",
        headline: "B.E. Information Technology | Next.js, React 19, Accessible UI & Core Web Vitals",
        bio: "Frontend engineering specialist focused on sub-50ms Time-to-Interactive, accessibility standards (WCAG 2.1 AAA), and headless design systems with React, TypeScript, and Tailwind CSS. Google Summer of Code 2024 contributor.",
        skills: ["JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "HTML", "CSS", "Git", "Redux", "Figma", "Web Development"],
        education: [
            {
                education: "Bachelor of Engineering (B.E.)",
                course: "Information Technology",
                institution: "Jadavpur University",
                timeline: "2022 - 2026",
                grade: "9.55 CGPA",
                description: "Department Rank 2. Lead Frontend Organizer for Srijan Tech Festival. Specialization in Web Accessibility."
            }
        ],
        experience: [
            {
                title: "Frontend Engineering Intern",
                organization: "Atlassian",
                timeline: "May 2025 - Jul 2025",
                description: "Refactored Jira issue preview modal into a virtualized list architecture, slashing DOM node count by 78% and boosting Interaction to Next Paint (INP) to 12ms."
            },
            {
                title: "UI/UX Engineering Intern",
                organization: "Razorpay",
                timeline: "May 2024 - Jul 2024",
                description: "Built unified multi-brand design token system for Razorpay Checkout SDK across React, Vue, and Web Components."
            }
        ],
        certifications: [
            {
                title: "Google UX Design Professional Certificate",
                issuer: "Google",
                timeline: "2025",
                credentialUrl: "https://coursera.org/verify/GOOGLE-UX-7712"
            },
            {
                title: "W3Cx Accessible Web Design Specialist",
                issuer: "World Wide Web Consortium (W3C)",
                timeline: "2024",
                credentialUrl: "https://edx.org/credentials/W3C-ACC-881"
            }
        ],
        projects: [
            {
                title: "PrismUI — Zero-Runtime Headless Design Tokens",
                technologies: ["TypeScript", "React", "Tailwind CSS", "Radix UI"],
                link: "https://github.com/meghna-s/prism-ui",
                description: "Production design system component kit with strict WCAG 2.1 AAA compliance and keyboard navigation ergonomics."
            },
            {
                title: "VitalsLab — Headless Chrome Core Web Vitals CI Tool",
                technologies: ["Node.js", "Puppeteer", "Lighthouse API"],
                link: "https://github.com/meghna-s/vitals-lab",
                description: "CLI and GitHub Action auditing FCP, LCP, and CLS performance budgets on every pull request."
            }
        ],
        website: "https://meghnasengupta.design",
        atsScore: 93,
        status: "Applied",
        notes: "Frontend architect with production internships at Atlassian and Razorpay delivering ultra-fast web experiences.",
        daysAgo: 1
    },
    {
        name: "Ritwik Chhabra",
        email: "ritwik.chhabra@dtu.ac.in",
        phone: "+91 98710 44820",
        institution: "Delhi Technological University",
        location: "Delhi, Delhi",
        headline: "B.Tech Software Engineering | Cloud Security, Zero-Trust Architecture & DevSecOps",
        bio: "Security researcher and bug bounty contributor (acknowledged in Apple, GitHub, and Shopify halls of fame). Specializes in zero-trust workload identity, SPIFFE/SPIRE, and automated SAST/DAST pipelines for cloud microservices.",
        skills: ["Python", "Git", "Docker", "Kubernetes", "Linux", "PostgreSQL", "Go", "CI/CD", "AWS", "Claude Code"],
        education: [
            {
                education: "Bachelor of Technology (B.Tech)",
                course: "Software Engineering",
                institution: "Delhi Technological University (formerly DCE)",
                timeline: "2022 - 2026",
                grade: "9.15 CGPA",
                description: "President of DTU Cyber Security Research Club. Winner of Smart India Hackathon 2024 (Cyber Security Track)."
            }
        ],
        experience: [
            {
                title: "Cloud Security Engineering Intern",
                organization: "Palo Alto Networks",
                timeline: "May 2025 - Jul 2025",
                description: "Developed automated container vulnerability triage scanner cross-referencing SBOMs against national CVE databases with Claude Code AI categorization."
            },
            {
                title: "Information Security Intern",
                organization: "Zomato",
                timeline: "Dec 2024 - Jan 2025",
                description: "Implemented automated mutual TLS (mTLS) certificate rotation for 600 internal microservices using HashiCorp Vault."
            }
        ],
        certifications: [
            {
                title: "CISSP-Associate (ISC2 Candidate)",
                issuer: "International Information System Security Certification Consortium (ISC2)",
                timeline: "2025",
                credentialUrl: "https://www.isc2.org/verification/ISC2-88129"
            },
            {
                title: "AWS Certified Security – Specialty",
                issuer: "Amazon Web Services",
                timeline: "2024",
                credentialUrl: "https://aws.amazon.com/verification/SCS-9901"
            }
        ],
        projects: [
            {
                title: "VaultGuard — Cloud IAM Privilege Creep Analyzer",
                technologies: ["Python", "AWS CloudTrail", "Graph Analytics", "Docker"],
                link: "https://github.com/ritwik-chhabra/vault-guard",
                description: "Automated scanner analyzing AWS IAM roles and session histories to revoke unused permissive privileges."
            },
            {
                title: "CertPatrol — Automated mTLS Certificate Lifecycle Daemon",
                technologies: ["Go", "Vault API", "Kubernetes", "Docker"],
                link: "https://github.com/ritwik-chhabra/cert-patrol",
                description: "Zero-downtime certificate renewal engine integrated into Kubernetes pod lifecycle hooks."
            }
        ],
        website: "https://ritwikchhabra.sec",
        atsScore: 94,
        status: "Under Review",
        notes: "Experienced security practitioner with deep knowledge of container runtime security, IAM governance, and automated CI/CD gating.",
        daysAgo: 7
    },
    {
        name: "Aniruddh Venkatesh",
        email: "aniruddh.v@nitt.edu",
        phone: "+91 94883 22719",
        institution: "National Institute of Technology Tiruchirappalli",
        location: "Tiruchirappalli, Tamil Nadu",
        headline: "B.Tech Computer Science | Database Internals, PostgreSQL Query Planner & Redis Caching",
        bio: "Relational database enthusiast who studies PostgreSQL kernel source code and profiles B-tree index page splits. Designed distributed cache invalidation protocol supporting 200k queries/sec with zero stale reads.",
        skills: ["PostgreSQL", "Python", "JavaScript", "MongoDB", "SQL", "Redis", "Node.js", "Express", "Git", "Docker", "Backend"],
        education: [
            {
                education: "Bachelor of Technology (B.Tech)",
                course: "Computer Science & Engineering",
                institution: "National Institute of Technology, Tiruchirappalli",
                timeline: "2022 - 2026",
                grade: "9.48 CGPA",
                description: "Rank 3 in Department. Lead author on ACM SIGMOD student paper analyzing B-Tree concurrency algorithms."
            }
        ],
        experience: [
            {
                title: "Database Platform Intern",
                organization: "PhonePe",
                timeline: "May 2025 - Jul 2025",
                description: "Tuned PostgreSQL connection pooling (PgBouncer) and EXPLAIN ANALYZE query plans for UPI transaction settlement tables handling 14k peak TPS."
            },
            {
                title: "Backend Engineering Intern",
                organization: "Dunzo",
                timeline: "May 2024 - Jul 2024",
                description: "Engineered dual-write cache consistency engine between PostgreSQL and Redis with automated self-healing reconciliation."
            }
        ],
        certifications: [
            {
                title: "EnterpriseDB Certified PostgreSQL 16 Associate",
                issuer: "EnterpriseDB",
                timeline: "2025",
                credentialUrl: "https://enterprisedb.com/verify/EDB-PG-990"
            },
            {
                title: "Oracle Certified Professional: MySQL 8.0 Database Developer",
                issuer: "Oracle",
                timeline: "2024",
                credentialUrl: "https://oracle.com/cert/MYSQL-7718"
            }
        ],
        projects: [
            {
                title: "PgPlannerLab — Interactive PostgreSQL Cost Breakdown",
                technologies: ["JavaScript", "React", "PostgreSQL", "Tailwind CSS"],
                link: "https://github.com/aniruddh-v/pg-planner-lab",
                description: "Web tool visualising nested loops, merge joins, and index scans from raw EXPLAIN (ANALYZE, BUFFERS) JSON."
            },
            {
                title: "RedisRing — Sharded Redis Consistent Hashing Proxy",
                technologies: ["Node.js", "Redis", "Docker", "TypeScript"],
                link: "https://github.com/aniruddh-v/redis-ring",
                description: "Zero-downtime key-space rebalancing proxy implementing MurmurHash3 consistent hash rings."
            }
        ],
        website: "https://aniruddh.db",
        atsScore: 96,
        status: "Shortlisted",
        notes: "Deep specialization in PostgreSQL query optimization, connection pooling, and low-latency database backends.",
        daysAgo: 3
    },
    {
        name: "Kavya M. Bhatt",
        email: "kavya.bhatt@cs.iitr.ac.in",
        phone: "+91 98971 33490",
        institution: "Indian Institute of Technology Roorkee",
        location: "Roorkee, Uttarakhand",
        headline: "B.Tech CSE | MLOps Pipelines, TensorRT Model Quantization & PyTorch Systems",
        bio: "Bridging the gap between machine learning models and high-throughput production deployment. Experienced in INT8 post-training quantization, ONNX Runtime inference servers, and distributed ML pipelines on AWS and Linux.",
        skills: ["Python", "PyTorch", "Docker", "Git", "FastAPI", "Linux", "C++", "AWS", "AI", "Machine Learning", "Claude Code"],
        education: [
            {
                education: "Bachelor of Technology (B.Tech)",
                course: "Computer Science & Engineering",
                institution: "Indian Institute of Technology Roorkee",
                timeline: "2022 - 2026",
                grade: "9.32 CGPA",
                description: "Head of Artificial Intelligence Section at IIT Roorkee ShARE. Won 1st Prize at Inter-IIT Tech Meet ML Challenge."
            }
        ],
        experience: [
            {
                title: "Deep Learning System Software Intern",
                organization: "NVIDIA",
                timeline: "May 2025 - Jul 2025",
                description: "Quantized transformer models using TensorRT-LLM and FP8 calibration, achieving 3.8x throughput speedup on NVIDIA Jetson Orin compute modules."
            },
            {
                title: "Autonomous Driving Software Intern",
                organization: "Ola Electric",
                timeline: "Dec 2024 - Jan 2025",
                description: "Deployed real-time lane detection PyTorch model to scooter embedded compute units with sub-18ms inference latency."
            }
        ],
        certifications: [
            {
                title: "NVIDIA Certified Associate – Generative AI & LLMs",
                issuer: "NVIDIA",
                timeline: "2025",
                credentialUrl: "https://nvidia.com/certification/NCA-GENAI-19"
            },
            {
                title: "AWS Certified Machine Learning – Specialty",
                issuer: "Amazon Web Services",
                timeline: "2024",
                credentialUrl: "https://aws.amazon.com/verification/MLS-8812"
            }
        ],
        projects: [
            {
                title: "EdgeInference — High-Throughput TensorRT Model Runner",
                technologies: ["C++", "Python", "TensorRT", "Docker", "CUDA"],
                link: "https://github.com/kavya-bhatt/edge-inference",
                description: "Asynchronous batched inference engine supporting dynamic input shapes and zero-copy GPU memory transfers."
            },
            {
                title: "TorchBench — Regression Profiler for PyTorch Weights",
                technologies: ["Python", "PyTorch", "FastAPI", "Docker"],
                link: "https://github.com/kavya-bhatt/torch-bench",
                description: "Automated regression testing harness tracking GPU memory allocations across model checkpoint revisions."
            }
        ],
        website: "https://kavyabhatt.ai",
        atsScore: 95,
        status: "Technical Interview",
        notes: "NVIDIA and Ola Electric intern with production experience deploying optimized PyTorch and TensorRT models to cloud and edge.",
        daysAgo: 4
    },
    {
        name: "Sameer Farooqui",
        email: "sameer.farooqui@cse.iitk.ac.in",
        phone: "+91 94501 88231",
        institution: "Indian Institute of Technology Kanpur",
        location: "Kanpur, Uttar Pradesh",
        headline: "B.Tech CSE | Multi-Lingual NLP, Cross-Encoder Re-Ranking & Vector Embeddings",
        bio: "NLP researcher specializing in multilingual text representations, cross-lingual sentence embeddings, and fine-tuning transformer models. Published at EMNLP 2024 Student Research Workshop. Passionate about neural search systems.",
        skills: ["Python", "Claude Code", "PyTorch", "Transformers", "NLP", "PostgreSQL", "MongoDB", "Git", "Docker", "FastAPI"],
        education: [
            {
                education: "Bachelor of Technology (B.Tech)",
                course: "Computer Science & Engineering",
                institution: "Indian Institute of Technology Kanpur",
                timeline: "2022 - 2026",
                grade: "9.68 CGPA",
                description: "Institute Silver Medal for Academic Excellence. Specializing in Natural Language Processing and Information Retrieval."
            }
        ],
        experience: [
            {
                title: "Research Fellow Intern",
                organization: "Microsoft Research India",
                timeline: "May 2025 - Jul 2025",
                description: "Fine-tuned multilingual IndicBERT models for low-resource Indian languages, outperforming baseline models on semantic textual similarity by 14%."
            },
            {
                title: "Data Science & Search Intern",
                organization: "InMobi",
                timeline: "May 2024 - Jul 2024",
                description: "Constructed contextual advertising semantic matching engine using dense vector embeddings and HNSW indexing for 450M mobile users."
            }
        ],
        certifications: [
            {
                title: "Hugging Face NLP Specialist Certification",
                issuer: "Hugging Face",
                timeline: "2025",
                credentialUrl: "https://huggingface.co/cert/NLP-9921"
            },
            {
                title: "Deep Learning Specialization",
                issuer: "DeepLearning.AI",
                timeline: "2024",
                credentialUrl: "https://coursera.org/verify/DLS-IITK-881"
            }
        ],
        projects: [
            {
                title: "IndicRank — Cross-Encoder Neural Re-Ranker",
                technologies: ["Python", "PyTorch", "HuggingFace", "FastAPI"],
                link: "https://github.com/sameer-f/indic-rank",
                description: "High-precision neural re-ranking model trained on 10 Indian languages for lexical-semantic fusion search."
            },
            {
                title: "ContextCache — Local In-Memory Embedding Cache",
                technologies: ["Python", "C++", "NumPy", "PostgreSQL"],
                link: "https://github.com/sameer-f/context-cache",
                description: "Ultra-fast embedding cache with cosine distance indexing avoiding repetitive LLM embedding API calls."
            }
        ],
        website: "https://sameerfarooqui.nlp",
        atsScore: 97,
        status: "Shortlisted",
        notes: "Published researcher in multilingual NLP and dense retrieval with internships at Microsoft Research and InMobi.",
        daysAgo: 1
    }
];

async function seed10TopResumes() {
    console.log("════════════════════════════════════════════════════════════════");
    console.log("► SEEDING 10 CLOSE-TO-REAL BEST CANDIDATE RESUMES");
    console.log("════════════════════════════════════════════════════════════════\n");

    try {
        console.log(`[1/4] Connecting to MongoDB: ${MONGO_URI.replace(/\/\/.*@/, "//***:***@")}`);
        await mongoose.connect(MONGO_URI);
        console.log("  ✔ Connected successfully.\n");

        // 1. Fetch Target Opportunity
        const targetOpportunityId = new mongoose.Types.ObjectId("6aa6da49273bb67634c4a4c5");
        let opportunity = await opportunityModel.findById(targetOpportunityId);

        if (!opportunity) {
            opportunity = await opportunityModel.findOne({ status: "active" });
        }

        if (!opportunity) {
            console.error("  ✖ ERROR: No active opportunity found to attach applications.");
            process.exit(1);
        }

        console.log(`[2/4] Target Opportunity: "${opportunity.title}" (${opportunity.organization})`);
        console.log(`  Opportunity ID: ${opportunity._id}`);
        console.log(`  Required Skills: [${opportunity.requiredSkills.join(", ")}]\n`);

        const hashedPassword = await bcrypt.hash("Password@123", 10);
        let seededCount = 0;

        console.log(`[3/4] Seeding 10 authentic top-tier candidate portfolios & ATS resumes...`);

        for (const cand of TOP_10_CANDIDATES) {
            // 1. Upsert User
            const user = await userModel.findOneAndUpdate(
                { email: cand.email.toLowerCase() },
                {
                    name: cand.name,
                    email: cand.email.toLowerCase(),
                    password: hashedPassword,
                    role: "student",
                    isVerified: true,
                    isOnboarded: true,
                },
                { upsert: true, new: true }
            );

            // 2. Upsert Student Profile
            const profile = await profileModel.findOneAndUpdate(
                { userId: user._id },
                {
                    userId: user._id,
                    name: cand.name,
                    email: cand.email.toLowerCase(),
                    phone: cand.phone,
                    institution: cand.institution,
                    location: cand.location,
                    headline: cand.headline,
                    bio: cand.bio,
                    skills: cand.skills,
                    education: cand.education,
                    pastExperience: cand.experience,
                    certifications: cand.certifications.map((c) => ({
                        title: c.title,
                        issuer: c.issuer,
                        credentialUrl: c.credentialUrl,
                        isVerified: true,
                        verifiedAt: new Date(),
                    })),
                },
                { upsert: true, new: true }
            );

            // 3. Compute Match Score
            const reqSkills = opportunity.requiredSkills.map((s) => s.toLowerCase());
            const candSkills = cand.skills.map((s) => s.toLowerCase());
            const matchedSkills = reqSkills.filter((s) => candSkills.includes(s));
            const calculatedMatchScore = Math.round((matchedSkills.length / reqSkills.length) * 100);

            // 5. Build Rich Structured ATS Resume Payload
            const resumeData = {
                fullName: cand.name,
                headline: cand.headline,
                email: cand.email,
                phone: cand.phone,
                location: cand.location,
                linkedin: `https://linkedin.com/in/${cand.name.toLowerCase().replace(/\s+/g, "-")}`,
                github: `https://github.com/${cand.name.toLowerCase().replace(/\s+/g, "")}`,
                website: cand.website,
                summary: cand.bio,
                skills: cand.skills,
                education: cand.education,
                experience: cand.experience,
                certifications: cand.certifications,
                projects: cand.projects,
            };

            const appliedDate = new Date();
            appliedDate.setDate(appliedDate.getDate() - cand.daysAgo);

            // 6. Upsert Application with Full ATS Resume Payload
            await applicationModel.findOneAndUpdate(
                {
                    opportunityId: opportunity._id,
                    applicantId: user._id,
                },
                {
                    opportunityId: opportunity._id,
                    applicantId: user._id,
                    applicantName: cand.name,
                    applicantEmail: cand.email,
                    applicantInstitution: cand.institution,
                    applicantSkills: cand.skills,
                    matchScore: calculatedMatchScore,
                    atsScore: cand.atsScore,
                    resumeUrl: "",
                    resumeData,
                    status: cand.status,
                    appliedAt: appliedDate,
                    notes: cand.notes,
                    reviewerNotes:
                        cand.status === "Shortlisted"
                            ? "Top percentile candidate across Tier-1 institution benchmarks and verified project proof-of-work."
                            : cand.status === "Technical Interview"
                            ? "Advanced to Technical Interview based on exceptional domain mastery and high ATS score."
                            : "",
                },
                { upsert: true, new: true }
            );

            seededCount++;
            console.log(
                `  ✔ [${seededCount}/10] ${cand.name.padEnd(22)} | ${cand.institution.slice(0, 30).padEnd(30)} | ATS: ${cand.atsScore}% | Match: ${calculatedMatchScore}%`
            );
        }

        // 7. Update Opportunity Applicant Count
        const totalApplicants = await applicationModel.countDocuments({ opportunityId: opportunity._id });
        opportunity.applicantCount = totalApplicants;
        await opportunity.save();

        console.log(`\n[4/4] Successfully seeded 10 authentic candidate resumes!`);
        console.log(`  Total active applicants for "${opportunity.title}": ${totalApplicants}`);
        console.log("════════════════════════════════════════════════════════════════\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seed10TopResumes();
