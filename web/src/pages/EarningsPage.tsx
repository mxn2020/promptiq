import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useState } from 'react'
import {
    DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
    Clock, CreditCard, CheckCircle, AlertCircle, Zap
} from 'lucide-react'

export default function EarningsPage() {
    const credits = useQuery(api.credits.getBalance)
    const transactions = useQuery(api.credits.getTransactions, { limit: 30 })
    const payouts = useQuery(api.credits.getPayouts)
    const requestPayout = useMutation(api.credits.requestPayout)

    const [payoutAmount, setPayoutAmount] = useState('')
    const [requesting, setRequesting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handlePayout = async () => {
        const amount = parseFloat(payoutAmount)
        if (!amount || amount <= 0) return
        setRequesting(true)
        setError(null)
        try {
            await requestPayout({ amount })
            setPayoutAmount('')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Payout request failed')
        }
        setRequesting(false)
    }

    const TYPE_ICONS: Record<string, { icon: typeof DollarSign; color: string }> = {
        purchase: { icon: ArrowDownRight, color: 'var(--color-success)' },
        spend: { icon: ArrowUpRight, color: 'var(--color-danger)' },
        earning: { icon: TrendingUp, color: 'var(--color-success)' },
        payout: { icon: CreditCard, color: 'var(--color-warning)' },
        refund: { icon: ArrowDownRight, color: 'var(--color-info)' },
        bonus: { icon: Zap, color: 'var(--color-accent)' },
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem' }}>Earnings & Credits</h1>

            {/* Balance cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: '2rem' }}>
                {[
                    { label: 'Balance', value: credits?.balance ?? 0, icon: DollarSign, color: 'var(--color-accent)' },
                    { label: 'Total Earned', value: credits?.totalEarned ?? 0, icon: TrendingUp, color: 'var(--color-success)' },
                    { label: 'Total Spent', value: credits?.totalSpent ?? 0, icon: ArrowUpRight, color: 'var(--color-danger)' },
                    { label: 'Purchased', value: credits?.totalPurchased ?? 0, icon: CreditCard, color: 'var(--color-info)' },
                ].map(stat => (
                    <div key={stat.label} style={{
                        background: 'var(--color-card)', borderRadius: 12, padding: '1.25rem',
                        border: '1px solid var(--color-border)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                            <stat.icon size={14} style={{ color: stat.color }} /> {stat.label}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value.toLocaleString()}</div>
                    </div>
                ))}
            </div>

            {/* Payout request */}
            <div style={{
                background: 'var(--color-card)', borderRadius: 12, padding: '1.25rem',
                border: '1px solid var(--color-border)', marginBottom: '2rem',
            }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Request Payout</h3>
                {error && (
                    <div style={{ padding: 8, borderRadius: 6, background: 'var(--color-danger)20', color: 'var(--color-danger)', marginBottom: 12, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertCircle size={14} /> {error}
                    </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="number" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)}
                        placeholder="Amount (credits)" min={1}
                        style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                    <button onClick={handlePayout} disabled={requesting || !payoutAmount}
                        style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, opacity: requesting ? 0.6 : 1 }}>
                        {requesting ? 'Requesting...' : 'Request'}
                    </button>
                </div>
            </div>

            {/* Payout history */}
            {payouts && payouts.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Payout History</h3>
                    {payouts.map((p: any) => (
                        <div key={p._id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 16px', background: 'var(--color-card)', borderRadius: 8,
                            border: '1px solid var(--color-border)', marginBottom: 8,
                        }}>
                            <span style={{ fontWeight: 500 }}>{p.amount} credits</span>
                            <span style={{
                                fontSize: '0.75rem', padding: '2px 8px', borderRadius: 6,
                                background: p.status === 'completed' ? 'var(--color-success)20' : 'var(--color-warning)20',
                                color: p.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)',
                                textTransform: 'capitalize',
                            }}>
                                {p.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Transaction history */}
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Recent Transactions</h3>
            {transactions && transactions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {transactions.map((tx: any) => {
                        const info = TYPE_ICONS[tx.type] || TYPE_ICONS.purchase
                        const TxIcon = info.icon
                        return (
                            <div key={tx._id} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 16px', background: 'var(--color-card)', borderRadius: 8,
                                border: '1px solid var(--color-border)',
                            }}>
                                <TxIcon size={16} style={{ color: info.color, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{tx.description}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                        {new Date(tx.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <span style={{
                                    fontWeight: 600, fontSize: '0.9rem',
                                    color: tx.amount > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                                }}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </span>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>No transactions yet</p>
            )}
        </div>
    )
}
