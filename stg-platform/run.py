import os
import sys
import subprocess
import time
import signal

processes = []
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

def start_api():
    print("[STG] Iniciando API FastAPI na porta 8000...")
    p = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "core.main:app",
         "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=os.path.join(ROOT_DIR, "backend")
    )
    processes.append(p)
    return p

def start_bot():
    print("[STG] Iniciando Bot Discord...")
    p = subprocess.Popen(
        [sys.executable, "main.py"],
        cwd=os.path.join(ROOT_DIR, "bot")
    )
    processes.append(p)
    return p

def shutdown(signum, frame):
    print("\n[STG] Encerrando processos...")
    for p in processes:
        try:
            p.terminate()
        except Exception:
            pass
    sys.exit(0)

signal.signal(signal.SIGTERM, shutdown)
signal.signal(signal.SIGINT, shutdown)

if __name__ == "__main__":
    start_api()

    start_bot_flag = os.getenv("START_BOT", "false").lower() == "true"
    if start_bot_flag:
        time.sleep(3)
        start_bot()

    try:
        for p in processes:
            p.wait()
    except KeyboardInterrupt:
        shutdown(None, None)
