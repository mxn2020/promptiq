import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new listing (draft).
 */
export const create = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        type: v.union(
            v.literal("simple_prompt"),
            v.literal("advanced_prompt"),
            v.literal("workflow"),
            v.literal("template_pack")
        ),
        categoryId: v.optional(v.id("categories")),
        tags: v.array(v.string()),
        pricePerRun: v.number(),
        maxInputLength: v.number(),
        maxOutputLength: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const slug = args.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const now = Date.now();

        return await ctx.db.insert("listings", {
            creatorId: identity.subject,
            title: args.title,
            slug: `${slug}-${now}`,
            description: args.description,
            type: args.type,
            categoryId: args.categoryId,
            tags: args.tags,
            pricePerRun: args.pricePerRun,
            maxInputLength: args.maxInputLength,
            maxOutputLength: args.maxOutputLength,
            totalRuns: 0,
            totalRevenue: 0,
            averageRating: 0,
            reviewCount: 0,
            status: "draft",
            isFeatured: false,
            currentVersion: 1,
            createdAt: now,
            updatedAt: now,
        });
    },
});

/**
 * Update listing details.
 */
export const update = mutation({
    args: {
        listingId: v.id("listings"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        longDescription: v.optional(v.string()),
        categoryId: v.optional(v.id("categories")),
        tags: v.optional(v.array(v.string())),
        pricePerRun: v.optional(v.number()),
        maxInputLength: v.optional(v.number()),
        maxOutputLength: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const listing = await ctx.db.get(args.listingId);
        if (!listing || listing.creatorId !== identity.subject)
            throw new Error("Not authorized");

        const { listingId, ...updates } = args;
        const cleanUpdates: Record<string, unknown> = {};
        for (const [k, val] of Object.entries(updates)) {
            if (val !== undefined) cleanUpdates[k] = val;
        }
        cleanUpdates.updatedAt = Date.now();

        await ctx.db.patch(listingId, cleanUpdates);
    },
});

/**
 * Publish a listing to the marketplace.
 */
export const publish = mutation({
    args: { listingId: v.id("listings") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const listing = await ctx.db.get(args.listingId);
        if (!listing || listing.creatorId !== identity.subject) throw new Error("Not authorized");

        // Check that prompt config exists
        const config = await ctx.db
            .query("promptConfigs")
            .withIndex("by_listingId", q => q.eq("listingId", args.listingId))
            .first();
        if (!config) throw new Error("Must configure prompt before publishing");

        await ctx.db.patch(args.listingId, {
            status: "published",
            publishedAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

/**
 * Get listings created by the current user.
 */
export const getMyListings = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("listings")
            .withIndex("by_creatorId", q => q.eq("creatorId", identity.subject))
            .order("desc")
            .collect();
    },
});

/**
 * Get a single listing by ID.
 */
export const getById = query({
    args: { listingId: v.id("listings") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.listingId);
    },
});

/**
 * Save prompt configuration for a listing.
 */
export const savePromptConfig = mutation({
    args: {
        listingId: v.id("listings"),
        systemPrompt: v.string(),
        userPromptTemplate: v.optional(v.string()),
        examples: v.optional(v.array(v.object({
            input: v.string(),
            output: v.string(),
        }))),
        outputFormat: v.union(
            v.literal("text"), v.literal("json"), v.literal("markdown"),
            v.literal("csv"), v.literal("code")
        ),
        outputSchema: v.optional(v.string()),
        model: v.string(),
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        topP: v.optional(v.number()),
        exampleInput: v.optional(v.string()),
        exampleOutput: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const listing = await ctx.db.get(args.listingId);
        if (!listing || listing.creatorId !== identity.subject)
            throw new Error("Not authorized");

        const version = listing.currentVersion;
        const { listingId, ...configData } = args;

        return await ctx.db.insert("promptConfigs", {
            listingId,
            version,
            ...configData,
            createdAt: Date.now(),
        });
    },
});

/**
 * Get prompt config for a listing.
 */
export const getPromptConfig = query({
    args: { listingId: v.id("listings") },
    handler: async (ctx, args) => {
        const listing = await ctx.db.get(args.listingId);
        if (!listing) return null;

        return await ctx.db
            .query("promptConfigs")
            .withIndex("by_listingId", q =>
                q.eq("listingId", args.listingId).eq("version", listing.currentVersion)
            )
            .first();
    },
});

/**
 * Increment run stats (called internally after execution).
 */
export const incrementStats = internalMutation({
    args: {
        listingId: v.id("listings"),
        revenue: v.number(),
    },
    handler: async (ctx, args) => {
        const listing = await ctx.db.get(args.listingId);
        if (!listing) return;

        await ctx.db.patch(args.listingId, {
            totalRuns: listing.totalRuns + 1,
            totalRevenue: listing.totalRevenue + args.revenue,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Delete a listing (only drafts).
 */
export const deleteListing = mutation({
    args: { listingId: v.id("listings") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const listing = await ctx.db.get(args.listingId);
        if (!listing || listing.creatorId !== identity.subject) throw new Error("Not authorized");
        if (listing.status !== "draft") throw new Error("Can only delete drafts");

        await ctx.db.delete(args.listingId);
    },
});
