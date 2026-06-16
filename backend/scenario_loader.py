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
            title = (
                        filename
                        .replace(".txt", "")
                        .replace("_", " ")
                        .title()
                    )

            scenarios.append({
                "id": title.lower().replace(" ", "-"),
                "title": title,
                "prompt": content
            })

    return scenarios
