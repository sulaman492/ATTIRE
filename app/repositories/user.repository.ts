import pool from "@/app/lib/db";


// ========================================
// FIND USER BY EMAIL
// ========================================

export const findUserByEmail = async (email: string) => {
  const result = await pool.query(
    `
      SELECT *
      FROM users
      WHERE email = $1
    `,
    [email]
  );

  return result.rows[0];
};


// ========================================
// CREATE USER
// ========================================

export const createUser = async (
  name: string | null,
  email: string,
  password: string | null,
  authProvider: string = "LOCAL"
) => {
  const result = await pool.query(
    `
      INSERT INTO users (
        name,
        email,
        password,
        auth_provider
      )
      VALUES ($1, $2, $3, $4)

      RETURNING
        id,
        name,
        email,
        role,
        auth_provider,
        created_at
    `,
    [
      name,
      email,
      password,
      authProvider
    ]
  );

  return result.rows[0];
};


// ========================================
// SAVE REFRESH TOKEN
// ========================================

export const saveRefreshToken = async (
  userId: string,
  refreshToken: string
) => {
  await pool.query(
    `
      UPDATE users
      SET
        refresh_token = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
    [
      refreshToken,
      userId
    ]
  );
};


// ========================================
// REMOVE REFRESH TOKEN
// ========================================

export const removeRefreshToken = async (
  userId: string
) => {
  await pool.query(
    `
      UPDATE users
      SET
        refresh_token = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
    [userId]
  );
};
