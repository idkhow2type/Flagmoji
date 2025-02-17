import os
import zipfile
import fnmatch
from pathlib import Path


def read_zipped_file():
    try:
        with open("zipped", "r") as f:
            lines = [
                line.strip() for line in f if line.strip() and not line.startswith("#")
            ]
            if not lines or not lines[1] == "---":
                print(
                    "Error: 'zipped' file must start with output filename, followed by '---'"
                )
                return None, []
            return lines[0], lines[2:]
    except FileNotFoundError:
        print("Error: 'zipped' file not found")
        return None, []


def should_include(path, patterns):
    # Convert path to forward slashes for consistent matching
    path = str(path).replace("\\", "/")

    # Keep track of the most specific match
    best_match_length = -1
    best_match_result = False

    for pattern in patterns:
        is_exclude = pattern.startswith("!")
        if is_exclude:
            pattern = pattern[1:]

        if fnmatch.fnmatch(path, pattern):
            # Calculate pattern specificity by counting non-wildcard characters
            specificity = len([c for c in pattern if c not in "*?"])

            if specificity > best_match_length:
                best_match_length = specificity
                best_match_result = not is_exclude

    # If no patterns matched, exclude the file
    return best_match_result if best_match_length >= 0 else False


def create_zip():
    output_file, patterns = read_zipped_file()
    if not output_file or not patterns:
        return

    base_path = Path(".")
    with zipfile.ZipFile(output_file, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk("."):
            for file in files:
                if file == output_file:  # Skip the output zip file
                    continue

                file_path = Path(root) / file
                relative_path = str(file_path.relative_to(base_path))

                if should_include(relative_path, patterns):
                    print(f"Adding: {relative_path}")
                    zipf.write(file_path, relative_path)


if __name__ == "__main__":
    create_zip()
