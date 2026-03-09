import { useNavigate } from 'react-router-dom'
import { Sparkles, Zap, TrendingUp, Shield, Brain } from 'lucide-react'

export default function LandingPage() {
    const navigate = useNavigate()

    return (
        <div className="landing-page">
            <section className="landing-hero">
                <div className="landing-hero__content">
                    <h1 className="landing-hero__title">
                        <Sparkles size={40} style={{ color: 'var(--color-accent)' }} />
                        <span>{"{{ APP_NAME }}"}</span>
                    </h1>
                    <p className="landing-hero__tagline">
                        {"{{ APP_DESCRIPTION }}"}
                    </p>
                    <div className="landing-hero__actions">
                        <button className="btn btn--primary btn--lg" onClick={() => navigate('/app')}>
                            🚀 Get Started Free
                        </button>
                        <button className="btn btn--secondary btn--lg" onClick={() => navigate('/pricing')}>
                            View Plans
                        </button>
                    </div>
                </div>
            </section>

            <section className="landing-features">
                <h2 className="landing-section__title">How It Works</h2>
                <div className="landing-features__grid">
                    <div className="landing-feature">
                        <div className="landing-feature__icon"><Brain size={32} /></div>
                        <h3>AI-Powered</h3>
                        <p>State-of-the-art AI models power every feature of the platform.</p>
                    </div>
                    <div className="landing-feature">
                        <div className="landing-feature__icon"><Zap size={32} /></div>
                        <h3>Lightning Fast</h3>
                        <p>Real-time serverless backend ensures instant responses.</p>
                    </div>
                    <div className="landing-feature">
                        <div className="landing-feature__icon"><TrendingUp size={32} /></div>
                        <h3>Scale With You</h3>
                        <p>From free tier to enterprise — the platform grows with your needs.</p>
                    </div>
                </div>
            </section>

            <section className="landing-features">
                <h2 className="landing-section__title">Enterprise Ready</h2>
                <div className="landing-features__grid">
                    <div className="landing-feature">
                        <Shield size={28} style={{ color: 'var(--color-accent)' }} />
                        <h3>Secure by Default</h3>
                        <p>Authentication, authorization, and audit logging built in.</p>
                    </div>
                    <div className="landing-feature">
                        <Zap size={28} style={{ color: 'var(--color-neon-magenta, #e040fb)' }} />
                        <h3>Rate Limiting</h3>
                        <p>Per-user rate limiting and usage tracking to manage costs.</p>
                    </div>
                    <div className="landing-feature">
                        <TrendingUp size={28} style={{ color: 'var(--color-neon-emerald, #10b981)' }} />
                        <h3>Stripe Billing</h3>
                        <p>Subscription management with Stripe checkout and portal.</p>
                    </div>
                </div>
            </section>

            <section className="landing-cta">
                <h2>Ready to get started?</h2>
                <p>Join today and experience the power of AI.</p>
                <button className="btn btn--primary btn--lg" onClick={() => navigate('/login')}>
                    🚀 Sign Up Free
                </button>
            </section>
        </div>
    )
}
