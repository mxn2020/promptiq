import { useQuery, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    Play, Zap, Clock, Star, ArrowLeft, FileText, Sparkles,
    Layers, Package, Users, ChevronRight, AlertCircle, CheckCircle
} from 'lucide-react'

const TYPE_LABELS: Record<string, { label: string; icon: typeof FileText }> = {
    simple_prompt: { label: 'Simple Prompt', icon: FileText },
    advanced_prompt: { label: 'Advanced Prompt', icon: Sparkles },
    workflow: { label: 'Workflow', icon: Layers },
    template_pack: { label: 'Template Pack', icon: Package },
}

export default function RunPromptPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const detail = useQuery(api.marketplace.getListingDetail, id ? { listingId: id as any } : 'skip')
    const credits = useQuery(api.credits.getBalance)
    const runPrompt = useAction(api.execution.run)

    const [input, setInput] = useState('')
    const [running, setRunning] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    if (!detail) {
        return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>Loading...</div>
    }

    const { listing, reviews } = detail
    const typeInfo = TYPE_LABELS[listing.type] || TYPE_LABELS.simple_prompt
    const TypeIcon = typeInfo.icon
    const canRun = credits && credits.balance >= listing.pricePerRun

    const handleRun = async () => {
        if (!id || !input) return
        setRunning(true)
        setError(null)
        try {
            const res = await runPrompt({ listingId: id as any, input })
            setResult(res)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Run failed')
        }
        setRunning(false)
    }

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
            <button onClick={() => navigate('/marketplace')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <ArrowLeft size={16} /> Back to Marketplace
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
                {/* Main content */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        <TypeIcon size={14} /> {typeInfo.label}
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>{listing.title}</h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{listing.description}</p>

                    {listing.longDescription && (
                        <div style={{ marginBottom: '1.5rem', lineHeight: 1.7, fontSize: '0.9rem' }}>
                            {listing.longDescription}
                        </div>
                    )}

                    {/* Input area */}
                    <div style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', padding: '1.25rem', marginBottom: 16 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Your Input</h3>
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Enter your input here..."
                            maxLength={listing.maxInputLength}
                            rows={6}
                            style={{
                                width: '100%', padding: '12px', borderRadius: 8,
                                border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                                color: 'var(--color-text)', fontSize: '0.9rem', resize: 'vertical',
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            <span>{input.length} / {listing.maxInputLength} characters</span>
                            <span>Max output: {listing.maxOutputLength} chars</span>
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-danger)20', color: 'var(--color-danger)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <button
                        onClick={handleRun}
                        disabled={running || !input || !canRun}
                        style={{
                            width: '100%', padding: '14px', borderRadius: 10,
                            background: canRun ? 'var(--color-accent)' : 'var(--color-border)',
                            color: 'white', border: 'none', cursor: canRun ? 'pointer' : 'not-allowed',
                            fontWeight: 600, fontSize: '1rem', opacity: running ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                        }}
                    >
                        <Play size={18} />
                        {running ? 'Running...' : canRun ? `Run (${listing.pricePerRun} credits)` : 'Insufficient credits'}
                    </button>

                    {/* Result */}
                    {result && (
                        <div style={{ marginTop: 24, background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-success)', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-success)', fontWeight: 600 }}>
                                    <CheckCircle size={16} /> Output
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                    <Clock size={14} style={{ display: 'inline', marginRight: 4 }} /> {result.durationMs}ms
                                </span>
                            </div>
                            <pre style={{
                                background: 'var(--color-surface)', padding: 16, borderRadius: 8,
                                fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.6,
                                maxHeight: 500, overflow: 'auto', color: 'var(--color-text)',
                            }}>
                                {result.output}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>
                    <div style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', padding: '1.25rem' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: 4 }}>
                            <Zap size={20} style={{ display: 'inline', marginRight: 4 }} />
                            {listing.pricePerRun} credits
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>per run</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Total runs</span>
                                <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{listing.totalRuns}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Rating</span>
                                <span style={{ fontWeight: 500, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Star size={13} style={{ color: 'var(--color-warning)' }} />
                                    {listing.averageRating > 0 ? listing.averageRating.toFixed(1) : '—'}
                                    ({listing.reviewCount})
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Your balance</span>
                                <span style={{ fontWeight: 500, color: canRun ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                    {credits?.balance ?? 0} credits
                                </span>
                            </div>
                        </div>

                        {!canRun && (
                            <Link to="/credits" style={{
                                display: 'block', textAlign: 'center', padding: '10px', borderRadius: 8,
                                background: 'var(--color-warning)', color: 'white', textDecoration: 'none',
                                fontWeight: 500, fontSize: '0.85rem', marginTop: 12,
                            }}>
                                Buy Credits
                            </Link>
                        )}
                    </div>

                    {/* Reviews */}
                    {reviews && reviews.length > 0 && (
                        <div style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>Recent Reviews</h3>
                            {reviews.slice(0, 3).map((r: any) => (
                                <div key={r._id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 8, marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <Star key={i} size={12} fill={i < r.rating ? 'var(--color-warning)' : 'none'} color={i < r.rating ? 'var(--color-warning)' : 'var(--color-border)'} />
                                        ))}
                                    </div>
                                    {r.body && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{r.body}</p>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tags */}
                    {listing.tags?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {listing.tags.map((tag: string) => (
                                <span key={tag} style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
