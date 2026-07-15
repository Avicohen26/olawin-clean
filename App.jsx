import { Analytics } from '@vercel/analytics/react'
import Client from "./olawin-client.jsx"
import Admin from "./olawin-admin.jsx"
export default function App() {
  const isAdmin = window.location.pathname.startsWith("/admin")
  return (
    <>
      {isAdmin ? <Admin /> : <Client />}
      <Analytics />
    </>
  )
}
