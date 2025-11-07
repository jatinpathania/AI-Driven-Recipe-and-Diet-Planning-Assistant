import { NextResponse } from "next/server"

// Temporary mock database (in-memory)
let users = []

export async function POST(req) {
  const { name, email, password } = await req.json()

  // Check if user exists
  const existingUser = users.find((u) => u.email === email)
  if (existingUser) {
    return NextResponse.json({ success: false, message: "User already exists" }, { status: 400 })
  }

  // Create user
  const newUser = { id: Date.now(), name, email, password }
  users.push(newUser)

  return NextResponse.json({ success: true, message: "Signup successful" }, { status: 201 })
}
