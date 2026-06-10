import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// --- inline RBAC catalog (kept in sync with src/lib/rbac.ts) ---
const PERMISSIONS = [
  ["course.create", "Course", "Create courses"],
  ["course.edit", "Course", "Edit courses"],
  ["course.delete", "Course", "Delete courses"],
  ["course.publish", "Course", "Publish courses"],
  ["student.view", "Students", "View students"],
  ["student.edit", "Students", "Edit students"],
  ["student.suspend", "Students", "Suspend students"],
  ["certificate.generate", "Certificates", "Generate certificates"],
  ["certificate.reissue", "Certificates", "Reissue certificates"],
  ["certificate.verify", "Certificates", "Verify certificates"],
  ["finance.payments", "Finance", "View payments"],
  ["finance.refunds", "Finance", "Process refunds"],
  ["finance.reports", "Finance", "View financial reports"],
  ["content.videos", "Content", "Manage videos"],
  ["content.pdfs", "Content", "Manage PDFs"],
  ["content.assignments", "Content", "Manage assignments"],
  ["content.quizzes", "Content", "Manage quizzes"],
  ["website.homepage", "Website", "Manage homepage"],
  ["website.seo", "Website", "Manage SEO"],
  ["website.blog", "Website", "Manage blog"],
  ["website.faq", "Website", "Manage FAQ"],
  ["admin.roles", "Administration", "Manage roles & permissions"],
  ["admin.logs", "Administration", "View audit logs"],
  ["admin.settings", "Administration", "Manage settings"],
  ["admin.users", "Administration", "Manage admins"],
] as const;

const ALL = PERMISSIONS.map((p) => p[0]);

const ROLES = [
  { name: "Super Admin", slug: "super-admin", description: "Full unrestricted access.", perms: ALL },
  { name: "Admin", slug: "admin", description: "Manage most of the platform.", perms: ALL.filter((k) => k !== "admin.roles" && k !== "admin.users") },
  { name: "Course Manager", slug: "course-manager", description: "Manage courses & content.", perms: ["course.create", "course.edit", "course.delete", "course.publish", "content.videos", "content.pdfs", "content.assignments", "content.quizzes", "student.view"] },
  { name: "Content Manager", slug: "content-manager", description: "Manage learning content & blog.", perms: ["content.videos", "content.pdfs", "content.assignments", "content.quizzes", "website.blog", "website.faq", "course.edit"] },
  { name: "Finance Manager", slug: "finance-manager", description: "Manage payments & reports.", perms: ["finance.payments", "finance.refunds", "finance.reports", "student.view"] },
  { name: "Support Executive", slug: "support-executive", description: "Support students.", perms: ["student.view", "student.edit", "certificate.verify", "certificate.reissue"] },
  { name: "Student", slug: "student", description: "Default learner role.", perms: [] as string[] },
];

async function main() {
  console.log("🌱 Seeding KVAI LMS...");

  // 1. Permissions
  for (const [key, group, label] of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: { group, label },
      create: { key, group, label },
    });
  }
  const permRows = await prisma.permission.findMany();
  const permByKey = new Map(permRows.map((p) => [p.key, p.id]));

  // 2. Roles + role permissions
  const roleBySlug = new Map<string, string>();
  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { slug: r.slug },
      update: { name: r.name, description: r.description, isSystem: true },
      create: { name: r.name, slug: r.slug, description: r.description, isSystem: true },
    });
    roleBySlug.set(r.slug, role.id);
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (r.perms.length) {
      await prisma.rolePermission.createMany({
        data: r.perms.map((k) => ({ roleId: role.id, permissionId: permByKey.get(k)! })),
        skipDuplicates: true,
      });
    }
  }

  // 3. Users
  const password = await bcrypt.hash("Admin@123", 12);
  const studentPass = await bcrypt.hash("Student@123", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@kvai.in" },
    update: {},
    create: {
      name: "KVAI Super Admin",
      email: "admin@kvai.in",
      passwordHash: password,
      emailVerified: new Date(),
      status: "ACTIVE",
      roleId: roleBySlug.get("super-admin"),
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: "instructor@kvai.in" },
    update: {},
    create: {
      name: "Priya Sharma",
      email: "instructor@kvai.in",
      passwordHash: password,
      emailVerified: new Date(),
      status: "ACTIVE",
      roleId: roleBySlug.get("course-manager"),
      bio: "Lead instructor at KVAI Solutions with 12+ years in software training.",
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@kvai.in" },
    update: {},
    create: {
      name: "Rahul Verma",
      email: "student@kvai.in",
      passwordHash: studentPass,
      emailVerified: new Date(),
      status: "ACTIVE",
      roleId: roleBySlug.get("student"),
    },
  });

  // 4. Categories — Technology + Government Job Preparation
  const categoryData = [
    { name: "Web Development", slug: "web-development", description: "Build modern websites & web apps." },
    { name: "Programming & Software", slug: "programming", description: "Languages, DSA & software engineering." },
    { name: "Data Science & AI", slug: "data-science-ai", description: "Analytics, machine learning & AI." },
    { name: "Cloud & DevOps", slug: "cloud-devops", description: "Cloud infrastructure & automation." },
    { name: "Cyber Security", slug: "cyber-security", description: "Ethical hacking & security." },
    { name: "SSC Exams", slug: "ssc-exams", description: "SSC CGL, CHSL, MTS preparation." },
    { name: "Banking & Insurance", slug: "banking-insurance", description: "IBPS, SBI, RBI exam prep." },
    { name: "Railway (RRB)", slug: "railway-rrb", description: "RRB NTPC, Group D & ALP." },
    { name: "UPSC & Civil Services", slug: "upsc-civil-services", description: "IAS / IPS foundation." },
    { name: "Teaching Exams", slug: "teaching-exams", description: "CTET, TET, KVS & NVS." },
  ];
  const categories = new Map<string, string>();
  for (let i = 0; i < categoryData.length; i++) {
    const c = categoryData[i];
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, order: i },
      create: { ...c, order: i },
    });
    categories.set(c.slug, cat.id);
  }

  // 5. Courses with sections, lessons, quiz — Tech + Govt Job (test/dummy data)
  const courseSeed = [
    // ---------- Technology ----------
    {
      title: "Full-Stack Web Development Bootcamp",
      slug: "full-stack-web-development",
      category: "web-development",
      subtitle: "From HTML to deploying full-stack apps with Next.js & Node.",
      price: 4999, discountPrice: 2499, level: "ALL_LEVELS",
      thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
      outcomes: ["Build responsive websites", "Master React & Next.js", "Create REST APIs", "Deploy to the cloud"],
      requirements: ["A computer with internet", "No prior coding experience needed"],
    },
    {
      title: "Python Programming Masterclass",
      slug: "python-programming-masterclass",
      category: "programming",
      subtitle: "Learn Python from scratch to advanced with real projects.",
      price: 3999, discountPrice: 1799, level: "BEGINNER",
      thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80",
      outcomes: ["Python fundamentals", "OOP concepts", "File & API handling", "Build real projects"],
      requirements: ["A computer with internet", "No prior coding experience needed"],
    },
    {
      title: "Data Science & Machine Learning with Python",
      slug: "data-science-machine-learning",
      category: "data-science-ai",
      subtitle: "Analyse data and build ML models with Python.",
      price: 5999, discountPrice: 2999, level: "INTERMEDIATE",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
      outcomes: ["Pandas & NumPy", "Data visualization", "Build ML models", "Model evaluation"],
      requirements: ["Basic Python", "Basic maths"],
    },
    {
      title: "AWS Cloud & DevOps Essentials",
      slug: "aws-cloud-devops-essentials",
      category: "cloud-devops",
      subtitle: "Master AWS, CI/CD, Docker and deployment pipelines.",
      price: 4999, discountPrice: 2499, level: "INTERMEDIATE",
      thumbnail: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80",
      outcomes: ["Core AWS services", "Docker & containers", "CI/CD pipelines", "Infrastructure basics"],
      requirements: ["Basic Linux knowledge"],
    },
    {
      title: "Ethical Hacking & Cyber Security",
      slug: "ethical-hacking-cyber-security",
      category: "cyber-security",
      subtitle: "Learn ethical hacking, network security and defence.",
      price: 5499, discountPrice: 2799, level: "INTERMEDIATE",
      thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
      outcomes: ["Network security", "Penetration testing basics", "Web app security", "Security best practices"],
      requirements: ["Basic networking knowledge"],
    },
    {
      title: "C Programming & Data Structures (Free)",
      slug: "c-programming-data-structures",
      category: "programming",
      subtitle: "Strong fundamentals in C and DSA — completely free.",
      price: 0, isFree: true, level: "BEGINNER",
      thumbnail: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&q=80",
      outcomes: ["C programming", "Arrays & pointers", "Linked lists & trees", "Sorting & searching"],
      requirements: ["Curiosity to learn"],
    },
    // ---------- Government Job Preparation ----------
    {
      title: "SSC CGL 2026 Complete Course",
      slug: "ssc-cgl-2026-complete",
      category: "ssc-exams",
      subtitle: "Quant, Reasoning, English & GK for SSC CGL Tier 1 & 2.",
      price: 2999, discountPrice: 1499, level: "ALL_LEVELS",
      thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
      outcomes: ["Quantitative aptitude", "Logical reasoning", "English comprehension", "General awareness"],
      requirements: ["Graduation (any stream)"],
    },
    {
      title: "IBPS & SBI Bank PO / Clerk Complete",
      slug: "ibps-sbi-bank-po-clerk",
      category: "banking-insurance",
      subtitle: "Prelims + Mains preparation for Bank PO & Clerk exams.",
      price: 3499, discountPrice: 1799, level: "ALL_LEVELS",
      thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
      outcomes: ["Banking awareness", "Quantitative aptitude", "Reasoning ability", "English language"],
      requirements: ["Graduation (any stream)"],
    },
    {
      title: "RRB Railway NTPC & Group D",
      slug: "rrb-railway-ntpc-group-d",
      category: "railway-rrb",
      subtitle: "Complete preparation for RRB NTPC and Group D exams.",
      price: 2499, discountPrice: 1299, level: "BEGINNER",
      thumbnail: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&q=80",
      outcomes: ["Mathematics", "General intelligence", "General science", "Current affairs"],
      requirements: ["10th / 12th pass"],
    },
    {
      title: "UPSC Civil Services Foundation",
      slug: "upsc-civil-services-foundation",
      category: "upsc-civil-services",
      subtitle: "Build a strong foundation for IAS / IPS preparation.",
      price: 7999, discountPrice: 3999, level: "ADVANCED",
      thumbnail: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80",
      outcomes: ["Indian polity", "History & geography", "Economy basics", "Answer writing"],
      requirements: ["Graduation (any stream)"],
    },
    {
      title: "CTET Paper 1 & 2 Complete Course",
      slug: "ctet-paper-1-2-complete",
      category: "teaching-exams",
      subtitle: "Child development, pedagogy & subjects for CTET.",
      price: 1999, discountPrice: 999, level: "ALL_LEVELS",
      thumbnail: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80",
      outcomes: ["Child development", "Pedagogy", "Language proficiency", "Maths & EVS"],
      requirements: ["12th / Graduation with D.El.Ed or B.Ed"],
    },
    {
      title: "Current Affairs & General Awareness 2026 (Free)",
      slug: "current-affairs-2026",
      category: "ssc-exams",
      subtitle: "Stay updated for all government exams — free course.",
      price: 0, isFree: true, level: "ALL_LEVELS",
      thumbnail: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&q=80",
      outcomes: ["National & international affairs", "Static GK", "Government schemes", "Sports & awards"],
      requirements: ["No prerequisites"],
    },
  ];

  // Remove any off-topic legacy courses so the catalogue stays tech + govt focused
  await prisma.course.deleteMany({ where: { slug: { notIn: courseSeed.map((c) => c.slug) } } });

  for (const c of courseSeed) {
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        title: c.title,
        slug: c.slug,
        subtitle: c.subtitle,
        description: `<p>${c.subtitle}</p><p>This comprehensive course is designed and delivered by KVAI Solutions, taking you from the fundamentals to job-ready skills through hands-on projects, quizzes and a verifiable certificate on completion.</p>`,
        thumbnail: c.thumbnail,
        price: c.price,
        discountPrice: (c as { discountPrice?: number }).discountPrice ?? null,
        isFree: (c as { isFree?: boolean }).isFree ?? false,
        level: c.level as never,
        status: "PUBLISHED",
        publishedAt: new Date(),
        duration: 600,
        categoryId: categories.get(c.category),
        instructorId: instructor.id,
        learningOutcomes: c.outcomes,
        requirements: c.requirements,
        metaTitle: c.title,
        metaDescription: c.subtitle,
        sections: {
          create: [
            {
              title: "Getting Started",
              order: 0,
              lessons: {
                create: [
                  { title: "Welcome & Course Overview", type: "VIDEO", videoProvider: "YOUTUBE", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", videoId: "dQw4w9WgXcQ", duration: 480, order: 0, isPreview: true },
                  { title: "How to Get the Most From This Course", type: "TEXT", content: "<p>Set aside dedicated time, take notes, and complete every quiz. Use the discussion to ask questions.</p>", duration: 300, order: 1 },
                ],
              },
            },
            {
              title: "Core Concepts",
              order: 1,
              lessons: {
                create: [
                  { title: "Fundamentals Deep Dive", type: "VIDEO", videoProvider: "YOUTUBE", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", videoId: "dQw4w9WgXcQ", duration: 1200, order: 0 },
                  { title: "Hands-on Practice", type: "VIDEO", videoProvider: "YOUTUBE", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", videoId: "dQw4w9WgXcQ", duration: 1500, order: 1 },
                  { title: "Reference Guide (PDF)", type: "PDF", pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", duration: 600, order: 2 },
                ],
              },
            },
          ],
        },
      },
    });

    // Quiz for each course
    const existingQuiz = await prisma.quiz.findFirst({ where: { courseId: course.id } });
    if (!existingQuiz) {
      await prisma.quiz.create({
        data: {
          courseId: course.id,
          title: `${c.title} — Knowledge Check`,
          description: "Test your understanding of the key concepts.",
          type: "QUIZ",
          passingScore: 60,
          timeLimit: 15,
          isPublished: true,
          questions: {
            create: [
              {
                text: "Which best describes the main goal of this course?",
                type: "SINGLE_CHOICE", points: 1, order: 0,
                options: { create: [
                  { text: "To build job-ready practical skills", isCorrect: true, order: 0 },
                  { text: "To memorize theory only", isCorrect: false, order: 1 },
                  { text: "Nothing in particular", isCorrect: false, order: 2 },
                  { text: "To pass time", isCorrect: false, order: 3 },
                ] },
              },
              {
                text: "Hands-on practice is important for mastering new skills.",
                type: "TRUE_FALSE", points: 1, order: 1,
                options: { create: [
                  { text: "True", isCorrect: true, order: 0 },
                  { text: "False", isCorrect: false, order: 1 },
                ] },
              },
              {
                text: "Select all good learning habits.",
                type: "MULTIPLE_CHOICE", points: 2, order: 2,
                options: { create: [
                  { text: "Taking notes", isCorrect: true, order: 0 },
                  { text: "Completing quizzes", isCorrect: true, order: 1 },
                  { text: "Skipping every lesson", isCorrect: false, order: 2 },
                  { text: "Practising regularly", isCorrect: true, order: 3 },
                ] },
              },
            ],
          },
        },
      });
    }
  }

  // 6. Enroll demo student in first two courses with progress
  const firstCourses = await prisma.course.findMany({ take: 2, orderBy: { createdAt: "asc" } });
  for (let i = 0; i < firstCourses.length; i++) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student.id, courseId: firstCourses[i].id } },
      update: {},
      create: {
        userId: student.id,
        courseId: firstCourses[i].id,
        status: "ACTIVE",
        progress: i === 0 ? 45 : 15,
        lastAccessAt: new Date(),
      },
    });
  }

  // 7. Certificate template
  const tplCount = await prisma.certificateTemplate.count();
  if (tplCount === 0) {
    await prisma.certificateTemplate.create({
      data: {
        name: "Classic Green",
        description: "Default professional certificate template.",
        isDefault: true,
        design: {
          accent: "#15803d",
          border: "double",
          font: "serif",
          signatory: "KVAI Solutions",
        },
      },
    });
  }

  // 8. CMS pages
  const pages = [
    { slug: "about", title: "About KVAI LMS", content: "<p>KVAI LMS is an online education platform by KVAI Solutions, empowering students, training institutes, skill councils and corporates with world-class learning.</p>" },
    { slug: "privacy", title: "Privacy Policy", content: "<p>We respect your privacy. This policy explains how KVAI Solutions collects, uses and protects your data on learn.kvai.in.</p>" },
    { slug: "terms", title: "Terms & Conditions", content: "<p>By using KVAI LMS you agree to these terms and conditions set by KVAI Solutions.</p>" },
    { slug: "contact", title: "Contact Us", content: "<p>Reach the KVAI Solutions team at support@kvai.in.</p>" },
  ];
  for (const p of pages) {
    await prisma.page.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }

  // 9. FAQs
  const faqCount = await prisma.fAQ.count();
  if (faqCount === 0) {
    await prisma.fAQ.createMany({
      data: [
        { question: "How do I enroll in a course?", answer: "Browse the catalogue, open a course and click Enroll. For paid courses you'll complete a secure checkout.", category: "Courses", order: 0 },
        { question: "Do I get a certificate?", answer: "Yes. On completing a course you receive a verifiable certificate with a unique ID and QR code.", category: "Certificates", order: 1 },
        { question: "Are payments secure?", answer: "All payments are processed securely via Razorpay. We never store card details.", category: "Payments", order: 2 },
        { question: "Can I learn on mobile?", answer: "Absolutely. KVAI LMS is fully responsive across mobile, tablet, laptop and desktop.", category: "General", order: 3 },
      ],
    });
  }

  // 10. Blog
  const blogCount = await prisma.blogPost.count();
  if (blogCount === 0) {
    await prisma.blogPost.createMany({
      data: [
        { title: "5 Skills That Will Define 2026 Careers", slug: "skills-2026-careers", excerpt: "The job market is shifting fast. Here are the skills employers want.", content: "<p>From AI literacy to cloud computing, here are five skills worth investing in this year...</p>", status: "PUBLISHED", publishedAt: new Date(), tags: ["careers", "skills"], coverImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80", authorId: instructor.id },
        { title: "How to Learn Online Effectively", slug: "learn-online-effectively", excerpt: "Make the most of self-paced online courses with these proven tips.", content: "<p>Online learning gives you flexibility, but success requires discipline...</p>", status: "PUBLISHED", publishedAt: new Date(), tags: ["learning", "tips"], coverImage: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80", authorId: instructor.id },
      ],
    });
  }

  // 11. Success stories
  const storyCount = await prisma.successStory.count();
  if (storyCount === 0) {
    await prisma.successStory.createMany({
      data: [
        { name: "Aarti Singh", role: "Frontend Developer at a startup", content: "The Full-Stack bootcamp completely changed my career. I landed a developer job within 3 months!", rating: 5, featured: true, image: "https://i.pravatar.cc/150?img=47" },
        { name: "Mohit Kumar", role: "Data Analyst", content: "Clear explanations and real projects. The certificate helped me stand out in interviews.", rating: 5, featured: true, image: "https://i.pravatar.cc/150?img=12" },
        { name: "Sneha Patel", role: "Digital Marketer", content: "I now run campaigns for my own clients. Worth every rupee.", rating: 5, featured: true, image: "https://i.pravatar.cc/150?img=32" },
      ],
    });
  }

  // 12. Digital library
  const libCatCount = await prisma.libraryCategory.count();
  if (libCatCount === 0) {
    const cat = await prisma.libraryCategory.create({ data: { name: "Study Material", slug: "study-material" } });
    await prisma.libraryItem.createMany({
      data: [
        { title: "Web Development Cheat Sheet", type: "PDF", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", categoryId: cat.id, description: "Quick reference for HTML, CSS & JS." },
        { title: "Python Basics eBook", type: "EBOOK", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", categoryId: cat.id, description: "Beginner-friendly Python guide." },
      ],
    });
  }

  // 13. Coupon
  await prisma.coupon.upsert({
    where: { code: "WELCOME20" },
    update: {},
    create: { code: "WELCOME20", type: "PERCENTAGE", value: 20, maxUses: 1000, isActive: true },
  });

  // 14. Settings
  const settings = [
    { key: "site.name", value: "KVAI LMS", group: "general" },
    { key: "site.tagline", value: "Learn. Grow. Get Certified.", group: "general" },
    { key: "site.supportEmail", value: "support@kvai.in", group: "general" },
    { key: "site.brandColor", value: "#15803d", group: "appearance" },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value, group: s.group },
    });
  }

  console.log("✅ Seed complete.");
  console.log("   Super Admin: admin@kvai.in / Admin@123");
  console.log("   Instructor:  instructor@kvai.in / Admin@123");
  console.log("   Student:     student@kvai.in / Student@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
