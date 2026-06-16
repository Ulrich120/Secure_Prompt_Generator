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

        model = data.get("model", "llama3")

        response = ollama.chat(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return {
            "response": response["message"]["content"]
        }

    except Exception as e:
        return {
            "error": str(e)
        }

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
