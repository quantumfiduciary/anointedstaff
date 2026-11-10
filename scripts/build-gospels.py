"""Pull the public-domain Gospels.net translations into the writings library."""

import json
import re
import urllib.request
from html import unescape
from pathlib import Path

root = Path(__file__).resolve().parents[1]
out = root / "public" / "writings.json"
pages = [
    ("poxy-5575", "Sayings of Jesus (P.Oxy. 5575)", "/sayings-of-jesus-poxy-5575"),
    ("thomas", "Gospel of Thomas", "/thomas"),
    ("mary", "Gospel of Mary", "/mary"),
    ("judas", "Gospel of Judas", "/judas"),
    ("philip", "Gospel of Philip", "/philip"),
    ("truth", "Gospel of Truth", "/truth"),
    ("peter", "Gospel of Peter", "/peter"),
    ("egerton", "Egerton Gospel", "/egerton"),
    ("quelle", "Gospel of Q", "/quelle"),
    ("james", "Secret Book of James", "/james"),
    ("infancy-james", "Infancy Gospel of James", "/infancyjames"),
    ("infancy-thomas", "Infancy Gospel of Thomas", "/infancythomas"),
    ("stranger", "The Stranger's Book", "/stranger"),
    ("secret-mark", "Secret Gospel of Mark", "/secret-gospel-of-mark"),
]


def paragraphs(path: str) -> list[str]:
    request = urllib.request.Request(f"https://www.gospels.net{path}", headers={"User-Agent": "AnointedStaff/0.1"})
    html = urllib.request.urlopen(request, timeout=40).read().decode("utf-8", "replace")
    html = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html, flags=re.I)
    found = []
    dedicated = False
    for raw in re.findall(r"<p[^>]*>([\s\S]*?)</p>", html, flags=re.I):
        text = unescape(re.sub(r"<[^>]+>", " ", raw))
        text = text.replace("\xa0", " ")
        text = re.sub(r"\s+", " ", text).strip()
        if "committed to the public domain" in text.lower():
            dedicated = True
            continue
        if not dedicated or len(text) < 40:
            continue
        if re.match(r"^(Saying|Logion)\s+\d+\s+:", text) or text.lower().startswith(("notes", "bibliography")):
            break
        if "see my book" in text.lower() or "amazon.com" in text.lower() or "luminescence" in text.lower():
            continue
        found.append(text)
    if not dedicated:
        raise SystemExit(f"{path} has no public-domain dedication")
    return found


def sections(lines: list[str]) -> list[dict]:
    grouped: list[dict] = []
    current = {"title": "Reading", "paragraphs": []}
    for line in lines:
        heading = re.match(r"^((?:Saying|Chapter|Logion)\s+\d+[:.].{0,80})", line)
        if heading and len(line) < 120:
            if current["paragraphs"]:
                grouped.append(current)
            current = {"title": heading.group(1)[:80], "paragraphs": []}
            continue
        current["paragraphs"].append(line)
        if len(current["paragraphs"]) >= 4 and not re.match(r"^(Saying|Chapter|Logion)", current["title"]):
            grouped.append(current)
            current = {"title": "Reading", "paragraphs": []}
    if current["paragraphs"]:
        grouped.append(current)
    for index, section in enumerate(grouped, start=1):
        if section["title"] == "Reading":
            section["title"] = f"Part {index}"
    return grouped


library = json.loads(out.read_text(encoding="utf-8"))
kept = [work for work in library["works"] if work["id"] in {"enoch", "pistis"}]
added = []
for work_id, title, path in pages:
    lines = paragraphs(path)
    work = {
        "id": work_id,
        "title": title,
        "credit": f"Public-domain translation from Gospels.net ({path}). Free to copy for any purpose.",
        "sections": sections(lines),
    }
    added.append(work)
    print(work_id, len(work["sections"]), "sections", sum(len(item["paragraphs"]) for item in work["sections"]), "paragraphs")

library["works"] = kept + added
out.write_text(json.dumps(library, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("works", len(library["works"]), "bytes", out.stat().st_size)
