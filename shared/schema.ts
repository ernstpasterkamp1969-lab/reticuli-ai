import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const llmProviderEnum = pgEnum("llm_provider", [
  "gemini",
  "groq",
  "huggingface",
]);

export const imageProviderEnum = pgEnum("image_provider", [
  "pollinations",
  "craiyon",
  "huggingface",
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// --- Chat / AI assistant ---
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const llmRuns = pgTable("llm_runs", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  messageId: integer("message_id").references(() => messages.id, {
    onDelete: "set null",
  }),
  provider: llmProviderEnum("provider").notNull(),
  ok: boolean("ok").notNull().default(true),
  latencyMs: integer("latency_ms").notNull().default(0),
  sourceDate: text("source_date"),
  extractedDates: jsonb("extracted_dates").$type<string[]>().notNull().default([]),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const imageGenerations = pgTable("image_generations", {
  id: serial("id").primaryKey(),
  provider: imageProviderEnum("provider").notNull(),
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// --- Zod schemas + types ---
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertLlmRunSchema = createInsertSchema(llmRuns).omit({
  id: true,
  createdAt: true,
});

export const insertImageGenerationSchema = createInsertSchema(imageGenerations).omit(
  {
    id: true,
    createdAt: true,
  },
);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type LlmRun = typeof llmRuns.$inferSelect;
export type InsertLlmRun = z.infer<typeof insertLlmRunSchema>;

export type ImageGeneration = typeof imageGenerations.$inferSelect;
export type InsertImageGeneration = z.infer<typeof insertImageGenerationSchema>;

// --- Explicit API contract types ---

export type CreateConversationRequest = { title?: string };
export type CreateConversationResponse = Conversation;

export type GetConversationResponse = Conversation & { messages: Message[] };
export type ListConversationsResponse = Conversation[];

export type CreateMessageRequest = {
  content: string;
  // optional per-request provider preference / order
  providers?: ("gemini" | "groq" | "huggingface")[];
};

export type CreateMessageResponse = {
  assistantMessageId: number | null;
  content: string;
  providerUsed: "gemini" | "groq" | "huggingface";
  sourceDate: string | null;
  extractedDates: string[];
  failoverTried: ("gemini" | "groq" | "huggingface")[];
};

export type ImageGenerateRequest = {
  prompt: string;
  provider: "pollinations" | "craiyon" | "huggingface";
};

export type ImageGenerateResponse = {
  providerUsed: "pollinations" | "craiyon" | "huggingface";
  imageUrl: string;
};
