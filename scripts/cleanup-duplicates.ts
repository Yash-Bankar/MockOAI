import { config } from "dotenv";
config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const attempt = await prisma.examAttempt.findFirst({
    where: { status: "IN_PROGRESS" },
    orderBy: { createdAt: "desc" },
    include: {
      sections: {
        include: { questions: true }
      }
    }
  });

  if (!attempt) {
    console.log("No IN_PROGRESS attempts found.");
    return;
  }

  console.log(`[Before Cleanup] Attempt: ${attempt.id}`);
  for (const sec of attempt.sections) {
    console.log(`  - Section: ${sec.name} | Questions: ${sec.questions.length}`);
  }

  // Delete all questions for this attempt
  const attemptSectionIds = attempt.sections.map(s => s.id);
  const deleteRes = await prisma.question.deleteMany({
    where: { attemptSectionId: { in: attemptSectionIds } }
  });

  console.log(`\nDeleted ${deleteRes.count} duplicated questions from this attempt.`);

  const attemptAfter = await prisma.examAttempt.findFirst({
    where: { id: attempt.id },
    include: {
      sections: {
        include: { questions: true }
      }
    }
  });

  console.log(`\n[After Cleanup] Attempt: ${attemptAfter?.id}`);
  for (const sec of attemptAfter?.sections || []) {
    console.log(`  - Section: ${sec.name} | Questions: ${sec.questions.length}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
