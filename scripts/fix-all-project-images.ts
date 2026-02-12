import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sampleImages = [
    "/uploads/projects/factory.webp",
    "/uploads/projects/urban.webp",
    "/uploads/projects/datacenter.webp",
    "/uploads/projects/office.webp",
  ];

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { imageUrl: null },
        { imageUrl: "" }
      ]
    }
  });

  console.log(`Found ${projects.length} projects without images.`);

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const imageUrl = sampleImages[i % sampleImages.length];
    
    await prisma.project.update({
      where: { id: project.id },
      data: { imageUrl: imageUrl },
    });
    console.log(`Updated project "${project.name}" with image: ${imageUrl}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
