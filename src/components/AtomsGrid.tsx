import { useEffect, useMemo, useState } from 'react'
import './AtomsGrid.css'
import JoinGuildDialog from './JoinGuildDialog'

const MAINNET_CHAIN_ID = 1155

async function fetchAtomViaSdk(atomId: string): Promise<any | null> {
  try {
    const sdk: any = await import('@0xintuition/sdk')
    if (typeof sdk.createClient === 'function') {
      const client = sdk.createClient({ chainId: MAINNET_CHAIN_ID })
      if (client.atoms?.byTripleId) {
        return await client.atoms.byTripleId({ tripleId: atomId })
      }
      if (client.atoms?.get) {
        return await client.atoms.get({ tripleId: atomId })
      }
    }
    if (typeof (sdk as any).getAtomDetails === 'function') {
      return await (sdk as any).getAtomDetails(atomId)
    }
  } catch (err) {
    console.warn('Intuition SDK fetch failed', err)
  }
  return null
}

function normalizeAtom(data: any | null, atomId: string) {
  if (!data) {
    return {
      id: atomId,
      name: 'Unknown Atom',
      description: '',
      image: '',
      positionsCount: undefined,
    }
  }
  const name =
    data.label ||
    data.name ||
    data.title ||
    data?.value?.thing?.name ||
    data?.value?.person?.name ||
    data?.value?.organization?.name ||
    data?.value?.account?.name ||
    ''
  const description =
    data?.value?.thing?.description ||
    data?.value?.person?.description ||
    data?.value?.organization?.description ||
    data?.value?.account?.description ||
    data.description ||
    data.summary ||
    ''
  const image =
    data.image ||
    data?.value?.thing?.image ||
    data?.value?.person?.image ||
    data?.value?.organization?.image ||
    data?.value?.account?.image ||
    data.imageUrl ||
    (Array.isArray(data.images) && data.images.length > 0 ? data.images[0] : '') ||
    ''
  const positionsCount =
    (Array.isArray(data?.term?.vaults)
      ? data.term.vaults.reduce((sum: number, v: any) => {
          const c = v?.positions_aggregate?.aggregate?.count
          return sum + (typeof c === 'number' ? c : 0)
        }, 0)
      : undefined) ??
    data.positionsCount ??
    (Array.isArray(data.positions) ? data.positions.length : undefined) ??
    data.numPositions

  return {
    id: atomId,
    name,
    description,
    image,
    positionsCount,
  }
}

export default function AtomsGrid({ atomIds }: { atomIds: string[] }) {
  const ids = useMemo(() => atomIds.filter(Boolean), [atomIds])
  const [items, setItems] = useState<{ id: string; loading: boolean; data: any | null }[]>(
    () => ids.map((id) => ({ id, loading: true, data: null })),
  )
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinGuild, setJoinGuild] = useState<{ id: string; name: string; image?: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      const results: { id: string; loading: boolean; data: any }[] = []
      for (const id of ids) {
        const sdkData = await fetchAtomViaSdk(id)
        const data = normalizeAtom(sdkData, id)
        results.push({ id, loading: false, data })
      }
      if (!cancelled) setItems(results)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [ids])

  return (
    <div className="atoms-row">
      {items.map(({ id, loading, data }) => (
        <div key={id} className="atom-card">
          {loading ? (
            <div>Loading…</div>
          ) : (
            <>
              {data?.image ? (
                <img src={data.image} alt={data.name || id} className="atom-image" />
              ) : null}
              <h2 className="atom-title">{data?.name || 'Unnamed Atom'}</h2>
              {data?.description ? <p className="atom-desc">{data.description}</p> : null}
              <div className="atom-meta">
                {data?.positionsCount !== undefined ? `${data.positionsCount} positions` : '—'}
              </div>
              <button
                className="join-btn"
                onClick={() => {
                  setJoinGuild({ id, name: data?.name || id, image: data?.image })
                  setJoinOpen(true)
                }}
              >
                Join Guild
              </button>
            </>
          )}
        </div>
      ))}
      {joinGuild ? (
        <JoinGuildDialog open={joinOpen} onClose={() => setJoinOpen(false)} guild={joinGuild} />
      ) : null}
    </div>
  )
}

