"""Server-only reminder delivery helpers for POST /cron/reminders."""
import base64
import hashlib
import hmac
import html
import json
import os
import time
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
import httpx

PROMPTS = (
    ('A boundary is already an answer.', 'Try one sentence: “They already said no. Let’s leave it there.”'),
    ('A joke can still do harm.', 'Try one sentence: “Let’s not make her the punchline.”'),
    ('Support starts by asking.', 'Try one sentence: “Do you want help, company, or some space?”'),
)

def config():
    values = {name: os.getenv(name, '') for name in ('SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'RESEND_API_KEY', 'REMINDER_FROM_EMAIL', 'PUBLIC_SITE_URL', 'UNSUBSCRIBE_SIGNING_SECRET')}
    missing = [name for name, value in values.items() if not value or 'YOUR_' in value]
    if missing: raise RuntimeError(f'Missing reminder configuration: {", ".join(missing)}')
    return values

def sign_unsubscribe(user_id: str, expires: int | None = None) -> str:
    secret = config()['UNSUBSCRIBE_SIGNING_SECRET'].encode()
    payload = json.dumps({'uid': user_id, 'exp': expires or int(time.time()) + 30 * 86400}, separators=(',', ':')).encode()
    encoded = base64.urlsafe_b64encode(payload).decode().rstrip('=')
    signature = hmac.new(secret, encoded.encode(), hashlib.sha256).hexdigest()
    return f'{encoded}.{signature}'

def verify_unsubscribe(token: str) -> str:
    try:
        encoded, signature = token.split('.', 1)
        expected = hmac.new(config()['UNSUBSCRIBE_SIGNING_SECRET'].encode(), encoded.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected): raise ValueError
        payload = json.loads(base64.urlsafe_b64decode(encoded + '=' * (-len(encoded) % 4)))
        if int(payload['exp']) < int(time.time()): raise ValueError
        return str(payload['uid'])
    except (KeyError, TypeError, ValueError, json.JSONDecodeError):
        raise ValueError('Invalid or expired unsubscribe link')

def is_due(pref: dict, now: datetime) -> tuple[bool, str]:
    try:
        local = now.astimezone(ZoneInfo(pref['timezone']))
        hour, minute = map(int, str(pref['local_time'])[:5].split(':'))
    except (KeyError, ValueError, ZoneInfoNotFoundError): return False, ''
    scheduled = local.replace(hour=hour, minute=minute, second=0, microsecond=0)
    minutes = (local - scheduled).total_seconds() / 60
    if not 0 <= minutes < 20: return False, local.date().isoformat()
    if pref.get('last_sent_at'):
        sent = datetime.fromisoformat(pref['last_sent_at'].replace('Z', '+00:00')).astimezone(local.tzinfo)
        if sent.date() == local.date(): return False, local.date().isoformat()
    return True, local.date().isoformat()

def _headers(secret: str):
    return {'apikey': secret, 'Authorization': f'Bearer {secret}'}

def run(send: bool = False, now: datetime | None = None) -> dict:
    cfg = config(); now = now or datetime.now(timezone.utc); base = cfg['SUPABASE_URL'].rstrip('/'); secret = cfg['SUPABASE_SECRET_KEY']
    with httpx.Client(timeout=15) as client:
        response = client.get(f'{base}/rest/v1/reminder_preferences', params={'select': 'user_id,enabled,local_time,timezone,last_sent_at', 'enabled': 'eq.true'}, headers=_headers(secret))
        response.raise_for_status(); due = [(pref, is_due(pref, now)[1]) for pref in response.json() if is_due(pref, now)[0]]
        delivered = 0
        for index, (pref, local_date) in enumerate(due):
            if not send: continue
            user = client.get(f'{base}/auth/v1/admin/users/{pref["user_id"]}', headers=_headers(secret)); user.raise_for_status()
            email = user.json().get('email');
            if not email: continue
            subject, practice = PROMPTS[(int(local_date.replace('-', '')) + index) % len(PROMPTS)]
            token = sign_unsubscribe(pref['user_id']); site = cfg['PUBLIC_SITE_URL'].rstrip('/')
            body = f'<p>{html.escape(subject)}</p><p>{html.escape(practice)}</p><p><a href="{html.escape(site)}/practice">Practise another response</a></p><p>You are receiving this because you enabled daily reminders. <a href="{html.escape(site)}/unsubscribe?token={token}">Unsubscribe</a>.</p>'
            sent = client.post('https://api.resend.com/emails', headers={'Authorization': f'Bearer {cfg["RESEND_API_KEY"]}', 'Idempotency-Key': f'dearmen-{pref["user_id"]}-{local_date}'}, json={'from': cfg['REMINDER_FROM_EMAIL'], 'to': [email], 'subject': 'One sentence to practise today', 'html': body})
            sent.raise_for_status()
            updated = client.patch(f'{base}/rest/v1/reminder_preferences', params={'user_id': f'eq.{pref["user_id"]}'}, headers={**_headers(secret), 'Prefer': 'return=minimal'}, json={'last_sent_at': now.isoformat(), 'updated_at': now.isoformat()})
            updated.raise_for_status(); delivered += 1
    return {'due': len(due), 'delivered': delivered, 'dry_run': not send}

def disable(token: str):
    cfg = config(); user_id = verify_unsubscribe(token); base = cfg['SUPABASE_URL'].rstrip('/'); secret = cfg['SUPABASE_SECRET_KEY']
    with httpx.Client(timeout=12) as client:
        response = client.patch(f'{base}/rest/v1/reminder_preferences', params={'user_id': f'eq.{user_id}'}, headers={**_headers(secret), 'Prefer': 'return=minimal'}, json={'enabled': False, 'updated_at': datetime.now(timezone.utc).isoformat()})
        response.raise_for_status()

