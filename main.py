#!/bin/python3
import os
import argparse
from crewai import Agent, Task, Crew, Process, LLM

# --- 1. COMMAND LINE INPUT SETUP ---
parser = argparse.ArgumentParser(description="AI Agent Project Analyzer")
parser.add_argument("idea", help="The project idea you want to analyze (wrap in quotes)")
args = parser.parse_args()
current_idea = args.idea

# --- 2. CONFIGURATION & LLM (Claude 3.5 Sonnet via GitHub) ---

claude_sonnet = LLM(
    model="github/claude-4-5-opus",
    base_url="https://models.inference.ai.azure.com",
    api_key=os.environ["GITHUB_TOKEN"]
)

# Load your custom guide files
def load_guide(filename):
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            return f.read()
    return "Follow standard best practices for this role."

dev_guide = load_guide('dev_planner.md')
market_guide = load_guide('market_planner.md')

# --- 3. AGENT DEFINITIONS ---
market_agent = Agent(
    role="Marketing Strategist",
    goal=f"Analyze market and competition for {current_idea}",
    backstory=f"You follow the guidelines in market_planner.md: {market_guide}",
    llm=claude_sonnet,
    verbose=True
)

dev_agent = Agent(
    role="Go & React Lead Architect",
    goal=f"Plan architecture and maintenance for {current_idea}",
    backstory=f"You follow the guidelines in dev_planner.md: {dev_guide}",
    llm=claude_sonnet,
    verbose=True,
    allow_code_execution=True
)

# --- 4. TASK DEFINITIONS ---
market_task = Task(
    description=f"Conduct a full market analysis for the idea: '{current_idea}'.",
    expected_output="A markdown report including target audience and competitor analysis.",
    agent=market_agent,
    output_file="market_results.md"
)

dev_task = Task(
    description=f"Generate a technical roadmap and cost analysis for: '{current_idea}'.",
    expected_output="A markdown report with Go/React architecture and monthly maintenance costs.",
    agent=dev_agent,
    output_file="dev_results.md"
)

# --- 5. EXECUTION ---
crew = Crew(
    agents=[market_agent, dev_agent],
    tasks=[market_task, dev_task],
    process=Process.sequential
)

print(f"\n🚀 Starting AI Analysis for: {current_idea}...")
crew.kickoff()
print(f"\n✅ Analysis complete! Check market_results.md and dev_results.md.")
