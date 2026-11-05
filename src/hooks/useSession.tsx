import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { DEMO, supabase } from "../services/supabase"
import { DEMO_USER, readDemo } from "../services/demo"

export interface SessionUser {
  id: string
  email: string
}

type SessionState = { status: "loading" } | { status: "out" } | { status: "in"; user: SessionUser }

const SessionContext = createContext<SessionState>({ status: "loading" })

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading" })

  useEffect(() => {
    if (DEMO) {
      const sync = () =>
        setState(readDemo().signedIn ? { status: "in", user: DEMO_USER } : { status: "out" })
      sync()
      window.addEventListener("demo-auth", sync)
      return () => window.removeEventListener("demo-auth", sync)
    }
    if (!supabase) {
      setState({ status: "out" })
      return
    }
    // Avisa también de la sesión inicial y de la que llega por el enlace del email
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(
        session
          ? { status: "in", user: { id: session.user.id, email: session.user.email ?? "" } }
          : { status: "out" }
      )
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
}

export const useSession = () => useContext(SessionContext)
