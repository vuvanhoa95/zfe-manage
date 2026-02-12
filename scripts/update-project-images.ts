import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projects = [
    { name: "Dự án Nhà máy An Phát (GĐ 2)", imageUrl: "/uploads/projects/factory.webp" },
    { name: "Cải tạo hạ tầng tuyến phố trung tâm", imageUrl: "/uploads/projects/urban.webp" },
    { name: "Hệ thống Data Center dự phòng tại TP.HCM", imageUrl: "/uploads/projects/datacenter.webp" },
    { name: "Tòa nhà văn phòng Hạng A (Shop Drawing)", imageUrl: "/uploads/projects/office.webp" },
  ];

  for (const p of projects) {
    const updated = await prisma.project.updateMany({
      where: { name: p.name },
      data: { imageUrl: p.imageUrl },
    });
    console.log(`Updated ${updated.count} projects with name: ${p.name}`);
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
