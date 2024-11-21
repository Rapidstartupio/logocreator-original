import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/')
  }

  return <div className="min-h-screen bg-gray-900">{children}</div>
} 