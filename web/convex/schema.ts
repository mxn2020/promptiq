import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
    ...authTables,

    // ── User Profiles ────────────────────────────────────────────
    userProfiles: defineTable({
        userId: v.string(),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        role: v.union(v.literal("admin"), v.literal("creator"), v.literal("consumer")),
        bio: v.optional(v.string()),
        stripeAccountId: v.optional(v.string()),     // Stripe Connect for creators
        stripeOnboarded: v.optional(v.boolean()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_role", ["role"]),

    // ── Subscription Plans ───────────────────────────────────────
    subscriptionPlans: defineTable({
        name: v.string(),
        stripePriceId: v.string(),
        price: v.number(),
        interval: v.union(v.literal("month"), v.literal("year")),
        features: v.array(v.string()),
        isActive: v.boolean(),
        sortOrder: v.number(),
    })
        .index("by_name", ["name"])
        .index("by_isActive", ["isActive", "sortOrder"]),

    // ── Categories ───────────────────────────────────────────────
    categories: defineTable({
        name: v.string(),
        slug: v.string(),
        description: v.string(),
        icon: v.optional(v.string()),
        parentId: v.optional(v.id("categories")),
        sortOrder: v.number(),
        isActive: v.boolean(),
    })
        .index("by_slug", ["slug"])
        .index("by_parentId", ["parentId"])
        .index("by_isActive", ["isActive", "sortOrder"]),

    // ── Listings ─────────────────────────────────────────────────
    // A listing is a published prompt/workflow on the marketplace.
    listings: defineTable({
        creatorId: v.string(),
        title: v.string(),
        slug: v.string(),
        description: v.string(),
        longDescription: v.optional(v.string()),
        type: v.union(
            v.literal("simple_prompt"),
            v.literal("advanced_prompt"),
            v.literal("workflow"),
            v.literal("template_pack")
        ),
        categoryId: v.optional(v.id("categories")),
        tags: v.array(v.string()),
        // Pricing
        pricePerRun: v.number(),           // Credits charged per run
        // Limits
        maxInputLength: v.number(),        // Max characters for user input
        maxOutputLength: v.number(),       // Max characters for output
        // Stats
        totalRuns: v.number(),
        totalRevenue: v.number(),
        averageRating: v.number(),
        reviewCount: v.number(),
        // Status
        status: v.union(
            v.literal("draft"),
            v.literal("pending_review"),
            v.literal("published"),
            v.literal("suspended"),
            v.literal("archived")
        ),
        isFeatured: v.boolean(),
        // Versioning
        currentVersion: v.number(),
        // Timestamps
        publishedAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_creatorId", ["creatorId"])
        .index("by_slug", ["slug"])
        .index("by_status", ["status"])
        .index("by_categoryId", ["categoryId", "status"])
        .index("by_type", ["type", "status"])
        .index("by_featured", ["isFeatured", "status"])
        .searchIndex("search_listings", {
            searchField: "title",
            filterFields: ["status", "type", "categoryId"],
        }),

    // ── Prompt Configs ───────────────────────────────────────────
    // The actual prompt configuration for a listing.
    promptConfigs: defineTable({
        listingId: v.id("listings"),
        version: v.number(),
        // Prompt setup
        systemPrompt: v.string(),
        userPromptTemplate: v.optional(v.string()),   // Template with {{input}} placeholder
        // Few-shot examples (for advanced prompts)
        examples: v.optional(v.array(v.object({
            input: v.string(),
            output: v.string(),
        }))),
        // Output structure
        outputFormat: v.union(
            v.literal("text"),
            v.literal("json"),
            v.literal("markdown"),
            v.literal("csv"),
            v.literal("code")
        ),
        outputSchema: v.optional(v.string()),         // JSON schema for structured output
        // Model config
        model: v.string(),
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        topP: v.optional(v.number()),
        // Test results
        exampleInput: v.optional(v.string()),
        exampleOutput: v.optional(v.string()),
        avgTokensInput: v.optional(v.number()),
        avgTokensOutput: v.optional(v.number()),
        // Timestamps
        createdAt: v.number(),
    })
        .index("by_listingId", ["listingId", "version"]),

    // ── Workflow Steps ────────────────────────────────────────────
    // For workflow-type listings: ordered chain of prompt steps.
    workflowSteps: defineTable({
        listingId: v.id("listings"),
        version: v.number(),
        order: v.number(),
        name: v.string(),
        description: v.optional(v.string()),
        // Step config
        systemPrompt: v.string(),
        inputMapping: v.union(
            v.literal("user_input"),        // Takes user's original input
            v.literal("previous_output"),   // Takes previous step's output
            v.literal("combined")           // Combines user input + previous output
        ),
        outputFormat: v.union(
            v.literal("text"), v.literal("json"), v.literal("markdown"),
            v.literal("csv"), v.literal("code")
        ),
        model: v.string(),
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        createdAt: v.number(),
    })
        .index("by_listingId", ["listingId", "version", "order"]),

    // ── Purchases / Runs ─────────────────────────────────────────
    // Tracks every execution of a listing.
    runs: defineTable({
        listingId: v.id("listings"),
        consumerId: v.string(),
        creatorId: v.string(),
        // Input & Output
        input: v.string(),
        output: v.optional(v.string()),
        // Token usage
        inputTokens: v.optional(v.number()),
        outputTokens: v.optional(v.number()),
        totalTokens: v.optional(v.number()),
        // Cost breakdown
        tokenCost: v.optional(v.number()),       // Raw API cost
        totalCharged: v.number(),                 // Credits charged to consumer
        creatorEarning: v.number(),               // 70% of profit
        platformEarning: v.number(),              // 30% of profit
        // Status
        status: v.union(
            v.literal("pending"),
            v.literal("running"),
            v.literal("completed"),
            v.literal("failed"),
            v.literal("refunded")
        ),
        errorMessage: v.optional(v.string()),
        durationMs: v.optional(v.number()),
        // Timestamps
        createdAt: v.number(),
        completedAt: v.optional(v.number()),
    })
        .index("by_consumerId", ["consumerId", "createdAt"])
        .index("by_creatorId", ["creatorId", "createdAt"])
        .index("by_listingId", ["listingId", "createdAt"])
        .index("by_status", ["status"]),

    // ── Credits ──────────────────────────────────────────────────
    credits: defineTable({
        userId: v.string(),
        balance: v.number(),
        totalPurchased: v.number(),
        totalSpent: v.number(),
        totalEarned: v.number(),            // For creators
        updatedAt: v.number(),
    })
        .index("by_userId", ["userId"]),

    // ── Credit Transactions ──────────────────────────────────────
    creditTransactions: defineTable({
        userId: v.string(),
        type: v.union(
            v.literal("purchase"),          // Bought credits via Stripe
            v.literal("spend"),             // Spent on running a prompt
            v.literal("earning"),           // Earned from a sale
            v.literal("payout"),            // Withdrew to bank
            v.literal("refund"),            // Refunded credits
            v.literal("bonus")             // Admin bonus
        ),
        amount: v.number(),                 // Positive for adds, negative for debits
        balanceAfter: v.number(),
        description: v.string(),
        referenceId: v.optional(v.string()), // runId, stripeSessionId, payoutId, etc.
        createdAt: v.number(),
    })
        .index("by_userId", ["userId", "createdAt"])
        .index("by_type", ["type", "createdAt"]),

    // ── Payouts ──────────────────────────────────────────────────
    payouts: defineTable({
        creatorId: v.string(),
        amount: v.number(),
        status: v.union(
            v.literal("pending"),
            v.literal("processing"),
            v.literal("completed"),
            v.literal("failed")
        ),
        stripeTransferId: v.optional(v.string()),
        processedAt: v.optional(v.number()),
        createdAt: v.number(),
    })
        .index("by_creatorId", ["creatorId", "createdAt"])
        .index("by_status", ["status"]),

    // ── Reviews ──────────────────────────────────────────────────
    reviews: defineTable({
        listingId: v.id("listings"),
        consumerId: v.string(),
        rating: v.number(),                 // 1-5
        title: v.optional(v.string()),
        body: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_listingId", ["listingId"])
        .index("by_consumerId", ["consumerId"]),

    // ── AI Call Logs ─────────────────────────────────────────────
    aiLogs: defineTable({
        requestId: v.string(),
        model: v.string(),
        caller: v.string(),
        timestamp: v.number(),
        durationMs: v.number(),
        systemPrompt: v.string(),
        userPromptText: v.string(),
        hasImage: v.boolean(),
        imageSizeBytes: v.optional(v.number()),
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        requestBodySize: v.number(),
        status: v.union(v.literal("success"), v.literal("error")),
        httpStatus: v.number(),
        responseContent: v.string(),
        responseSize: v.number(),
        finishReason: v.optional(v.string()),
        promptTokens: v.optional(v.number()),
        completionTokens: v.optional(v.number()),
        totalTokens: v.optional(v.number()),
        errorMessage: v.optional(v.string()),
        inputCostUsd: v.optional(v.number()),
        outputCostUsd: v.optional(v.number()),
        totalCostUsd: v.optional(v.number()),
    })
        .index("by_timestamp", ["timestamp"])
        .index("by_model", ["model"])
        .index("by_caller", ["caller"])
        .index("by_status", ["status"]),

    // ── Dev Logs ─────────────────────────────────────────────────
    devLogs: defineTable({
        level: v.union(v.literal("debug"), v.literal("info"), v.literal("warn"), v.literal("error")),
        message: v.string(),
        context: v.optional(v.string()),
        component: v.string(),
        timestamp: v.number(),
        userId: v.optional(v.string()),
        metadata: v.optional(v.string()),
    })
        .index("by_timestamp", ["timestamp"])
        .index("by_level_timestamp", ["level", "timestamp"])
        .index("by_component", ["component", "timestamp"]),

    // ── Audit Logs ───────────────────────────────────────────────
    auditLogs: defineTable({
        userId: v.string(),
        action: v.string(),
        target: v.string(),
        targetId: v.optional(v.string()),
        details: v.optional(v.string()),
        timestamp: v.number(),
    })
        .index("by_timestamp", ["timestamp"])
        .index("by_userId", ["userId", "timestamp"]),

    // ── Model Costs ──────────────────────────────────────────────
    modelCosts: defineTable({
        model: v.string(),
        provider: v.string(),
        inputCostPer1k: v.number(),
        outputCostPer1k: v.number(),
        isActive: v.boolean(),
        updatedAt: v.number(),
    })
        .index("by_model", ["model"]),

    // ── Model Tests ──────────────────────────────────────────────
    modelTests: defineTable({
        model: v.string(),
        prompt: v.string(),
        expectedOutput: v.optional(v.string()),
        actualOutput: v.optional(v.string()),
        status: v.union(v.literal("pending"), v.literal("running"), v.literal("passed"), v.literal("failed")),
        durationMs: v.optional(v.number()),
        createdAt: v.number(),
    })
        .index("by_model", ["model"])
        .index("by_status", ["status"]),

    // ── Rate Limits ──────────────────────────────────────────────
    rateLimits: defineTable({
        key: v.string(),
        tokens: v.number(),
        lastRefill: v.number(),
    }).index("by_key", ["key"]),

    // ── Usage Limits ─────────────────────────────────────────────
    usageLimits: defineTable({
        userId: v.string(),
        period: v.string(),
        requestCount: v.number(),
        tokenCount: v.number(),
        lastReset: v.number(),
    }).index("by_userId_period", ["userId", "period"]),
});
