import { useEffect, useMemo, useState } from 'react'
import { useAccount, useBalance, useWalletClient, usePublicClient } from 'wagmi'
import { parseEther, getAddress } from 'viem'
import {
  getMultiVaultAddressFromChainId,
  findAtomIds,
  createAtomFromSmartContract,
  createTripleStatement,
  getTripleCost,
} from '@0xintuition/sdk'
import './JoinGuildDialog.css'

type JoinGuildDialogProps = {
  open: boolean
  onClose: () => void
  guild: {
    id: string
    name: string
    image?: string
  }
}

const PRESETS = [
  { key: 'min', label: 'Minimum', amount: 1 },
  { key: 'default', label: 'Default', amount: 5 },
  { key: 'strong', label: 'Strong', amount: 10 },
  { key: 'custom', label: 'Custom', amount: undefined },
] as const

export default function JoinGuildDialog({ open, onClose, guild }: JoinGuildDialogProps) {
  const { address, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { data: bal } = useBalance({
    address,
    chainId,
    unit: 'ether',
    query: { enabled: !!address },
  })

  const IS_MEMBER_OF_TERM_ID = '0x72b43d4202fe2070725a41e4ff1c83def872b3befadc0627edcc23ffa11b1c66'

  const [mode, setMode] = useState<(typeof PRESETS)[number]['key']>('default')
  const [custom, setCustom] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const amount = useMemo(() => {
    const preset = PRESETS.find((p) => p.key === mode)
    if (!preset) return 0
    if (preset.key === 'custom') return Number(custom || 0)
    return preset.amount ?? 0
  }, [mode, custom])

  useEffect(() => {
    if (!open) {
      setMode('default')
      setCustom('')
    }
  }, [open])

  if (!open) return null

  return (
    <div className="jg-overlay" onClick={onClose}>
      <div className="jg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="jg-header">
          <div className="jg-title">Join Guild</div>
          <div className="jg-wallet">
            <span className="jg-wallet-icon" />
            {bal ? `${Number(bal.formatted).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${bal.symbol || 'TRUST'}` : '— TRUST'}
          </div>
        </div>

        <div className="jg-subtitle">Stake to join and signal membership strength.</div>

        <div className="jg-statement">
          <div className="jg-chip">0xYou</div>
          <div className="jg-chip jg-chip-muted">is a member of</div>
          <div className="jg-guild">
            {guild.image ? <img src={guild.image} alt={guild.name} /> : <div className="jg-guild-placeholder" />}
            <span>{guild.name || guild.id}</span>
          </div>
        </div>

        <div className="jg-active">
          <div className="jg-active-label">Your Active Position</div>
          <div className="jg-active-value">0 TRUST</div>
        </div>

        <div className="jg-options">
          {PRESETS.map((p) => (
            <label key={p.key} className={`jg-option ${mode === p.key ? 'selected' : ''}`}>
              <input
                type="radio"
                name="stake"
                checked={mode === p.key}
                onChange={() => setMode(p.key)}
              />
              <div className="jg-option-main">
                <div className="jg-option-label">{p.label}</div>
                <div className="jg-option-amount">
                  {p.amount !== undefined ? `+${p.amount} TRUST` : 'Enter a custom amount'}
                </div>
              </div>
            </label>
          ))}
          {mode === 'custom' ? (
            <div className="jg-custom">
              <input
                className="jg-input"
                placeholder="0.00"
                inputMode="decimal"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
              <div className="jg-input-suffix">TRUST</div>
            </div>
          ) : null}
        </div>

        <div className="jg-footer">
          <button className="jg-cancel" onClick={onClose}>Cancel</button>
          <button
            className="jg-primary"
            onClick={async () => {
              if (!address || !guild?.id || !walletClient || !publicClient) return
              setSubmitting(true)
              setError(null)
              try {
                const activeChainId = walletClient.chain?.id ?? chainId ?? 1155
                const multiVault = getMultiVaultAddressFromChainId(activeChainId)
                // Ensure account atom exists and get its term id
                const checksum = getAddress(address)
                const subjectCandidates = [
                  `caip10:eip155:${activeChainId}:${checksum}`,
                  checksum,
                ]
                let subjectTermId: `0x${string}` | undefined
                const found = await findAtomIds(subjectCandidates)
                if (Array.isArray(found) && found.length > 0) {
                  subjectTermId = (found[0].term_id ?? found[0].termId) as `0x${string}`
                }
                if (!subjectTermId) {
                  try {
                    const created = await createAtomFromSmartContract(
                      { walletClient, publicClient, address: multiVault },
                      { address: checksum, chainId: activeChainId },
                      0n,
                    )
                    subjectTermId =
                      (created?.state?.termId as `0x${string}` | undefined) ||
                      (created?.state?.term_id as `0x${string}` | undefined)
                  } catch (err: any) {
                    // If atom already exists, resolve again via search
                    const exists = await findAtomIds(subjectCandidates)
                    if (Array.isArray(exists) && exists.length > 0) {
                      subjectTermId = (exists[0].term_id ?? exists[0].termId) as `0x${string}`
                    } else {
                      throw err
                    }
                  }
                }
                if (!subjectTermId) throw new Error('Could not resolve subject term id')
                const tripleCost = await getTripleCost({ address: multiVault, publicClient })
                const stakeWei = parseEther(String(amount))
                const total = tripleCost + stakeWei
                await createTripleStatement(
                  { walletClient, publicClient, address: multiVault },
                  {
                    args: [
                      [subjectTermId] as [`0x${string}`[]],
                      [IS_MEMBER_OF_TERM_ID as `0x${string}`] as [`0x${string}`[]],
                      [guild.id as `0x${string}`] as [`0x${string}`[]],
                      [total] as [bigint[]] as unknown as bigint[], // will be passed through by viem
                    ] as unknown as any,
                    value: total,
                  },
                )
                onClose()
              } catch (e: any) {
                console.error(e)
                setError(e?.message ?? 'Failed to submit transaction')
              } finally {
                setSubmitting(false)
              }
            }}
            disabled={submitting || !address || Number.isNaN(amount) || amount <= 0}
          >
            {submitting ? 'Joining…' : 'Join'}
          </button>
        </div>
        {error ? <div className="jg-error">{error}</div> : null}
      </div>
    </div>
  )
}

