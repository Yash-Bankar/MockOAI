/**
 * Gemini structured output response schemas
 * 
 * These schemas define the JSON structure Gemini should return.
 * They're used with responseMimeType: "application/json" and responseSchema
 * to ensure reliable, parseable JSON output.
 */

export const MCQ_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["MCQ"]
          },
          question: {
            type: "object",
            properties: {
              promptText: {
                type: "string",
                description: "The question text"
              },
              options: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description: "Option identifier (A, B, C, or D)"
                    },
                    text: {
                      type: "string",
                      description: "Option text"
                    }
                  },
                  required: ["id", "text"]
                },
                minItems: 4,
                maxItems: 4
              },
              correctOptionId: {
                type: "string",
                description: "The id of the correct option"
              },
              explanation: {
                type: "string",
                description: "Explanation of why the answer is correct"
              },
              subType: {
                type: "string",
                description: "Question subtype from the section configuration"
              },
              difficulty: {
                type: "string",
                enum: ["easy", "medium", "hard"]
              }
            },
            required: ["promptText", "options", "correctOptionId", "explanation", "subType", "difficulty"]
          }
        },
        required: ["type", "question"]
      }
    }
  },
  required: ["questions"]
};

export const CODING_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["CODING"]
          },
          question: {
            type: "object",
            properties: {
              promptText: {
                type: "string",
                description: "The problem statement"
              },
              constraints: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "List of constraints"
              },
              examples: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    input: {
                      type: "string",
                      description: "Example input"
                    },
                    output: {
                      type: "string",
                      description: "Example output"
                    },
                    explanation: {
                      type: "string",
                      description: "Optional explanation"
                    }
                  },
                  required: ["input", "output"]
                }
              },
              starterCode: {
                type: "object",
                properties: {
                  python: { type: "string" },
                  cpp: { type: "string" },
                  java: { type: "string" },
                  javascript: { type: "string" }
                },
                required: ["python", "cpp", "java", "javascript"]
              },
              referenceSolution: {
                type: "string",
                description: "Complete Python reference solution"
              },
              visibleTestCases: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    input: {
                      type: "string"
                    }
                  },
                  required: ["input"]
                },
                minItems: 2,
                maxItems: 3
              },
              hiddenTestCases: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    input: {
                      type: "string"
                    }
                  },
                  required: ["input"]
                },
                minItems: 5,
                maxItems: 8
              },
              timeLimitMs: {
                type: "integer",
                description: "Time limit in milliseconds"
              },
              subType: {
                type: "string",
                description: "Problem subtype from the section configuration"
              },
              difficulty: {
                type: "string",
                enum: ["easy", "medium", "hard"]
              }
            },
            required: [
              "promptText",
              "constraints",
              "examples",
              "starterCode",
              "referenceSolution",
              "visibleTestCases",
              "hiddenTestCases",
              "timeLimitMs",
              "subType",
              "difficulty"
            ]
          }
        },
        required: ["type", "question"]
      }
    }
  },
  required: ["questions"]
};
