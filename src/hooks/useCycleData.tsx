import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { addDays, todayInTimeZone } from "../lib/cycle"
import { deviceTimeZone } from "../lib/format"
import {
  fetchLogs,
  fetchPeriods,
  fetchProfile,
  type DailyLog,
  type PeriodRow,
  type Profile,
} from "../services/data"
import { useSession } from "./useSession"

/** Suficiente para detectar patrones en los últimos ciclos */
const LOG_HISTORY_DAYS = 220

interface CycleData {
  profile: Profile | null
  periods: PeriodRow[]
  logs: DailyLog[]
  loading: boolean
  failed: boolean
  reload: () => Promise<void>
}

const CycleDataContext = createContext<CycleData>({
  profile: null,
  periods: [],
  logs: [],
  loading: true,
  failed: false,
  reload: async () => {},
})

export function CycleDataProvider({ children }: { children: ReactNode }) {
  const session = useSession()
  const userId = session.status === "in" ? session.user.id : null
  const [profile, setProfile] = useState<Profile | null>(null)
  const [periods, setPeriods] = useState<PeriodRow[]>([])
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const reload = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setPeriods([])
      setLogs([])
      setLoading(false)
      return
    }
    try {
      const since = addDays(todayInTimeZone(deviceTimeZone()), -LOG_HISTORY_DAYS)
      const [p, list, days] = await Promise.all([fetchProfile(userId), fetchPeriods(), fetchLogs(since)])
      setProfile(p)
      setPeriods(list)
      setLogs(days)
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
    () => ({ profile, periods, logs, loading, failed, reload }),
    [profile, periods, logs, loading, failed, reload]
  )
  return <CycleDataContext.Provider value={value}>{children}</CycleDataContext.Provider>
}

export const useCycleData = () => useContext(CycleDataContext)
