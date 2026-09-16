import * as simpleIcons from "simple-icons";
import type { SimpleIcon } from "simple-icons";

export interface SkillIconData {
  title: string;
  slug: string;
  hex: string;
  path: string;
}

// Map of common developer / technology aliases to simple-icons slugs or titles
const SKILL_ALIASES: Record<string, string> = {
  // Languages & runtimes
  c: "c",
  "c language": "c",
  cplusplus: "cplusplus",
  js: "javascript",
  ts: "typescript",
  py: "python",
  cpp: "cplusplus",
  "c++": "cplusplus",
  "c#": "dotnet",
  csharp: "dotnet",
  ".net": "dotnet",
  dotnet: "dotnet",
  golang: "go",
  java: "openjdk",
  node: "nodedotjs",
  nodejs: "nodedotjs",
  "node.js": "nodedotjs",

  rust: "rust",
  go: "go",
  // Frontend frameworks & libs
  react: "react",
  reactjs: "react",
  "react.js": "react",
  "react native": "react",
  reactnative: "react",
  vue: "vuedotjs",
  vuejs: "vuedotjs",
  "vue.js": "vuedotjs",
  next: "nextdotjs",
  nextjs: "nextdotjs",
  "next.js": "nextdotjs",
  angular: "angular",
  angularjs: "angular",
  nuxt: "nuxt",
  svelte: "svelte",
  tailwind: "tailwindcss",
  tailwindcss: "tailwindcss",
  html: "html5",
  css: "css",
  css3: "css",
  sass: "sass",
  scss: "sass",
  bootstrap: "bootstrap",
  redux: "redux",

  // Backend & APIs
  express: "express",
  expressjs: "express",
  "express.js": "express",
  django: "django",
  fastapi: "fastapi",
  flask: "flask",
  spring: "spring",
  springboot: "springboot",
  "spring boot": "springboot",
  nest: "nestjs",
  nestjs: "nestjs",
  graphql: "graphql",
  rest: "postman",
  api: "fastapi",

  // Databases
  mongo: "mongodb",
  mongodb: "mongodb",
  postgres: "postgresql",
  postgresql: "postgresql",
  sql: "mysql",
  mysql: "mysql",
  sqlite: "sqlite",
  redis: "redis",
  prisma: "prisma",
  drizzle: "drizzle",
  supabase: "supabase",
  firebase: "firebase",

  // DevOps & Cloud
  docker: "docker",
  k8s: "kubernetes",
  kubernetes: "kubernetes",
  git: "git",
  github: "github",
  gitlab: "gitlab",
  linux: "linux",
  ubuntu: "ubuntu",
  nginx: "nginx",
  vercel: "vercel",
  netlify: "netlify",

  // AI & Data Science
  ai: "anthropic",
  ml: "scikitlearn",
  "machine learning": "scikitlearn",
  "deep learning": "pytorch",
  tensorflow: "tensorflow",
  pytorch: "pytorch",
  pandas: "pandas",
  numpy: "numpy",
  scikit: "scikitlearn",
  "scikit-learn": "scikitlearn",
  opencv: "opencv",
  langchain: "langchain",
  huggingface: "huggingface",
  "hugging face": "huggingface",
  jupyter: "jupyter",

  // Design & Product
  figma: "figma",
  canva: "canva",
  photoshop: "adobephotoshop",
  illustrator: "adobeillustrator",
  jira: "jira",
  postman: "postman",
};

// Index all Simple Icons
const slugMap = new Map<string, SkillIconData>();
const titleLowerMap = new Map<string, SkillIconData>();
const cleanMap = new Map<string, SkillIconData>();
const allIconsList: SkillIconData[] = [];

// Initialize maps once
for (const key of Object.keys(simpleIcons)) {
  const icon = (simpleIcons as Record<string, unknown>)[key] as SimpleIcon | undefined;
  if (icon && typeof icon === "object" && icon.title && icon.slug && icon.path) {
    const item: SkillIconData = {
      title: icon.title,
      slug: icon.slug,
      hex: icon.hex || "6366F1",
      path: icon.path,
    };
    allIconsList.push(item);
    slugMap.set(icon.slug.toLowerCase(), item);
    titleLowerMap.set(icon.title.toLowerCase(), item);

    const clean = icon.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean) {
      cleanMap.set(clean, item);
    }
  }
}

/**
 * Normalizes a user skill query string
 */
function normalizeSkill(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Get the SkillIconData for any given skill name (case-insensitive with aliases)
 */
export function getSkillIcon(skillName: string): SkillIconData | null {
  if (!skillName) return null;
  const raw = normalizeSkill(skillName);

  // 1. Check exact alias
  const aliasSlug = SKILL_ALIASES[raw];
  if (aliasSlug && slugMap.has(aliasSlug)) {
    return slugMap.get(aliasSlug)!;
  }

  // 2. Check direct slug match
  if (slugMap.has(raw)) {
    return slugMap.get(raw)!;
  }

  // 3. Check direct title match
  if (titleLowerMap.has(raw)) {
    return titleLowerMap.get(raw)!;
  }

  // 4. Check clean alphanumeric exact match (e.g. "c++" -> "cplusplus", "node.js" -> "nodejs")
  const clean = raw.replace(/[^a-z0-9]/g, "");
  if (clean && cleanMap.has(clean)) {
    return cleanMap.get(clean)!;
  }

  // 5. Check if multi-word raw input directly matches a title startsWith (length >= 4)
  if (raw.length >= 4) {
    const titleMatch = allIconsList.find(
      (i) => i.title.toLowerCase() === raw || i.slug === raw
    );
    if (titleMatch) return titleMatch;
  }

  return null;
}

/**
 * Autocomplete / search matching skills from simple-icons
 */
export function searchSkillSuggestions(query: string, limit = 8): SkillIconData[] {
  const q = normalizeSkill(query);
  if (!q) {
    // Return top popular programming languages & tech icons as default suggestions
    const popularItems: Array<{ slug: string; title: string }> = [
      { slug: "python", title: "Python" },
      { slug: "openjdk", title: "Java" },
      { slug: "cplusplus", title: "C++" },
      { slug: "c", title: "C" },
      { slug: "javascript", title: "JavaScript" },
      { slug: "typescript", title: "TypeScript" },
      { slug: "react", title: "React" },
      { slug: "nodedotjs", title: "Node.js" },
      { slug: "docker", title: "Docker" },
      { slug: "rust", title: "Rust" },
      { slug: "go", title: "Go" },
      { slug: "mysql", title: "SQL" },
    ];
    return popularItems
      .map((item) => {
        const icon = slugMap.get(item.slug);
        return icon ? { ...icon, title: item.title } : null;
      })
      .filter((i): i is SkillIconData => Boolean(i));
  }

  const results: SkillIconData[] = [];
  const seenSlugs = new Set<string>();

  // Check alias match first
  const aliasSlug = SKILL_ALIASES[q];
  if (aliasSlug && slugMap.has(aliasSlug)) {
    const icon = slugMap.get(aliasSlug)!;
    seenSlugs.add(icon.slug);
    if (q === "java") {
      results.push({ ...icon, title: "Java" });
    } else if (q === "c#" || q === "csharp") {
      results.push({ ...icon, title: "C#" });
    } else if (q === "c++" || q === "cpp") {
      results.push({ ...icon, title: "C++" });
    } else if (q === "c" || q === "c language") {
      results.push({ ...icon, title: "C" });
    } else if (q === "sql") {
      results.push({ ...icon, title: "SQL" });
    } else {
      results.push(icon);
    }
  }

  // 1. Starts with title or slug
  for (const icon of allIconsList) {
    if (results.length >= limit) break;
    if (seenSlugs.has(icon.slug)) continue;

    const titleLower = icon.title.toLowerCase();
    if (titleLower.startsWith(q) || icon.slug.startsWith(q)) {
      seenSlugs.add(icon.slug);
      results.push(icon);
    }
  }

  // 2. Contains query
  if (results.length < limit) {
    for (const icon of allIconsList) {
      if (results.length >= limit) break;
      if (seenSlugs.has(icon.slug)) continue;

      const titleLower = icon.title.toLowerCase();
      if (titleLower.includes(q) || icon.slug.includes(q)) {
        seenSlugs.add(icon.slug);
        results.push(icon);
      }
    }
  }

  return results;
}
