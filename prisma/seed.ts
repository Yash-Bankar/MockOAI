import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.examPattern.findFirst({
    where: { name: "TCS NQT-Style OA" },
  });

  if (existing) {
    console.log("ExamPattern 'TCS NQT-Style OA' already exists — skipping seed.");
    return;
  }

  const pattern = await prisma.examPattern.create({
    data: {
      name: "TCS NQT-Style OA",
      description:
        "TCS National Qualifier Test style online assessment covering English, Reasoning, Quantitative Ability, Computer Fundamentals, and Coding.",
      maxScore: 125,
      sections: {
        create: [
          {
            name: "English",
            order: 1,
            maxScore: 20,
            questionCount: 20,
            format: "MCQ",
            questionTypeMix: [
              { type: "Fill in the Blank", count: 3 },
              { type: "FIB", count: 2 },
              { type: "Error Detection", count: 4 },
              { type: "Sentence Correction", count: 3 },
              { type: "Sentence Arrangement", count: 3 },
              { type: "One Word Substitution", count: 2 },
              { type: "Reading Comprehension", count: 3 },
            ],
          },
          {
            name: "Logical and Analytical Reasoning",
            order: 2,
            maxScore: 20,
            questionCount: 20,
            format: "MCQ",
            questionTypeMix: [
              { type: "Logical Reasoning", count: 6 },
              { type: "Puzzles", count: 5 },
              { type: "Attention to Details", count: 4 },
              { type: "Visual Reasoning", count: 3 },
              { type: "Critical Reasoning", count: 2 },
            ],
          },
          {
            name: "Quantitative Ability",
            order: 3,
            maxScore: 20,
            questionCount: 20,
            format: "MCQ",
            questionTypeMix: [
              { type: "Quant Math Ability", count: 12 },
              { type: "Data Sufficiency", count: 3 },
              { type: "Data Interpretation", count: 5 },
            ],
          },
          {
            name: "Computer Fundamentals",
            order: 4,
            maxScore: 20,
            questionCount: 20,
            format: "MCQ",
            questionTypeMix: [
              { type: "Basics of Programming", count: 3 },
              { type: "Data Structures and Algorithms", count: 4 },
              { type: "OOPS", count: 3 },
              { type: "Operating Systems", count: 3 },
              { type: "Network Basics", count: 2 },
              { type: "Testing Basics", count: 3 },
              { type: "RDBMS and SQL", count: 2 },
            ],
          },
          {
            name: "Language Coding",
            order: 5,
            maxScore: 45,
            questionCount: 3,
            format: "CODING",
            questionTypeMix: [
              { type: "Coding 1", maxScore: 10, difficulty: "easy" },
              { type: "Coding 2", maxScore: 15, difficulty: "medium" },
              { type: "Coding 3", maxScore: 20, difficulty: "medium to hard" },
            ],
          },
        ],
      },
    },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  console.log("Seeded ExamPattern:", pattern.name);
  console.log("  id:", pattern.id);
  console.log("  maxScore:", pattern.maxScore);
  console.log("  sections:");
  for (const s of pattern.sections) {
    console.log(
      `    ${s.order}. ${s.name} — format=${s.format}, maxScore=${s.maxScore}, questions=${s.questionCount}`
    );
  }
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
