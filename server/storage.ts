import { db } from "./db";
import {
  conversations,
  imageGenerations,
  llmRuns,
  messages,
  type Conversation,
  type CreateConversationRequest,
  type CreateMessageRequest,
  type CreateMessageResponse,
  type GetConversationResponse,
  type ImageGenerateRequest,
  type ImageGenerateResponse,
  type Message,
} from "@shared/schema";
import { and, desc, eq } from "drizzle-orm";

export interface IStorage {
  listConversations(): Promise<Conversation[]>;
  getConversation(id: number): Promise<GetConversationResponse | undefined>;
  createConversation(input: CreateConversationRequest): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;

  createUserMessage(conversationId: number, content: string): Promise<Message>;
  createAssistantMessage(conversationId: number, content: string): Promise<Message>;
  recordLlmRun(input: {
    conversationId: number;
    messageId: number | null;
    provider: "gemini" | "groq" | "huggingface";
    ok: boolean;
    latencyMs: number;
    sourceDate: string | null;
    extractedDates: string[];
    failureReason: string | null;
  }): Promise<void>;

  createMessageAndAnswer(
    conversationId: number,
    input: CreateMessageRequest,
    answerer: (input: CreateMessageRequest) => Promise<CreateMessageResponse>,
  ): Promise<CreateMessageResponse>;

  createImageGeneration(
    input: ImageGenerateRequest,
    imageUrl: string,
  ): Promise<ImageGenerateResponse>;
}

export class DatabaseStorage implements IStorage {
  async listConversations(): Promise<Conversation[]> {
    return db.select().from(conversations).orderBy(desc(conversations.createdAt));
  }

  async getConversation(id: number): Promise<GetConversationResponse | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conv) return undefined;
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);
    return { ...conv, messages: msgs };
  }

  async createConversation(input: CreateConversationRequest): Promise<Conversation> {
    const title = input.title?.trim() ? input.title.trim() : "Reti";
    const [conv] = await db.insert(conversations).values({ title }).returning();
    return conv;
  }

  async deleteConversation(id: number): Promise<void> {
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async createUserMessage(conversationId: number, content: string): Promise<Message> {
    const [msg] = await db
      .insert(messages)
      .values({ conversationId, role: "user", content })
      .returning();
    return msg;
  }

  async createAssistantMessage(conversationId: number, content: string): Promise<Message> {
    const [msg] = await db
      .insert(messages)
      .values({ conversationId, role: "assistant", content })
      .returning();
    return msg;
  }

  async recordLlmRun(input: {
    conversationId: number;
    messageId: number | null;
    provider: "gemini" | "groq" | "huggingface";
    ok: boolean;
    latencyMs: number;
    sourceDate: string | null;
    extractedDates: string[];
    failureReason: string | null;
  }): Promise<void> {
    await db.insert(llmRuns).values({
      conversationId: input.conversationId,
      messageId: input.messageId ?? null,
      provider: input.provider,
      ok: input.ok,
      latencyMs: input.latencyMs,
      sourceDate: input.sourceDate ?? null,
      extractedDates: input.extractedDates,
      failureReason: input.failureReason ?? null,
    });
  }

  async createMessageAndAnswer(
    conversationId: number,
    input: CreateMessageRequest,
    answerer: (input: CreateMessageRequest) => Promise<CreateMessageResponse>,
  ): Promise<CreateMessageResponse> {
    // Persist user message first
    const userMsg = await this.createUserMessage(conversationId, input.content);

    const response = await answerer(input);

    const assistant = await this.createAssistantMessage(conversationId, response.content);

    await this.recordLlmRun({
      conversationId,
      messageId: assistant.id,
      provider: response.providerUsed,
      ok: true,
      latencyMs: 0,
      sourceDate: response.sourceDate,
      extractedDates: response.extractedDates,
      failureReason: null,
    });

    return { ...response, assistantMessageId: assistant.id };
  }

  async createImageGeneration(
    input: ImageGenerateRequest,
    imageUrl: string,
  ): Promise<ImageGenerateResponse> {
    const [row] = await db
      .insert(imageGenerations)
      .values({
        provider: input.provider,
        prompt: input.prompt,
        imageUrl,
      })
      .returning();
    return { providerUsed: row.provider, imageUrl: row.imageUrl };
  }
}

export const storage = new DatabaseStorage();
