import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all prompts
  app.get("/api/prompts", async (req, res) => {
    try {
      const prompts = await storage.getAllPrompts();
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prompts" });
    }
  });

  // Get prompt by ID
  app.get("/api/prompts/:id", async (req, res) => {
    try {
      const prompt = await storage.getPromptById(req.params.id);
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prompt" });
    }
  });

  // Get prompts by category
  app.get("/api/prompts/category/:category", async (req, res) => {
    try {
      const prompts = await storage.getPromptsByCategory(req.params.category);
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prompts by category" });
    }
  });

  // Search prompts
  app.get("/api/prompts/search/:query", async (req, res) => {
    try {
      const prompts = await storage.searchPrompts(req.params.query);
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ message: "Failed to search prompts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
