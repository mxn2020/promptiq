import { action, mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { performNvidiaCall } from "./nvidia";

/**
 * Execute a listing's prompt with user input.
 * Handles credit checking, prompt assembly, AI call, and revenue split.
 */
export const run = action({
    args: {
        listingId: v.id("listings"),
        input: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        const consumerId = identity.subject;

        // 1. Get listing
        const listing = await ctx.runQuery(internal.execution.getListing, { listingId: args.listingId });
        if (!listing || listing.status !== "published") throw new Error("Listing not available");

        // 2. Validate input length
        if (args.input.length > listing.maxInputLength)
            throw new Error(`Input too long. Max ${listing.maxInputLength} characters.`);

        // 3. Check consumer has enough credits
        const credits = await ctx.runQuery(internal.execution.getCredits, { userId: consumerId });
        if (!credits || credits.balance < listing.pricePerRun)
            throw new Error("Insufficient credits");

        // 4. Get prompt config
        const config = await ctx.runQuery(internal.execution.getConfig, { listingId: args.listingId, version: listing.currentVersion });
        if (!config) throw new Error("Listing has no prompt configuration");

        // 5. Create run record
        const creatorEarning = Math.round(listing.pricePerRun * 0.7 * 100) / 100;
        const platformEarning = Math.round(listing.pricePerRun * 0.3 * 100) / 100;

        const runId = await ctx.runMutation(internal.execution.createRun, {
            listingId: args.listingId,
            consumerId,
            creatorId: listing.creatorId,
            input: args.input,
            totalCharged: listing.pricePerRun,
            creatorEarning,
            platformEarning,
        });

        try {
            // 6. Assemble prompt
            const userContent = config.userPromptTemplate
                ? config.userPromptTemplate.replace(/\{\{input\}\}/g, args.input)
                : args.input;

            const messages: { role: "system" | "user"; content: string }[] = [
                { role: "system", content: config.systemPrompt },
            ];

            // Add few-shot examples
            if (config.examples && config.examples.length > 0) {
                for (const ex of config.examples) {
                    messages.push({ role: "user", content: ex.input });
                    messages.push({ role: "system", content: ex.output } as any);
                }
            }

            messages.push({ role: "user", content: userContent });

            // 7. Call AI
            const startTime = Date.now();
            const result = await performNvidiaCall(ctx, {
                model: config.model,
                messages,
                temperature: config.temperature,
                maxTokens: config.maxTokens,
                topP: config.topP,
                caller: `promptiq:${listing.slug}`,
            });
            const durationMs = Date.now() - startTime;

            // 8. Truncate output if needed
            const output = result.substring(0, listing.maxOutputLength);

            // 9. Update run record with result
            await ctx.runMutation(internal.execution.completeRun, {
                runId,
                output,
                durationMs,
            });

            // 10. Debit consumer credits
            await ctx.runMutation(internal.execution.debitCredits, {
                userId: consumerId,
                amount: listing.pricePerRun,
                runId: runId as string,
            });

            // 11. Credit creator earnings
            await ctx.runMutation(internal.execution.creditEarnings, {
                userId: listing.creatorId,
                amount: creatorEarning,
                runId: runId as string,
            });

            // 12. Increment listing stats
            await ctx.runMutation(internal.listings.incrementStats, {
                listingId: args.listingId,
                revenue: listing.pricePerRun,
            });

            return { runId, output, durationMs };
        } catch (err) {
            // Mark run as failed
            await ctx.runMutation(internal.execution.failRun, {
                runId,
                error: err instanceof Error ? err.message : "Unknown error",
            });
            throw err;
        }
    },
});

/**
 * Test a prompt (for creators — no charge).
 */
export const testPrompt = action({
    args: {
        systemPrompt: v.string(),
        userInput: v.string(),
        model: v.string(),
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const startTime = Date.now();
        const result = await performNvidiaCall(ctx, {
            model: args.model,
            messages: [
                { role: "system", content: args.systemPrompt },
                { role: "user", content: args.userInput },
            ],
            temperature: args.temperature,
            maxTokens: args.maxTokens,
            caller: "promptiq:test",
        });
        const durationMs = Date.now() - startTime;

        // Estimate tokens (rough: 1 token ≈ 4 chars)
        const inputTokens = Math.ceil((args.systemPrompt.length + args.userInput.length) / 4);
        const outputTokens = Math.ceil(result.length / 4);

        return {
            output: result,
            durationMs,
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
        };
    },
});

/**
 * Get user's run history.
 */
export const getMyRuns = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("runs")
            .withIndex("by_consumerId", q => q.eq("consumerId", identity.subject))
            .order("desc")
            .take(args.limit ?? 20);
    },
});

/**
 * Get runs for a creator's listings.
 */
export const getCreatorRuns = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("runs")
            .withIndex("by_creatorId", q => q.eq("creatorId", identity.subject))
            .order("desc")
            .take(args.limit ?? 20);
    },
});

// ── Internal Helpers (used by the run action) ────────────────────

export const getListing = internalQuery({
    args: { listingId: v.id("listings") },
    handler: async (ctx, args) => ctx.db.get(args.listingId),
});

export const getCredits = internalQuery({
    args: { userId: v.string() },
    handler: async (ctx, args) =>
        ctx.db.query("credits").withIndex("by_userId", q => q.eq("userId", args.userId)).first(),
});

export const getConfig = internalQuery({
    args: { listingId: v.id("listings"), version: v.number() },
    handler: async (ctx, args) =>
        ctx.db.query("promptConfigs")
            .withIndex("by_listingId", q => q.eq("listingId", args.listingId).eq("version", args.version))
            .first(),
});

export const createRun = internalMutation({
    args: {
        listingId: v.id("listings"),
        consumerId: v.string(),
        creatorId: v.string(),
        input: v.string(),
        totalCharged: v.number(),
        creatorEarning: v.number(),
        platformEarning: v.number(),
    },
    handler: async (ctx, args) =>
        ctx.db.insert("runs", {
            ...args,
            status: "running",
            createdAt: Date.now(),
        }),
});

export const completeRun = internalMutation({
    args: { runId: v.id("runs"), output: v.string(), durationMs: v.number() },
    handler: async (ctx, args) =>
        ctx.db.patch(args.runId, { output: args.output, durationMs: args.durationMs, status: "completed", completedAt: Date.now() }),
});

export const failRun = internalMutation({
    args: { runId: v.id("runs"), error: v.string() },
    handler: async (ctx, args) =>
        ctx.db.patch(args.runId, { status: "failed", errorMessage: args.error, completedAt: Date.now() }),
});

export const debitCredits = internalMutation({
    args: { userId: v.string(), amount: v.number(), runId: v.string() },
    handler: async (ctx, args) => {
        const credits = await ctx.db.query("credits").withIndex("by_userId", q => q.eq("userId", args.userId)).first();
        if (!credits) throw new Error("No credit account");
        const newBalance = credits.balance - args.amount;
        await ctx.db.patch(credits._id, { balance: newBalance, totalSpent: credits.totalSpent + args.amount, updatedAt: Date.now() });
        await ctx.db.insert("creditTransactions", {
            userId: args.userId, type: "spend", amount: -args.amount, balanceAfter: newBalance,
            description: "Prompt run", referenceId: args.runId, createdAt: Date.now(),
        });
    },
});

export const creditEarnings = internalMutation({
    args: { userId: v.string(), amount: v.number(), runId: v.string() },
    handler: async (ctx, args) => {
        const credits = await ctx.db.query("credits").withIndex("by_userId", q => q.eq("userId", args.userId)).first();
        if (credits) {
            await ctx.db.patch(credits._id, { balance: credits.balance + args.amount, totalEarned: credits.totalEarned + args.amount, updatedAt: Date.now() });
        } else {
            await ctx.db.insert("credits", { userId: args.userId, balance: args.amount, totalPurchased: 0, totalSpent: 0, totalEarned: args.amount, updatedAt: Date.now() });
        }
        await ctx.db.insert("creditTransactions", {
            userId: args.userId, type: "earning", amount: args.amount, balanceAfter: (credits?.balance ?? 0) + args.amount,
            description: "Creator earning (70%)", referenceId: args.runId, createdAt: Date.now(),
        });
    },
});

