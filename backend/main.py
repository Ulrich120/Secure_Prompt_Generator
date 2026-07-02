from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi import UploadFile, File, Form
import shutil

# CONVERSATIONS DATABASE
from database import SessionLocal, Conversation
import json

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

@app.get("/debug-files")
def debug_files():
    try:
        result = {}

        for root, dirs, files in os.walk("."):
            result[root] = {
                "dirs": dirs,
                "files": files,
            }

        return result

    except Exception as e:
        return {"error": str(e)}


# GENERATE ENDPOINT
@app.post("/generate")
async def generate(data: dict):
    max_tokens = data.get("max_tokens", 2000)

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
                ],
                "max_tokens": max_tokens,
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
    
# CREATE SCENARIO
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
    
# UPDATE AND DELETE SCENARIO 
class ScenarioUpdate(BaseModel):
    mode: str
    old_title: str
    new_title: str
    content: str


class ScenarioDelete(BaseModel):
    mode: str
    title: str


@app.put("/update-scenario")
def update_scenario(data: ScenarioUpdate):
    try:
        folder_path = f"Scenarios/{data.mode}"

        old_filename = (
            data.old_title.lower()
            .replace(" ", "_")
            .replace("/", "_")
            .replace("\\", "_")
        )

        new_filename = (
            data.new_title.lower()
            .replace(" ", "_")
            .replace("/", "_")
            .replace("\\", "_")
        )

        if not old_filename.endswith(".txt"):
            old_filename += ".txt"

        if not new_filename.endswith(".txt"):
            new_filename += ".txt"

        old_path = os.path.join(folder_path, old_filename)
        new_path = os.path.join(folder_path, new_filename)

        if os.path.exists(old_path) and old_path != new_path:
            os.remove(old_path)

        with open(new_path, "w", encoding="utf-8") as file:
            file.write(data.content)

        return {
            "message": "Scenario updated successfully",
            "filename": new_filename,
        }

    except Exception as e:
        return {"error": str(e)}
    

@app.delete("/delete-scenario")
def delete_scenario(data: ScenarioDelete):
    try:
        folder_path = f"Scenarios/{data.mode}"

        filename = (
            data.title.lower()
            .replace(" ", "_")
            .replace("/", "_")
            .replace("\\", "_")
        )

        if not filename.endswith(".txt"):
            filename += ".txt"

        file_path = os.path.join(folder_path, filename)

        if os.path.exists(file_path):
            os.remove(file_path)

            return {
                "message": "Scenario deleted successfully",
                "filename": filename,
            }

        return {"error": "Scenario not found"}

    except Exception as e:
        return {"error": str(e)}
    
# UPLOAD, CREATE, UPDATE AND DELETE STRATEGY

class StrategyCreate(BaseModel):
    mode: str
    title: str
    content: str


class StrategyUpdate(BaseModel):
    mode: str
    old_title: str
    new_title: str
    content: str


class StrategyDelete(BaseModel):
    mode: str
    title: str


def safe_strategy_filename(title: str):
    filename = (
        title.strip()
        .lower()
        .replace(" ", "_")
        .replace("/", "_")
        .replace("\\", "_")
    )

    if not filename.endswith(".txt"):
        filename += ".txt"

    return filename


def format_strategy_content(title: str, content: str):
    clean_content = content.strip()

    if clean_content.lower().startswith("title:"):
        return clean_content

    return f"""Title: {title.strip()}

{clean_content}
"""


@app.post("/create-strategy")
def create_strategy(data: StrategyCreate):
    try:
        folder_path = f"strategies/{data.mode}"
        os.makedirs(folder_path, exist_ok=True)

        filename = safe_strategy_filename(data.title)
        file_path = os.path.join(folder_path, filename)

        formatted_content = format_strategy_content(
            data.title,
            data.content
        )

        with open(file_path, "w", encoding="utf-8") as file:
            file.write(formatted_content)

        return {
            "message": "Strategy created",
            "filename": filename
        }

    except Exception as e:
        return {
            "error": str(e)
        }


@app.put("/update-strategy")
def update_strategy(data: StrategyUpdate):
    try:
        folder_path = f"strategies/{data.mode}"
        os.makedirs(folder_path, exist_ok=True)

        old_file = safe_strategy_filename(data.old_title)
        new_file = safe_strategy_filename(data.new_title)

        old_path = os.path.join(folder_path, old_file)
        new_path = os.path.join(folder_path, new_file)

        if os.path.exists(old_path) and old_path != new_path:
            os.remove(old_path)

        formatted_content = format_strategy_content(
            data.new_title,
            data.content
        )

        with open(new_path, "w", encoding="utf-8") as file:
            file.write(formatted_content)

        return {
            "message": "Strategy updated",
            "filename": new_file
        }

    except Exception as e:
        return {
            "error": str(e)
        }


@app.delete("/delete-strategy")
def delete_strategy(data: StrategyDelete):
    try:
        folder_path = f"strategies/{data.mode}"

        filename = safe_strategy_filename(data.title)
        file_path = os.path.join(folder_path, filename)

        if os.path.exists(file_path):
            os.remove(file_path)

            return {
                "message": "Strategy deleted",
                "filename": filename
            }

        return {
            "error": "Strategy not found",
            "filename": filename
        }

    except Exception as e:
        return {
            "error": str(e)
        }


@app.post("/upload-strategy")
async def upload_strategy(
    mode: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        folder_path = f"strategies/{mode}"
        os.makedirs(folder_path, exist_ok=True)

        file_path = os.path.join(
            folder_path,
            file.filename
        )

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "message": "Strategy uploaded",
            "filename": file.filename
        }

    except Exception as e:
        return {
            "error": str(e)
        }
    
# =========================
# CONVERSATIONS
# =========================

class ConversationCreate(BaseModel):
    mode: str
    title: str
    scenario_title: str
    strategy_title: str
    model: str
    messages: list


class ConversationUpdate(BaseModel):
    title: str
    scenario_title: str
    strategy_title: str
    model: str
    messages: list


@app.post("/save-conversation")
def save_conversation(data: ConversationCreate):
    try:
        db = SessionLocal()

        conversation = Conversation(
            mode=data.mode,
            title=data.title,
            scenario_title=data.scenario_title,
            strategy_title=data.strategy_title,
            model=data.model,
            messages=json.dumps(data.messages, ensure_ascii=False),
        )

        db.add(conversation)
        db.commit()
        db.refresh(conversation)

        return {
            "message": "Conversation saved",
            "id": conversation.id,
        }

    except Exception as e:
        return {"error": str(e)}

    finally:
        db.close()


@app.get("/conversations")
def get_conversations(mode: str = None):
    try:
        db = SessionLocal()

        query = db.query(Conversation)

        if mode:
            query = query.filter(Conversation.mode == mode)

        conversations = (
            query
            .order_by(Conversation.created_at.desc())
            .all()
        )

        return [
            {
                "id": conv.id,
                "mode": conv.mode,
                "title": conv.title,
                "scenario_title": conv.scenario_title,
                "strategy_title": conv.strategy_title,
                "model": conv.model,
                "created_at": conv.created_at,
            }
            for conv in conversations
        ]

    except Exception as e:
        return {"error": str(e)}

    finally:
        db.close()


@app.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: str):
    try:
        db = SessionLocal()

        conv = (
            db.query(Conversation)
            .filter(Conversation.id == conversation_id)
            .first()
        )

        if not conv:
            return {"error": "Conversation not found"}

        return {
            "id": conv.id,
            "mode": conv.mode,
            "title": conv.title,
            "scenario_title": conv.scenario_title,
            "strategy_title": conv.strategy_title,
            "model": conv.model,
            "messages": json.loads(conv.messages),
            "created_at": conv.created_at,
        }

    except Exception as e:
        return {"error": str(e)}

    finally:
        db.close()


@app.put("/conversations/{conversation_id}")
def update_conversation(conversation_id: str, data: ConversationUpdate):
    try:
        db = SessionLocal()

        conv = (
            db.query(Conversation)
            .filter(Conversation.id == conversation_id)
            .first()
        )

        if not conv:
            return {"error": "Conversation not found"}

        conv.title = data.title
        conv.scenario_title = data.scenario_title
        conv.strategy_title = data.strategy_title
        conv.model = data.model
        conv.messages = json.dumps(data.messages, ensure_ascii=False)

        db.commit()

        return {
            "message": "Conversation updated",
            "id": conv.id,
        }

    except Exception as e:
        return {"error": str(e)}

    finally:
        db.close()


@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str):
    try:
        db = SessionLocal()

        conv = (
            db.query(Conversation)
            .filter(Conversation.id == conversation_id)
            .first()
        )

        if not conv:
            return {"error": "Conversation not found"}

        db.delete(conv)
        db.commit()

        return {"message": "Conversation deleted"}

    except Exception as e:
        return {"error": str(e)}

    finally:
        db.close()