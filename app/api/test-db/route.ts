import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await pool.query("SELECT NOW()");

    return NextResponse.json(
      {
        message: "Database connected successfully",
        time: result.rows[0].now,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}