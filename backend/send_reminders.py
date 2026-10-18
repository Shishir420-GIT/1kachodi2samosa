"""Cloud Run Job entry point. Dry-run unless --send is explicitly supplied."""
import argparse
import json
from dotenv import load_dotenv
from backend.reminders import run

if __name__ == '__main__':
    load_dotenv()
    parser = argparse.ArgumentParser()
    parser.add_argument('--send', action='store_true', help='Deliver due reminders; default only reports a count.')
    args = parser.parse_args()
    print(json.dumps(run(send=args.send)))
