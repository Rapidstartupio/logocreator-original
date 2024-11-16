import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session.userId) {
    redirect('/')
  }

  return children
} 