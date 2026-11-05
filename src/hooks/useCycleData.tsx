import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { fetchPeriods, fetchProfile, type PeriodRow, type Profile } from "../services/data"
import { useSession } from "./useSession"

interface CycleData {
  profile: Profile | null
  periods: PeriodRow[]
  loading: boolean
  failed: boolean
  reload: () => Promise<void>
}

const CycleDataContext = createContext<CycleData>({
  profile: null,
  periods: [],
  loading: true,
  failed: false,
  reload: async () => {},
})

export function CycleDataProvider({ children }: { children: ReactNode }) {
  const session = useSession()
  const userId = session.status === "in" ? session.user.id : null
  const [profile, setProfile] = useState<Profile | null>(null)
  const [periods, setPeriods] = useState<PeriodRow[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const reload = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setPeriods([])
      setLoading(false)
      return
    }
    try {
      const [p, list] = await Promise.all([fetchProfile(userId), fetchPeriods()])
      setProfile(p)
      setPeriods(list)
      setFailed(false)
    } catch (error) {
      console.error("No se han podido cargar los datos", error)
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    setLoading(true)
    void reload()
  }, [reload])

  const value = useMemo(
    () => ({ profile, periods, loading, failed, reload }),
    [profile, periods, loading, failed, reload]
  )
  return <CycleDataContext.Provider value={value}>{children}</CycleDataContext.Provider>
}

export const useCycleData = () => useContext(CycleDataContext)
