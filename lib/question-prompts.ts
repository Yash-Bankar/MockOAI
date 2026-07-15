import type { SectionFormat } from "../app/generated/prisma/enums";

interface QuestionTypeMix {
  [subType: string]: {
    count: number;
    likely_subtypes?: string[];
    common_areas?: string[];
  };
}

interface MCQPromptParams {
  sectionName: string;
  questionCount: number;
  questionTypeMix: QuestionTypeMix;
  maxScore: number;
}

interface CodingPromptParams {
  sectionName: string;
  questionCount: number;
  questionTypeMix: QuestionTypeMix;
  maxScore: number;
}

export function buildMCQPrompt(params: MCQPromptParams): string {
  const { sectionName, questionCount, questionTypeMix, maxScore } = params;
  
  const subtypeBreakdown = Object.entries(questionTypeMix)
    .map(([subType, config]) => {
      const areas = config.common_areas?.join(", ") || "relevant topics";
      return `- ${subType}: ${config.count} questions covering ${areas}`;
    })
    .join("\n");

  return `You are generating ${questionCount} multiple-choice questions for the "${sectionName}" section of a technical interview exam.

SECTION CONFIGURATION:
${subtypeBreakdown}

REQUIREMENTS:
1. Generate exactly ${questionCount} questions that match the subtype distribution above
2. Each question must have exactly 4 options (labeled A, B, C, D)
3. Questions should be exam-realistic, not templated or repetitive
4. Difficulty should vary: mix easy, medium, and hard questions
5. Each question must include:
   - Clear, unambiguous prompt text
   - 4 distinct options (exactly one correct)
   - correctOptionId (the id field of the correct option)
   - Detailed explanation of why the correct answer is right
   - subType matching one from the list above
   - difficulty ("easy", "medium", or "hard")

QUALITY GUIDELINES:
- Questions should test conceptual understanding, not just memorization
- Distractors (wrong options) should be plausible but clearly incorrect
- Avoid ambiguous wording or trick questions
- Explanations should educate, not just state the answer
- Cover diverse aspects within each subtype's common areas

Generate the questions as a JSON array following this exact structure:
{
  "questions": [
    {
      "type": "MCQ",
      "question": {
        "promptText": "...",
        "options": [
          {"id": "A", "text": "..."},
          {"id": "B", "text": "..."},
          {"id": "C", "text": "..."},
          {"id": "D", "text": "..."}
        ],
        "correctOptionId": "A",
        "explanation": "...",
        "subType": "...",
        "difficulty": "medium"
      }
    }
  ]
}`;
}

export function buildCodingPrompt(params: CodingPromptParams): string {
  const { sectionName, questionCount, questionTypeMix, maxScore } = params;
  
  const subtypeBreakdown = Object.entries(questionTypeMix)
    .map(([subType, config]) => {
      const areas = config.common_areas?.join(", ") || "relevant topics";
      return `- ${subType}: ${config.count} problems covering ${areas}`;
    })
    .join("\n");

  return `You are generating ${questionCount} coding problems for the "${sectionName}" section of a technical interview exam.

SECTION CONFIGURATION:
${subtypeBreakdown}

CRITICAL REQUIREMENTS:
1. Generate exactly ${questionCount} problems matching the subtype distribution above
2. Each problem MUST be self-contained with unambiguous expected outputs
3. Problems must be deterministic (same input always produces same output)
4. NO problems requiring user input parsing from stdin (provide inputs as function parameters)
5. NO problems with multiple valid solutions or outputs
6. Provide 2-3 visible test cases (inputs only, no expectedOutput)
7. Provide 5-8 hidden test cases (inputs only, no expectedOutput) covering:
   - Edge cases: empty input, single element, boundary values
   - Large inputs (near constraints)
   - Duplicates, special characters, negative numbers (as relevant)
   - Normal cases with varied patterns

PROBLEM STRUCTURE:
Each problem must include:
- **promptText**: Clear problem statement with input/output format
- **constraints**: Array of constraint strings (e.g., "1 ≤ n ≤ 10^5", "All strings are lowercase")
- **examples**: 2-3 worked examples with input, output, and optional explanation
- **starterCode**: Function stubs in Python, C++, Java, and JavaScript (leave function body empty or with placeholder comment)
- **referenceSolution**: A complete, correct Python solution (this will be executed to verify test cases)
- **visibleTestCases**: Array of 2-3 test case objects with only "input" field (string format)
- **hiddenTestCases**: Array of 5-8 test case objects with only "input" field (string format)
- **timeLimitMs**: Reasonable time limit (typically 1000-3000ms)
- **subType**: One of the subtypes listed above
- **difficulty**: "easy", "medium", or "hard"

REFERENCE SOLUTION GUIDELINES:
- Must be a complete, runnable Python script.
- CRITICAL: It MUST include standard I/O code at the bottom (e.g., 'if __name__ == "__main__":' block) that reads from 'sys.stdin', parses the inputs, calls the solution function, and prints the result to stdout. Do NOT just provide a function definition, otherwise execution will produce no output.
- Should handle all edge cases correctly
- Must be efficient enough to pass time limits
- Should match the function signature in starterCode
- Will be executed against all test cases to generate expectedOutput

STARTER CODE GUIDELINES:
- CRITICAL: Provide the FULL standard I/O boilerplate for reading from stdin, parsing, and printing to stdout in ALL languages.
- Python: Provide the 'sys.stdin' reading loop and call a 'def function_name(params):' stub.
- C++: Provide a complete 'int main()' that reads from 'cin', parses, and calls the function stub. Include necessary headers.
- Java: Provide a complete 'public static void main(String[] args)' class that reads from 'Scanner', parses, and calls the function stub.
- JavaScript: Provide the 'require(readline)' or 'fs.readFileSync(0)' boilerplate and call the function stub.
- The user should ONLY need to fill in the core algorithm function, but they must see the I/O boilerplate so they know how it works.

TEST CASE FORMAT:
- Inputs should be provided as strings that can be parsed
- For array inputs: "1 2 3 4 5" or "[1,2,3,4,5]"
- For multiple parameters: Use newline separation or JSON format
- Keep it simple and parseable

QUALITY GUIDELINES:
- Problems should test algorithmic thinking and coding skills
- Difficulty should scale appropriately
- Avoid overly complex or esoteric problems
- Ensure problems are solvable within time limits
- Cover diverse techniques within each subtype

Generate the problems as a JSON array following this exact structure:
{
  "questions": [
    {
      "type": "CODING",
      "question": {
        "promptText": "...",
        "constraints": ["...", "..."],
        "examples": [
          {
            "input": "...",
            "output": "...",
            "explanation": "..."
          }
        ],
        "starterCode": {
          "python": "def solution(n):\\n    pass",
          "cpp": "#include <iostream>\\nusing namespace std;\\n\\nint solution(int n) {\\n    // Your code here\\n}",
          "java": "public class Solution {\\n    public static int solution(int n) {\\n        // Your code here\\n    }\\n}",
          "javascript": "function solution(n) {\\n    // Your code here\\n}"
        },
        "referenceSolution": "def solution(n):\\n    # Complete implementation\\n    return result",
        "visibleTestCases": [
          {"input": "5"},
          {"input": "10"}
        ],
        "hiddenTestCases": [
          {"input": "1"},
          {"input": "0"},
          {"input": "100000"},
          {"input": "999"},
          {"input": "42"}
        ],
        "timeLimitMs": 2000,
        "subType": "...",
        "difficulty": "medium"
      }
    }
  ]
}`;
}

export function buildPromptForSection(
  format: SectionFormat,
  sectionName: string,
  questionCount: number,
  questionTypeMix: QuestionTypeMix,
  maxScore: number
): string {
  if (format === "MCQ") {
    return buildMCQPrompt({ sectionName, questionCount, questionTypeMix, maxScore });
  } else {
    return buildCodingPrompt({ sectionName, questionCount, questionTypeMix, maxScore });
  }
}
