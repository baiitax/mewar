import { prisma } from "@/app/lib/db";
export async function GET(){
  try{
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ok:true,service:"MIU Platform Foundation",version:"phase-2"},{headers:{"Cache-Control":"no-store"}});
  }catch{
    return Response.json({ok:false,service:"MIU Platform Foundation"},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
