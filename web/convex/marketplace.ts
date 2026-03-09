import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Browse published marketplace listings.
 */
export const browse = query({
    args: {
        type: v.optional(v.union(
            v.literal("simple_prompt"),
            v.literal("advanced_prompt"),
            v.literal("workflow"),
            v.literal("template_pack")
        )),
        categoryId: v.optional(v.id("categories")),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let q = ctx.db.query("listings").withIndex("by_status", qb => qb.eq("status", "published"));
        const results = await q.order("desc").take(args.limit ?? 50);

        // Filter in-memory for optional filters
        let filtered = results;
        if (args.type) filtered = filtered.filter(l => l.type === args.type);
        if (args.categoryId) filtered = filtered.filter(l => l.categoryId === args.categoryId);

        return filtered;
    },
});

/**
 * Search listings by title.
 */
export const search = query({
    args: { query: v.string(), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        if (!args.query.trim()) return [];

        return await ctx.db
            .query("listings")
            .withSearchIndex("search_listings", q =>
                q.search("title", args.query).eq("status", "published")
            )
            .take(args.limit ?? 20);
    },
});

/**
 * Get featured listings.
 */
export const getFeatured = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("listings")
            .withIndex("by_featured", q => q.eq("isFeatured", true).eq("status", "published"))
            .take(10);
    },
});

/**
 * Get trending listings (most runs in recent period).
 */
export const getTrending = query({
    args: {},
    handler: async (ctx) => {
        const listings = await ctx.db
            .query("listings")
            .withIndex("by_status", q => q.eq("status", "published"))
            .collect();

        return listings
            .sort((a, b) => b.totalRuns - a.totalRuns)
            .slice(0, 10);
    },
});

/**
 * Get all active categories.
 */
export const getCategories = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("categories")
            .withIndex("by_isActive", q => q.eq("isActive", true))
            .collect();
    },
});

/**
 * Get listing detail with creator info.
 */
export const getListingDetail = query({
    args: { listingId: v.id("listings") },
    handler: async (ctx, args) => {
        const listing = await ctx.db.get(args.listingId);
        if (!listing || listing.status !== "published") return null;

        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_listingId", q => q.eq("listingId", args.listingId))
            .order("desc")
            .take(10);

        return { listing, reviews };
    },
});
