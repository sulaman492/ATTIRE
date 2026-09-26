"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Signup failed");
        return;
      }

      // Backend sets accessToken + refreshToken cookies
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#EDE4DD] text-black flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">

        <h1 className="text-5xl font-bold text-center mb-12">
          CREATE ACCOUNT
        </h1>

        <form onSubmit={handleSignup} className="space-y-7">

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm mb-2 uppercase"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="
                w-full
                bg-transparent
                border-b
                border-black
                py-3
                text-black
                placeholder:text-black/40
                outline-none
                focus:border-[#ff1a0a]
                transition-colors
              "
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm mb-2 uppercase"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="
                w-full
                bg-transparent
                border-b
                border-black
                py-3
                text-black
                placeholder:text-black/40
                outline-none
                focus:border-[#ff1a0a]
                transition-colors
              "
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm mb-2 uppercase"
            >
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="
                w-full
                bg-transparent
                border-b
                border-black
                py-3
                text-black
                placeholder:text-black/40
                outline-none
                focus:border-[#ff1a0a]
                transition-colors
              "
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[#ff1a0a] text-sm">
              {error}
            </p>
          )}

          {/* Create Account */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              bg-[#ff1a0a]
              text-white
              py-4
              mt-5
              uppercase
              font-semibold
              cursor-pointer
              hover:opacity-85
              transition-opacity
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-7">
          <div className="h-px bg-black/30 flex-1" />

          <span className="text-xs uppercase text-black/60">
            Or
          </span>

          <div className="h-px bg-black/30 flex-1" />
        </div>

        {/* Google */}
        <button
          type="button"
          className="
            w-full
            border
            border-black
            py-4
            flex
            items-center
            justify-center
            gap-3
            uppercase
            font-semibold
            cursor-pointer
            hover:bg-black
            hover:text-white
            transition-colors
          "
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              fill="#FFC107"
              d="M43.6 20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11.5 0 19-8.1 19-19.5 0-1.3-.1-2.7-.4-4.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.1 0 9.7-1.8 13.1-5l-6.1-5.2C29 35.2 26.6 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.1 5.2C40.6 35.8 43 31 43 24.5c0-1.3-.1-2.7-.4-4.5z"
            />
          </svg>

          Continue with Google
        </button>

        {/* Existing Account */}
        <p className="text-center mt-7 text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold underline underline-offset-4 hover:text-[#ff1a0a] transition-colors"
          >
            Login
          </Link>
        </p>

      </div>
    </main>
  );
}