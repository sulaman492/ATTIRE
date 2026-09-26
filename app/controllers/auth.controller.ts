import { NextRequest, NextResponse } from "next/server";

import { loginUser, signupUser } from "@/app/services/auth.service";

export async function signupController(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { email, password, name } = body;

    const {
      accessToken,
      refreshToken,
      user,
    } = await signupUser(email, password, name);

    const response = NextResponse.json(
      {
        message: "User registered successfully",
        user,
      },
      {
        status: 201,
      }
    );

    // ACCESS TOKEN - 15 MINUTES (HTTP-only)
    response.cookies.set(
      "accessToken",
      accessToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60,
      }
    );

    // REFRESH TOKEN - 7 DAYS (HTTP-only)
    response.cookies.set(
      "refreshToken",
      refreshToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      }
    );

    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    const isConflict =
      message.toLowerCase().includes("already registered") ||
      message.toLowerCase().includes("already exists");

    const isBadRequest =
      message.toLowerCase().includes("required") ||
      message.toLowerCase().includes("valid email") ||
      message.toLowerCase().includes("at least");

    const status = isConflict ? 409 : isBadRequest ? 400 : 500;

    return NextResponse.json(
      {
        message,
      },
      {
        status,
      }
    );
  }
}

export async function loginController(req: NextRequest) {
  try {
    const body = await req.json();

    const { email, password } = body;

    const {
      accessToken,
      refreshToken,
      user,
    } = await loginUser(email, password);

    const response = NextResponse.json(
      {
        message: "Login successful",
        user,
      },
      {
        status: 200,
      }
    );

    // ACCESS TOKEN - 15 MINUTES
    response.cookies.set(
      "accessToken",
      accessToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",

        maxAge: 15 * 60,
      }
    );

    // REFRESH TOKEN - 7 DAYS
    response.cookies.set(
      "refreshToken",
      refreshToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",

        maxAge: 7 * 24 * 60 * 60,
      }
    );

    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    return NextResponse.json(
      {
        message,
      },
      {
        status: 401,
      }
    );
  }
}
