import os


def load_strategies(mode):

    folder_path = f"./strategies/{mode}"

    strategies = []

    if not os.path.exists(folder_path):
        return strategies

    for index, filename in enumerate(os.listdir(folder_path)):

        if filename.endswith(".txt"):

            file_path = os.path.join(
                folder_path,
                filename
            )

            with open(
                file_path,
                "r",
                encoding="utf-8"
            ) as file:

                content = file.read().strip()

                lines = content.splitlines()

                title = (
                    filename.replace(".txt", "")
                    .replace("_", " ")
                    .title()
                )

                prompt = content

                if (
                    len(lines) > 0
                    and lines[0].lower().startswith("title:")
                ):

                    title = (
                        lines[0]
                        .replace("Title:", "")
                        .strip()
                    )

                    prompt = "\n".join(lines[2:]).strip()

                strategies.append(
                    {
                        "id": index + 1,
                        "title": title,
                        "prompt": prompt,
                    }
                )

    return strategies