import json
import logging
import subprocess
import time
from pathlib import Path

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

CRON_CONFIG_PATH = Path("/app/workspace/config/cron_queries.json")

logger = logging.getLogger("cron-watcher")
logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.INFO)


def load_jobs(path: Path) -> dict:
    with path.open() as f:
        return json.load(f)


def build_crontab(cron_queries: dict) -> str:
    lines = []
    for cron_query_id, cron_query in cron_queries.items():
        schedule = cron_query.get("schedule", "").strip()
        query = cron_query.get("query", "").strip()

        lines.append(
            f"{schedule} export $(cat /proc/1/environ | tr '\\0' '\\n' | grep '^LANGGRAPH_') && /usr/local/bin/python /app/invoke_agent.py '{cron_query_id}' '{query}'"
        )

    return "\n".join(lines) + "\n" if lines else ""


def apply_crontab(crontab_content: str) -> None:
    if not crontab_content.strip():
        subprocess.run(["crontab", "-r"], capture_output=True)
        logger.info("Cleared all cron jobs (empty config)")
        return

    proc = subprocess.run(
        ["crontab", "-"],
        input=crontab_content,
        text=True,
        capture_output=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"crontab failed: {proc.stderr.strip()}")
    logger.info("Crontab updated successfully")


def sync(path: Path) -> None:
    """Load the config file and apply cron jobs."""
    try:
        jobs = load_jobs(path)
        crontab = build_crontab(jobs)
        apply_crontab(crontab)
        logger.info("Applied %d job(s) from %s", sum(
            1 for l in crontab.splitlines() if not l.startswith("#")), path)
    except json.JSONDecodeError as e:
        logger.error("Invalid JSON in %s: %s", path, e)
    except Exception as e:
        logger.error("Failed to sync cron jobs: %s", e)


class ConfigHandler(FileSystemEventHandler):
    def __init__(self, target: Path):
        self.target = target.resolve()

    def on_modified(self, event):
        self.handle_change(event)

    def on_created(self, event):
        self.handle_change(event)

    def on_moved(self, event):
        self.handle_change(event)

    def handle_change(self, event):
        if not event.is_directory and Path(event.src_path).resolve() == self.target:
            sync(self.target)


def main():
    watch_dir = CRON_CONFIG_PATH.parent

    if CRON_CONFIG_PATH.exists():
        logger.info("Initial sync from existing config")
        sync(CRON_CONFIG_PATH)
    else:
        logger.info(
            "Config not found yet, waiting for %s to be created...", CRON_CONFIG_PATH)

    handler = ConfigHandler(CRON_CONFIG_PATH)
    observer = Observer()
    observer.schedule(handler, str(watch_dir), recursive=False)
    observer.start()
    logger.info("Watching %s for changes...", CRON_CONFIG_PATH)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        observer.stop()
        observer.join()
        logger.info("cron-watcher stopped")


if __name__ == "__main__":
    main()
