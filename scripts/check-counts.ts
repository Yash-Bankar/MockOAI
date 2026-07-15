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
        include: {
          questions: true
        }
      }
    }
  });

  if (!attempt) {
    console.log("No IN_PROGRESS attempts found.");
    return;
  }

  console.log(`Attempt: ${attempt.id}`);
  console.log(`Total Sections in DB: ${attempt.sections.length}`);
  
  for (const sec of attempt.sections) {
    console.log(`\nSection ID: ${sec.id} | Name: ${sec.name}`);
    console.log(`Questions Count: ${sec.questions.length}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
