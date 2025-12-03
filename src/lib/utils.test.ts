import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names correctly", () => {
      expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
    });

    it("should handle conditional classes", () => {
      expect(cn("bg-red-500", false && "text-white", "p-4")).toBe("bg-red-500 p-4");
    });

    it("should merge tailwind classes correctly", () => {
      expect(cn("p-4", "p-8")).toBe("p-8");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });
  });
});
