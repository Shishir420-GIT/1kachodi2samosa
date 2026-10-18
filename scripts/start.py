"""Supervise both services; stop the container if either child exits."""
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
from dotenv import load_dotenv
root = Path(__file__).resolve().parents[1]
load_dotenv(root / '.env')
os.chdir(root)
env = dict(os.environ, PORT=os.getenv('PORT', '8080'), HOST='0.0.0.0', NODE_ENV='production')
children = []
def stop(*_):
    for child in children:
        if child.poll() is None:
            child.terminate()
    for child in children:
        try: child.wait(timeout=5)
        except subprocess.TimeoutExpired: child.kill()
    sys.exit(0)
signal.signal(signal.SIGTERM, stop)
signal.signal(signal.SIGINT, stop)
children.append(subprocess.Popen([sys.executable, '-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', '8000', '--no-access-log'], env=env))
children.append(subprocess.Popen(
    ['node', str(root / 'node_modules/@react-router/serve/bin.cjs'), 'build/server/index.js'],
    cwd=root / 'apps/web',
    env=env,
))
while True:
    if any(child.poll() is not None for child in children):
        for child in children:
            if child.poll() is None: child.terminate()
        sys.exit(1)
    time.sleep(.5)
