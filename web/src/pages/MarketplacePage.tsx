import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Search, Filter, Star, Zap, TrendingUp, Package,
    FileText, Layers, Sparkles, ArrowRight, Clock, Users
} from 'lucide-react'

const TYPE_LABELS: Record<string, { label: string; icon: typeof FileText; color: string }> = {
    simple_prompt: { label: 'Simple Prompt', icon: FileText, color: 'var(--color-success)' },
    advanced_prompt: { label: 'Advanced Prompt', icon: Sparkles, color: 'var(--color-info)' },
    workflow: { label: 'Workflow', icon: Layers, color: 'var(--color-warning)' },
    template_pack: { label: 'Template Pack', icon: Package, color: 'var(--color-accent)' },
}

export default function MarketplacePage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const navigate = useNavigate()

    const featured = useQuery(api.marketplace.getFeatured)
    const trending = useQuery(api.marketplace.getTrending)
    const searchResults = useQuery(
        api.marketplace.search,
        searchQuery.length > 2 ? { query: searchQuery } : 'skip'
    )
    const listings = useQuery(api.marketplace.browse, selectedType ? {
        type: selectedType as any,
    } : {})

    const displayListings = searchQuery.length > 2 ? searchResults : listings

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
            {/* Hero */}
            <div style={{
                textAlign: 'center', padding: '3rem 1rem', marginBottom: '2rem',
                background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-card) 100%)',
                borderRadius: 16, border: '1px solid var(--color-border)',
            }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    <Sparkles style={{ display: 'inline', marginRight: 8, color: 'var(--color-accent)' }} />
                    AI Prompt Marketplace
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                    Discover, buy, and run AI prompts & workflows created by experts
                </p>
                <div style={{
                    display: 'flex', gap: 8, maxWidth: 600, margin: '0 auto',
                    background: 'var(--color-background)', borderRadius: 12,
                    border: '1px solid var(--color-border)', padding: 4,
                }}>
                    <Search style={{ margin: '10px 8px', color: 'var(--color-text-secondary)', flexShrink: 0 }} size={20} />
                    <input
                        type="text"
                        placeholder="Search prompts, workflows, templates..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            fontSize: '1rem', color: 'var(--color-text)',
                        }}
                    />
                </div>
            </div>

            {/* Type filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setSelectedType(null)}
                    style={{
                        padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
                        background: !selectedType ? 'var(--color-accent)' : 'var(--color-surface)',
                        color: !selectedType ? 'white' : 'var(--color-text)',
                        cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                    }}
                >
                    <Filter size={14} style={{ display: 'inline', marginRight: 4 }} /> All
                </button>
                {Object.entries(TYPE_LABELS).map(([key, { label, icon: Icon }]) => (
                    <button
                        key={key}
                        onClick={() => setSelectedType(selectedType === key ? null : key)}
                        style={{
                            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
                            background: selectedType === key ? 'var(--color-accent)' : 'var(--color-surface)',
                            color: selectedType === key ? 'white' : 'var(--color-text)',
                            cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                        }}
                    >
                        <Icon size={14} style={{ display: 'inline', marginRight: 4 }} /> {label}
                    </button>
                ))}
            </div>

            {/* Featured */}
            {!searchQuery && featured && featured.length > 0 && (
                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Star size={20} style={{ color: 'var(--color-warning)' }} /> Featured
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {featured.map(listing => (
                            <ListingCard key={listing._id} listing={listing} onClick={() => navigate(`/marketplace/${listing._id}`)} />
                        ))}
                    </div>
                </section>
            )}

            {/* Trending */}
            {!searchQuery && trending && trending.length > 0 && (
                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrendingUp size={20} style={{ color: 'var(--color-success)' }} /> Trending
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {trending.slice(0, 6).map(listing => (
                            <ListingCard key={listing._id} listing={listing} onClick={() => navigate(`/marketplace/${listing._id}`)} />
                        ))}
                    </div>
                </section>
            )}

            {/* All / Search results */}
            <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                    {searchQuery ? `Results for "${searchQuery}"` : 'Browse All'}
                </h2>
                {displayListings && displayListings.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {displayListings.map(listing => (
                            <ListingCard key={listing._id} listing={listing} onClick={() => navigate(`/marketplace/${listing._id}`)} />
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-secondary)' }}>
                        <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p>No listings found. {searchQuery ? 'Try a different search.' : 'Be the first to create one!'}</p>
                    </div>
                )}
            </section>
        </div>
    )
}

function ListingCard({ listing, onClick }: { listing: any; onClick: () => void }) {
    const typeInfo = TYPE_LABELS[listing.type] || TYPE_LABELS.simple_prompt
    const TypeIcon = typeInfo.icon

    return (
        <div
            onClick={onClick}
            style={{
                background: 'var(--color-card)', borderRadius: 12,
                border: '1px solid var(--color-border)', padding: '1.25rem',
                cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem',
                    padding: '2px 8px', borderRadius: 6, background: typeInfo.color + '20', color: typeInfo.color,
                }}>
                    <TypeIcon size={12} /> {typeInfo.label}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '0.9rem' }}>
                    <Zap size={14} style={{ display: 'inline', marginRight: 2 }} />
                    {listing.pricePerRun} credits
                </span>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
                {listing.title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
                {listing.description.substring(0, 100)}{listing.description.length > 100 ? '...' : ''}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={13} style={{ color: listing.averageRating > 0 ? 'var(--color-warning)' : 'inherit' }} />
                    {listing.averageRating > 0 ? listing.averageRating.toFixed(1) : '—'}
                    <span style={{ marginLeft: 4 }}>({listing.reviewCount})</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={13} /> {listing.totalRuns} runs
                </span>
                <ArrowRight size={16} style={{ color: 'var(--color-accent)' }} />
            </div>
        </div>
    )
}
