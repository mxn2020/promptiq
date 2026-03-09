import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get user's credit balance.
 */
export const getBalance = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("credits")
            .withIndex("by_userId", q => q.eq("userId", identity.subject))
            .first();
    },
});

/**
 * Get credit transaction history.
 */
export const getTransactions = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("creditTransactions")
            .withIndex("by_userId", q => q.eq("userId", identity.subject))
            .order("desc")
            .take(args.limit ?? 50);
    },
});

/**
 * Add credits after Stripe payment (internal).
 */
export const addCredits = internalMutation({
    args: {
        userId: v.string(),
        amount: v.number(),
        stripeSessionId: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("credits")
            .withIndex("by_userId", q => q.eq("userId", args.userId))
            .first();

        const now = Date.now();
        if (existing) {
            const newBalance = existing.balance + args.amount;
            await ctx.db.patch(existing._id, {
                balance: newBalance,
                totalPurchased: existing.totalPurchased + args.amount,
                updatedAt: now,
            });
            await ctx.db.insert("creditTransactions", {
                userId: args.userId,
                type: "purchase",
                amount: args.amount,
                balanceAfter: newBalance,
                description: `Purchased ${args.amount} credits`,
                referenceId: args.stripeSessionId,
                createdAt: now,
            });
        } else {
            await ctx.db.insert("credits", {
                userId: args.userId,
                balance: args.amount,
                totalPurchased: args.amount,
                totalSpent: 0,
                totalEarned: 0,
                updatedAt: now,
            });
            await ctx.db.insert("creditTransactions", {
                userId: args.userId,
                type: "purchase",
                amount: args.amount,
                balanceAfter: args.amount,
                description: `Purchased ${args.amount} credits`,
                referenceId: args.stripeSessionId,
                createdAt: now,
            });
        }
    },
});

/**
 * Request a payout (creator).
 */
export const requestPayout = mutation({
    args: { amount: v.number() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const credits = await ctx.db
            .query("credits")
            .withIndex("by_userId", q => q.eq("userId", identity.subject))
            .first();

        if (!credits || credits.totalEarned - credits.totalSpent < args.amount)
            throw new Error("Insufficient earnings for payout");

        return await ctx.db.insert("payouts", {
            creatorId: identity.subject,
            amount: args.amount,
            status: "pending",
            createdAt: Date.now(),
        });
    },
});

/**
 * Get payout history (creator).
 */
export const getPayouts = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("payouts")
            .withIndex("by_creatorId", q => q.eq("creatorId", identity.subject))
            .order("desc")
            .collect();
    },
});
