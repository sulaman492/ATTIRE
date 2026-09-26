import { NextRequest } from "next/server";

import { signupController } from "@/app/controllers/auth.controller";

export async function POST(req: NextRequest) {
  return signupController(req);
}
