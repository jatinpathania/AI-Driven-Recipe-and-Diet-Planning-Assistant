import { NextResponse } from "next/server"

// Same mock DB (in real case, import from a DB)
let users = [
  // Just a demo user
  { id: 1, name: "Test User", email: "test@example.com", password: "123456" },
]

export async function POST(req) {
  const { email, password } = await req.json()

  const user = users.find((u) => u.email === email && u.password === password)
  if (!user) {
    return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
  }

  // In real-world, generate JWT here
  return NextResponse.json({
    success: true,
    message: "Login successful",
    user: { name: user.name, email: user.email },
  })
}
