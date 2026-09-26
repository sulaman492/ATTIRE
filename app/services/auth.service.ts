import bcrypt from "bcryptjs";

import {
  findUserByEmail,
  createUser,
  saveRefreshToken,
} from "@/app/repositories/user.repository";

import {
  generateAccessToken,
  generateRefreshToken,
} from "@/app/lib/jwt";


// ========================================
// LOGIN USER
// ========================================

export const loginUser = async (
  email: string,
  password: string
) => {
  // Check required fields
  if (!email || !password) {
    throw new Error(
      "Email and password are required"
    );
  }


  // Find user
  const user = await findUserByEmail(email);


  // Don't reveal whether email exists
  if (!user) {
    throw new Error(
      "Invalid email or password"
    );
  }


  // Google user should not use password login
  if (user.auth_provider !== "LOCAL") {
    throw new Error(
      "Please login with Google"
    );
  }


  // Safety check
  if (!user.password) {
    throw new Error(
      "Password login unavailable"
    );
  }


  // Compare entered password with hashed password
  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );


  if (!passwordMatches) {
    throw new Error(
      "Invalid email or password"
    );
  }


  // JWT payload
  const payload = {
    userId: user.id,
    role: user.role,
  };


  // Access token → 15 minutes
  const accessToken =
    generateAccessToken(payload);


  // Refresh token → 7 days
  const refreshToken =
    generateRefreshToken(payload);


  /*
    IMPORTANT:

    Browser gets the real refresh token.

    Database stores ONLY its hash.
  */
  const hashedRefreshToken =
    await bcrypt.hash(
      refreshToken,
      10
    );


  // Store hashed refresh token in DB
  await saveRefreshToken(
    user.id,
    hashedRefreshToken
  );


  // Return tokens to controller
  return {
    accessToken,
    refreshToken,

    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};


// ========================================
// SIGNUP USER
// ========================================

export const signupUser = async (
  email?: string,
  password?: string,
  name?: string | null
) => {
  // 1. Check required fields
  if (!email || typeof email !== "string" || !email.trim()) {
    throw new Error("Email is required");
  }

  if (!password || typeof password !== "string" || !password.trim()) {
    throw new Error("Password is required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new Error("Please enter a valid email address");
  }

  // Password length validation
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  // 2. Check if email already exists
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error("Email is already registered");
  }

  // 3. Hash the password with bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Insert user into PostgreSQL (role defaults to 'CUSTOMER', auth_provider to 'LOCAL')
  const newUser = await createUser(
    name ? name.trim() : null,
    normalizedEmail,
    hashedPassword,
    "LOCAL"
  );

  // 5. Generate access token (15 min)
  const tokenPayload = {
    userId: newUser.id,
    role: newUser.role,
  };

  const accessToken = generateAccessToken(tokenPayload);

  // 6. Generate refresh token (7 days)
  const refreshToken = generateRefreshToken(tokenPayload);

  // 7. Hash refresh token
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  // 8. Save hashed refresh token in DB
  await saveRefreshToken(newUser.id, hashedRefreshToken);

  // 9. Return tokens and safe user data
  return {
    accessToken,
    refreshToken,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.created_at,
    },
  };
};

