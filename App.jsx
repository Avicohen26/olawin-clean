import { Analytics } from '@vercel/analytics/react'
import { lazy, Suspense } from 'react'
import Client from "./olawin-client.jsx"
// L'admin est charge separement : il n'alourdit plus le site public
const Admin = lazy(() => import("./olawin-admin.jsx"))

export default function App() {
  const isAdmin = window.location.pathname.startsWith("/admin")
  return (
    <>
      {isAdmin
        ? <Suspense fallback={<div style={{padding:"60px",textAlign:"center",fontFamily:"sans-serif",color:"#666"}}>Chargement…</div>}><Admin /></Suspense>
        : <Client />}
      <Analytics />
    </>
  )
}
