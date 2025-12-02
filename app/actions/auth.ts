"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function loginWithMockUser() {
  const cookieStore = await cookies()

  cookieStore.set("auth-token", "mock-session-token", {
    httpOnly: true,
    secure: false,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  return { success: true }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")
  redirect("/")
}
