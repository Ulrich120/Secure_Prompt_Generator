from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi import UploadFile, File, Form
import shutil

from pydantic import BaseModel

from scenario_loader import load_scenarios
from strategy_loader import load_strategies

from dotenv import load_dotenv
import requests
import os

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

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

        model = data.get(
            "model",
            "deepseek/deepseek-chat-v3-0324"
        )

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            },
            timeout=120,
        )

        result = response.json()

        print("OPENROUTER RESPONSE:")
        print(result)

        if "choices" not in result:
            return {
                "error": result
            }

        return {
            "response":
                result["choices"][0]
                      ["message"]
                      ["content"]
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
    
# ADD SCENARIO
@app.post("/upload-scenario")
async def upload_scenario(
    mode: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        folder_path = f"Scenarios/{mode}"

        os.makedirs(folder_path, exist_ok=True)

        file_path = os.path.join(
            folder_path,
            file.filename
        )

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "message": "Scenario uploaded successfully",
            "filename": file.filename
        }

    except Exception as e:
        return {
            "error": str(e)
        }
    
#


class ScenarioCreate(BaseModel):
    mode: str
    title: str
    content: str


@app.post("/create-scenario")
def create_scenario(data: ScenarioCreate):
    try:
        safe_title = (
            data.title
            .lower()
            .replace(" ", "_")
            .replace("/", "_")
            .replace("\\", "_")
        )

        if not safe_title.endswith(".txt"):
            safe_title += ".txt"

        folder_path = f"Scenarios/{data.mode}"
        os.makedirs(folder_path, exist_ok=True)

        file_path = os.path.join(folder_path, safe_title)

        with open(file_path, "w", encoding="utf-8") as file:
            file.write(data.content)

        return {
            "message": "Scenario created successfully",
            "filename": safe_title,
        }

    except Exception as e:
        return {"error": str(e)}
