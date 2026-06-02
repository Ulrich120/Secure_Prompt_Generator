import os


def load_strategies(mode):

    folder_path = f"./strategies/{mode}"

    strategies = []

    for index, filename in enumerate(os.listdir(folder_path)):

        if filename.endswith(".txt"):

            with open(
                os.path.join(folder_path, filename), "r", encoding="utf-8"
            ) as file:

                content = file.read()

                strategies.append(
                    {
                        "id": index + 1,
                        "title": filename.replace(".txt", ""),
                        "prompt": content,
                    }
                )

    return strategies
