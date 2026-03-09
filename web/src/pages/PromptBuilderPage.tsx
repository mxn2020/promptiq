import { useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    FileText, Sparkles, Layers, Package, Save, Play,
    Zap, Clock, ChevronDown, Settings, ArrowRight, CheckCircle, AlertCircle
} from 'lucide-react'

const MODELS = [
    { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', tier: 'Standard' },
    { id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', tier: 'Premium' },
    { id: 'mistralai/mixtral-8x7b-instruct-v0.1', name: 'Mixtral 8x7B', tier: 'Standard' },
    { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B', tier: 'Standard' },
]

const TYPES = [
    { value: 'simple_prompt', label: 'Simple Prompt', icon: FileText, desc: 'Single system prompt with user input' },
    { value: 'advanced_prompt', label: 'Advanced Prompt', icon: Sparkles, desc: 'System prompt + examples + output schema' },
    { value: 'workflow', label: 'Workflow', icon: Layers, desc: 'Multi-step processing chain' },
    { value: 'template_pack', label: 'Template Pack', icon: Package, desc: 'Bundle of related prompts' },
]

export default function PromptBuilderPage() {
    const navigate = useNavigate()
    const createListing = useMutation(api.listings.create)
    const saveConfig = useMutation(api.listings.savePromptConfig)
    const testPrompt = useAction(api.execution.testPrompt)

    // Step 1: Basic info
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState('simple_prompt')
    const [pricePerRun, setPricePerRun] = useState(10)
    const [maxInputLength, setMaxInputLength] = useState(2000)
    const [maxOutputLength, setMaxOutputLength] = useState(4000)
    const [tags, setTags] = useState('')

    // Step 2: Prompt config
    const [systemPrompt, setSystemPrompt] = useState('')
    const [userTemplate, setUserTemplate] = useState('')
    const [outputFormat, setOutputFormat] = useState<'text' | 'json' | 'markdown' | 'csv' | 'code'>('text')
    const [model, setModel] = useState(MODELS[0].id)
    const [temperature, setTemperature] = useState(0.7)
    const [maxTokens, setMaxTokens] = useState(1024)

    // Step 3: Test
    const [testInput, setTestInput] = useState('')
    const [testResult, setTestResult] = useState<any>(null)
    const [testing, setTesting] = useState(false)

    const [step, setStep] = useState(1)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleTest = async () => {
        if (!systemPrompt || !testInput) return
        setTesting(true)
        setError(null)
        try {
            const result = await testPrompt({
                systemPrompt,
                userInput: testInput,
                model,
                temperature,
                maxTokens,
            })
            setTestResult(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Test failed')
        }
        setTesting(false)
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        try {
            const listingId = await createListing({
                title,
                description,
                type: type as any,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                pricePerRun,
                maxInputLength,
                maxOutputLength,
            })

            await saveConfig({
                listingId,
                systemPrompt,
                userPromptTemplate: userTemplate || undefined,
                outputFormat,
                model,
                temperature,
                maxTokens,
                exampleInput: testInput || undefined,
                exampleOutput: testResult?.output || undefined,
            })

            navigate('/creator')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Save failed')
        }
        setSaving(false)
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Create New Listing</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>Build and test your AI prompt before publishing</p>

            {/* Step indicator */}
            <div style={{ display: 'flex', gap: 4, marginBottom: '2rem' }}>
                {['Details', 'Configure', 'Test & Save'].map((label, i) => (
                    <div key={i} style={{ flex: 1 }}>
                        <div style={{
                            height: 4, borderRadius: 2, marginBottom: 6,
                            background: step > i ? 'var(--color-accent)' : step === i + 1 ? 'var(--color-accent)' : 'var(--color-border)',
                            opacity: step === i + 1 ? 1 : step > i + 1 ? 0.6 : 0.3,
                        }} />
                        <span style={{ fontSize: '0.75rem', color: step >= i + 1 ? 'var(--color-text)' : 'var(--color-text-secondary)' }}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>

            {error && (
                <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-danger)20', color: 'var(--color-danger)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                        {TYPES.map(t => (
                            <button
                                key={t.value}
                                onClick={() => setType(t.value)}
                                style={{
                                    padding: '1rem', borderRadius: 10, textAlign: 'left',
                                    border: type === t.value ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                                    background: type === t.value ? 'var(--color-accent)10' : 'var(--color-surface)',
                                    cursor: 'pointer',
                                }}
                            >
                                <t.icon size={20} style={{ color: 'var(--color-accent)', marginBottom: 4 }} />
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.label}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.desc}</div>
                            </button>
                        ))}
                    </div>

                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        Title
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Professional Email Writer"
                            style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.9rem' }} />
                    </label>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        Description
                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this prompt do?"
                            rows={3} style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.9rem', resize: 'vertical' }} />
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            Price (credits)
                            <input type="number" value={pricePerRun} onChange={e => setPricePerRun(+e.target.value)} min={1}
                                style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
                        </label>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            Max Input (chars)
                            <input type="number" value={maxInputLength} onChange={e => setMaxInputLength(+e.target.value)}
                                style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
                        </label>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            Max Output (chars)
                            <input type="number" value={maxOutputLength} onChange={e => setMaxOutputLength(+e.target.value)}
                                style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
                        </label>
                    </div>

                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        Tags (comma-separated)
                        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="writing, email, business"
                            style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
                    </label>

                    <button onClick={() => setStep(2)} disabled={!title || !description}
                        style={{ padding: '12px 24px', borderRadius: 10, background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        Next: Configure Prompt <ArrowRight size={16} />
                    </button>
                </div>
            )}

            {/* Step 2: Prompt Configuration */}
            {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        System Prompt
                        <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                            placeholder="You are an expert... Provide structured output..."
                            rows={6} style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'monospace' }} />
                    </label>

                    <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        User Prompt Template <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional — use {'{{input}}'} placeholder)</span>
                        <textarea value={userTemplate} onChange={e => setUserTemplate(e.target.value)}
                            placeholder="Analyze the following: {{input}}"
                            rows={3} style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'monospace' }} />
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            Model
                            <select value={model} onChange={e => setModel(e.target.value)}
                                style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                                {MODELS.map(m => <option key={m.id} value={m.id}>{m.name} ({m.tier})</option>)}
                            </select>
                        </label>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            Output Format
                            <select value={outputFormat} onChange={e => setOutputFormat(e.target.value as any)}
                                style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                                {['text', 'json', 'markdown', 'csv', 'code'].map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                            </select>
                        </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            Temperature ({temperature})
                            <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={e => setTemperature(+e.target.value)}
                                style={{ display: 'block', width: '100%', marginTop: 8 }} />
                        </label>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            Max Tokens
                            <input type="number" value={maxTokens} onChange={e => setMaxTokens(+e.target.value)} min={64} max={4096}
                                style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setStep(1)} style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 500 }}>
                            Back
                        </button>
                        <button onClick={() => setStep(3)} disabled={!systemPrompt}
                            style={{ flex: 1, padding: '12px 24px', borderRadius: 10, background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            Next: Test & Save <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Test & Save */}
            {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', padding: '1.25rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Play size={18} /> Test Your Prompt
                        </h3>
                        <textarea value={testInput} onChange={e => setTestInput(e.target.value)}
                            placeholder="Enter test input..."
                            rows={4} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.9rem', resize: 'vertical', marginBottom: 12 }} />
                        <button onClick={handleTest} disabled={testing || !testInput}
                            style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--color-success)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500, opacity: testing ? 0.6 : 1 }}>
                            {testing ? 'Running...' : 'Run Test'}
                        </button>
                    </div>

                    {testResult && (
                        <div style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-success)', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                <span><Clock size={14} style={{ display: 'inline', marginRight: 4 }} /> {testResult.durationMs}ms</span>
                                <span><Zap size={14} style={{ display: 'inline', marginRight: 4 }} /> ~{testResult.totalTokens} tokens</span>
                            </div>
                            <pre style={{
                                background: 'var(--color-surface)', padding: 12, borderRadius: 8,
                                fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.5,
                                maxHeight: 300, overflow: 'auto', color: 'var(--color-text)',
                            }}>
                                {testResult.output}
                            </pre>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setStep(2)} style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 500 }}>
                            Back
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            style={{ flex: 1, padding: '12px 24px', borderRadius: 10, background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            <Save size={16} /> {saving ? 'Saving...' : 'Save as Draft'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
