// scripts/print-enums.ts
import { Prisma } from "@prisma/client";

console.log("CommissionStatus:", Object.keys((Prisma as any).CommissionStatus || {}));
console.log("CommissionType:", Object.keys((Prisma as any).CommissionType || {}));
