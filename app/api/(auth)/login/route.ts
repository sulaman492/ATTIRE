import { NextRequest } from "next/server";

import { loginController } from "@/app/controllers/auth.controller";

export async function POST(req: NextRequest) {
  return loginController(req);
}