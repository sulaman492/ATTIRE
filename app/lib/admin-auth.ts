import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { ApiError } from "./api-error";
import { findUserRoleById } from "@/app/repositories/user.repository";

export async function requireAdminToken(token?: string) {
  if (!token) throw new ApiError(401, "Please log in to continue.");
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error("Access token configuration missing");
  let payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch { throw new ApiError(401, "Your session has expired. Please log in again."); }
  if (typeof payload === "string" || typeof payload.userId !== "string" ||
      !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(payload.userId) ||
      typeof payload.role !== "string" || typeof payload.exp !== "number") {
    throw new ApiError(401, "Invalid session. Please log in again.");
  }
  if (payload.role !== "ADMIN") throw new ApiError(403, "Administrator access required.");
  // Also check the current role, so demotion takes effect immediately.
  const user = await findUserRoleById(payload.userId);
  if (!user) throw new ApiError(401, "Your account is no longer available.");
  if (user.role !== "ADMIN") throw new ApiError(403, "Administrator access required.");
  return { userId: payload.userId, role: "ADMIN" as const };
}

export async function requireAdminRequest(request: NextRequest) {
  const user = await requireAdminToken(request.cookies.get("accessToken")?.value);
  // Cookie-authenticated writes must come from our own origin. CLI clients may omit Origin.
  const origin = request.headers.get("origin");
  const expectedOrigin = process.env.APP_ORIGIN || request.nextUrl.origin;
  if ((origin && origin !== expectedOrigin) || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ApiError(403, "Cross-site requests are not allowed.");
  }
  return user;
}

export async function requireAdminPage() {
  try { return await requireAdminToken((await cookies()).get("accessToken")?.value); }
  catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) redirect("/login?next=/admin");
      redirect("/access-denied");
    }
    throw error;
  }
}
