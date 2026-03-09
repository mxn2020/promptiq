import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthGuard, RedirectIfAuth } from './components/AuthGuard'
import { SubscriptionGuard } from './components/SubscriptionGuard'
import CookieBanner from './components/CookieBanner'
import LandingPage from './pages/LandingPage'
import AppHome from './pages/AppHome'
import LoginPage from './pages/LoginPage'
import PricingPage from './pages/PricingPage'
import HelpPage from './pages/HelpPage'
import AdminPage from './pages/AdminPage'
import AdminStripePage from './pages/AdminStripePage'
import AuditLogsPage from './pages/AuditLogsPage'
import SettingsPage from './pages/SettingsPage'
import BillingPage from './pages/BillingPage'
import ModelTestPage from './pages/ModelTestPage'
import NotFoundPage from './pages/NotFoundPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import ProfilePage from './pages/ProfilePage'
import LogsPage from './pages/LogsPage'
// PromptIQ marketplace pages
import MarketplacePage from './pages/MarketplacePage'
import CreatorDashboardPage from './pages/CreatorDashboardPage'
import PromptBuilderPage from './pages/PromptBuilderPage'
import RunPromptPage from './pages/RunPromptPage'
import EarningsPage from './pages/EarningsPage'

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Layout>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/app" element={<AuthGuard><SubscriptionGuard><AppHome /></SubscriptionGuard></AuthGuard>} />
                        <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
                        <Route path="/pricing" element={<PricingPage />} />
                        <Route path="/help" element={<HelpPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
                        <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
                        <Route path="/billing" element={<AuthGuard><BillingPage /></AuthGuard>} />
                        {/* Marketplace — public browse */}
                        <Route path="/marketplace" element={<MarketplacePage />} />
                        <Route path="/marketplace/:id" element={<RunPromptPage />} />
                        {/* Creator routes — authenticated */}
                        <Route path="/creator" element={<AuthGuard><CreatorDashboardPage /></AuthGuard>} />
                        <Route path="/creator/new" element={<AuthGuard><PromptBuilderPage /></AuthGuard>} />
                        <Route path="/creator/earnings" element={<AuthGuard><EarningsPage /></AuthGuard>} />
                        {/* Admin routes */}
                        <Route path="/admin" element={<AuthGuard><SubscriptionGuard><AdminPage /></SubscriptionGuard></AuthGuard>} />
                        <Route path="/admin/stripe" element={<AuthGuard><SubscriptionGuard><AdminStripePage /></SubscriptionGuard></AuthGuard>} />
                        <Route path="/audit-logs" element={<AuthGuard><SubscriptionGuard><AuditLogsPage /></SubscriptionGuard></AuthGuard>} />
                        <Route path="/model-tests" element={<AuthGuard><SubscriptionGuard><ModelTestPage /></SubscriptionGuard></AuthGuard>} />
                        <Route path="/logs" element={<AuthGuard><SubscriptionGuard><LogsPage /></SubscriptionGuard></AuthGuard>} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                    <CookieBanner />
                    <Toaster position="bottom-right" />
                </Layout>
            </BrowserRouter>
        </ErrorBoundary>
    )
}

export default App
