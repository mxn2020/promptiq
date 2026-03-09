import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Plus, FileText, Sparkles, Layers, Package, MoreVertical,
    Trash2, Eye, Edit, TrendingUp, DollarSign, Zap, Star, Clock
} from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
    simple_prompt: 'Simple Prompt',
    advanced_prompt: 'Advanced Prompt',
    workflow: 'Workflow',
    template_pack: 'Template Pack',
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'var(--color-text-secondary)',
    pending_review: 'var(--color-warning)',
    published: 'var(--color-success)',
    suspended: 'var(--color-danger)',
    archived: 'var(--color-text-secondary)',
}

export default function CreatorDashboardPage() {
    const listings = useQuery(api.listings.getMyListings)
    const navigate = useNavigate()
    const deleteListing = useMutation(api.listings.deleteListing)
    const [filter, setFilter] = useState<string>('all')

    const filteredListings = listings?.filter(
        l => filter === 'all' || l.status === filter
    ) ?? []

    const totalRevenue = listings?.reduce((sum, l) => sum + l.totalRevenue, 0) ?? 0
    const totalRuns = listings?.reduce((sum, l) => sum + l.totalRuns, 0) ?? 0
    const publishedCount = listings?.filter(l => l.status === 'published').length ?? 0

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Creator Dashboard</h1>
                <button
                    onClick={() => navigate('/creator/new')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                        background: 'var(--color-accent)', color: 'white', borderRadius: 10,
                        border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                    }}
                >
                    <Plus size={18} /> New Listing
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: '2rem' }}>
                {[
                    { label: 'Published', value: publishedCount, icon: Eye, color: 'var(--color-success)' },
                    { label: 'Total Runs', value: totalRuns, icon: Zap, color: 'var(--color-info)' },
                    { label: 'Revenue (credits)', value: totalRevenue.toLocaleString(), icon: DollarSign, color: 'var(--color-warning)' },
                    { label: 'Avg Rating', value: listings?.length ? (listings.reduce((s, l) => s + l.averageRating, 0) / listings.length).toFixed(1) : '—', icon: Star, color: 'var(--color-accent)' },
                ].map(stat => (
                    <div key={stat.label} style={{
                        background: 'var(--color-card)', borderRadius: 12, padding: '1.25rem',
                        border: '1px solid var(--color-border)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                            <stat.icon size={16} style={{ color: stat.color }} /> {stat.label}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {['all', 'draft', 'published', 'archived'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '6px 14px', borderRadius: 8, border: '1px solid var(--color-border)',
                            background: filter === f ? 'var(--color-accent)' : 'var(--color-surface)',
                            color: filter === f ? 'white' : 'var(--color-text)',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, textTransform: 'capitalize',
                        }}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Listings table */}
            {filteredListings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                    <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>No listings yet. Create your first prompt!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredListings.map(listing => (
                        <div key={listing._id} style={{
                            background: 'var(--color-card)', borderRadius: 12,
                            border: '1px solid var(--color-border)', padding: '1rem 1.25rem',
                            display: 'flex', alignItems: 'center', gap: 16,
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{listing.title}</h3>
                                    <span style={{
                                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: 6,
                                        background: STATUS_COLORS[listing.status] + '20',
                                        color: STATUS_COLORS[listing.status],
                                        fontWeight: 500, textTransform: 'capitalize',
                                    }}>
                                        {listing.status}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                    {TYPE_LABELS[listing.type]} · {listing.pricePerRun} credits/run
                                </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                <span><Zap size={14} style={{ display: 'inline', marginRight: 4 }} /> {listing.totalRuns}</span>
                                <span><Star size={14} style={{ display: 'inline', marginRight: 4 }} /> {listing.averageRating > 0 ? listing.averageRating.toFixed(1) : '—'}</span>
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={() => navigate(`/creator/edit/${listing._id}`)}
                                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-text)' }}
                                >
                                    <Edit size={14} />
                                </button>
                                {listing.status === 'draft' && (
                                    <button
                                        onClick={() => deleteListing({ listingId: listing._id })}
                                        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-danger)' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
