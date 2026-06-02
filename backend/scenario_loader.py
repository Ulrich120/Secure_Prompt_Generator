import os

BASE_DIR = "scenarios"


def load_scenarios(mode):

    folder_path = os.path.join(BASE_DIR, mode)

    scenarios = []

    if not os.path.exists(folder_path):
        return []

    for filename in os.listdir(folder_path):

        if filename.endswith(".txt"):

            file_path = os.path.join(folder_path, filename)

            with open(file_path, "r", encoding="utf-8") as file:

                content = file.read()

            # nom du fichier sans .txt
            title = filename.replace(".txt", "")

            scenarios.append({
                "id": title.lower().replace(" ", "-"),
                "title": title,
                "prompt": content
            })

    return scenarios

def extract_title(content):
    lines = content.splitlines()
    for line in lines:
        if line.startswith("Title:"):
            return line.replace("Title:", "").strip()
    return "Untitled"

def extract_prompt(content):
    if "PROMPT:" in content:
        return content.split("PROMPT:")[1].strip()
    return "No prompt found"
