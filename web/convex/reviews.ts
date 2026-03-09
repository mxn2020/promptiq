import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Submit a review for a listing.
 */
export const submit = mutation({
    args: {
        listingId: v.id("listings"),
        rating: v.number(),
        title: v.optional(v.string()),
        body: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        if (args.rating < 1 || args.rating > 5) throw new Error("Rating must be 1-5");

        // Check if user already reviewed
        const existing = await ctx.db
            .query("reviews")
            .withIndex("by_consumerId", q => q.eq("consumerId", identity.subject))
            .collect();
        if (existing.some(r => r.listingId === args.listingId))
            throw new Error("You already reviewed this listing");

        // Check user has run this listing
        const runs = await ctx.db
            .query("runs")
            .withIndex("by_consumerId", q => q.eq("consumerId", identity.subject))
            .collect();
        if (!runs.some(r => r.listingId === args.listingId && r.status === "completed"))
            throw new Error("You must run this prompt before reviewing");

        await ctx.db.insert("reviews", {
            listingId: args.listingId,
            consumerId: identity.subject,
            rating: args.rating,
            title: args.title,
            body: args.body,
            createdAt: Date.now(),
        });

        // Update listing average rating
        const allReviews = await ctx.db
            .query("reviews")
            .withIndex("by_listingId", q => q.eq("listingId", args.listingId))
            .collect();
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        await ctx.db.patch(args.listingId, {
            averageRating: Math.round(avg * 10) / 10,
            reviewCount: allReviews.length,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Get reviews for a listing.
 */
export const getForListing = query({
    args: { listingId: v.id("listings"), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("reviews")
            .withIndex("by_listingId", q => q.eq("listingId", args.listingId))
            .order("desc")
            .take(args.limit ?? 20);
    },
});
