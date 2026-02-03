import { NextResponse } from "next/server";
import { createUser } from "@/lib/user-store";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const { user, error } = await createUser(email, password);
    if (error) {
      return NextResponse.json({ error }, { status: 409 });
    }

    return NextResponse.json(
      { id: user?.id, email: user?.email },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Unable to create account." },
      { status: 500 },
    );
  }
}
