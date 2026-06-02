from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from scenario_loader import load_scenarios
from strategy_loader import load_strategies

import ollama

# FASTAPI APP
app = FastAPI()

# CORS CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ROOT ENDPOINT
@app.get("/")
def home():
    return {"message": "Secure Prompt Generator API is running"}


# GENERATE ENDPOINT
@app.post("/generate")
async def generate(data: dict):

    try:
        prompt = data.get("prompt", "")

        prompt += """

IMPORTANT:

At the end of your analysis, return a JSON block exactly like this:

{
  "overall_score": 0,
  "authentication": 0,
  "authorization": 0,
  "input_validation": 0,
  "secret_management": 0,
  "logging": 0,
  "risk_level": ""
}

Rules:
- all scores must be between 0 and 100
- risk_level must be Low, Medium or High
- return valid JSON only inside the JSON block
"""

        model = data.get("model", "llama3")

        response = ollama.chat(
            model=model, messages=[{"role": "user", "content": prompt}]
        )

        return {"response": response["message"]["content"]}

    except Exception as e:
        return {"error": str(e)}


# STRATEGIES ENDPOINT
@app.get("/strategies/{mode}")
def get_strategies(mode: str):

    try:
        return load_strategies(mode)

    except Exception as e:
        return {"error": str(e)}


# SCENARIOS ENDPOINT
@app.get("/scenarios/{mode}")
def get_scenarios(mode: str):

    try:
        return load_scenarios(mode)

    except Exception as e:
        return {"error": str(e)}
