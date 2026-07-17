#!/usr/bin/env python3
"""Update Codito Zeitung card data from isolated Swiss RSS feeds."""

import argparse
import datetime as dt
import email.utils
import hashlib
import html
import json
import logging
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path
from xml.etree import ElementTree as ET
from html.parser import HTMLParser
from urllib.robotparser import RobotFileParser

APP = Path('/opt/ai-sysadmin/codito-zeitung-web-news')
STATE_FILE = APP / 'state' / 'state.json'
LOG_FILE = APP / 'logs' / 'web-news.log'
CACHE_FILE = APP / 'cache' / 'articles.json'
PROJECT = Path('/var/www/codito-zeitung')
FRONTEND = PROJECT / 'frontend'
OUTPUT_FILE = FRONTEND / 'src' / 'Data' / 'generatedArticles.ts'
USER_AGENT = 'CoditoZeitungWeb/1.0 (+RSS aggregator; yampe.dev)'
OLLAMA_URL = 'http://127.0.0.1:11434/api/generate'
OLLAMA_MODEL = 'qwen2.5:0.5b'
SUMMARY_VERSION = 4
FAILED_CACHE_TTL = dt.timedelta(hours=12)
ARTICLE_LIMIT = 14

FEEDS = [
    ('SRF News', 'https://www.srf.ch/news/bnf/rss/1646', 4),
    ('ETH Zürich', 'https://www.ethz.ch/de/news-und-veranstaltungen/eth-news/news/_jcr_content.feed', 5),
    ('NZZ', 'https://www.nzz.ch/recent.rss', 4),
    ('WOZ', 'https://www.woz.ch/t/startseite/feed', 4),
    ('WWF Schweiz', 'https://www.wwf.ch/de/ueber-uns/medienmitteilungen', 5),
]
ETH_FALLBACK_FEEDS = [
    'https://www.ethz.ch/de/news-und-veranstaltungen/eth-news/news/_jcr_content.feed.html?tag=news:dossiers/zukunftsblog',
    'https://www.ethz.ch/de/news-und-veranstaltungen/eth-news/news/_jcr_content.feed.html?tag=news:dossiers/medienmitteilung',
]

CATEGORIES = [
    ('Politik, Abstimmungen & Recht', r'bundesrat|parlament|abstimm|initiative|referendum|gesetz|verordnung|gericht|wahl|politik|diplom|kanton'),
    ('Wirtschaft, Arbeit & Unternehmen', r'wirtschaft|bank|franken|börse|unternehmen|arbeitsmarkt|arbeitsplatz|stelle|finanz|konjunktur|inflation|startup|zins|handel'),
    ('Umwelt, Klima & Biodiversität', r'umwelt|natur(?:schutz)?|biodiversität|artenvielfalt|artenschutz|klimawandel|klimaschutz|energiewende|erneuerbar|landwirtschaft|nachhaltig|wald|wälder|fluss|flüsse|gewässer|alpen|meer|ozean|pestizid|wildtier|ökosystem'),
    ('Wissenschaft, Technologie & KI', r'wissenschaft|forschung|technolog|digital|künstliche intelligenz|\bki\b|software|cyber|eth|epfl|innovation|robot|computer|klima'),
    ('Gesundheit, Bildung & Gesellschaft', r'gesundheit|spital|medizin|krank|gesellschaft|bildung|schule|universität|migration|bevölkerung|pflege|sozial|versicherung'),
    ('Verkehr, SBB & Zürich', r'zürich|sbb|\bbahn\b|verkehr|strasse|autobahn|flughafen|\btram\b|mobilität|transport|\bzug\b'),
    ('Kultur', r'kultur|film|musik|museum|kunst|literatur|theater|ausstellung|festival|buch'),
    ('Sport', r'sport|fussball|hockey|tennis|ski|rennen|meister|turnier|nationalteam|wimbledon|olympia|fifa|\bnati\b|viertelfinal|halbfinal|\btor\b|\bfoul\b'),
]

IMPORTANT = re.compile(
    r'schweiz|schweizer|bundesrat|parlament|zürich|snb|wirtschaft|abstimm|gesetz|gericht|sbb|eth|epfl|ki|gesundheit|national|meister|final',
    re.I,
)
LOW_VALUE = re.compile(
    r'promi|celebrity|royal|streaming.tipp|quiz|viral|bilder vom|public.viewing|kurios|klatsch|influencer',
    re.I,
)
SOURCE_DEFAULTS = {
    'SRF News': 'Politik, Abstimmungen & Recht',
    'ETH Zürich': 'Wissenschaft, Technologie & KI',
    'NZZ': 'Wirtschaft, Arbeit & Unternehmen',
    'WOZ': 'Gesundheit, Bildung & Gesellschaft',
    'WWF Schweiz': 'Umwelt, Klima & Biodiversität',
}


def setup() -> None:
    for path in (STATE_FILE.parent, LOG_FILE.parent, CACHE_FILE.parent):
        path.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        filename=LOG_FILE,
        level=logging.INFO,
        format='%(asctime)s %(levelname)s %(message)s',
    )


def now() -> dt.datetime:
    return dt.datetime.now().astimezone()


def clean(value: str) -> str:
    value = html.unescape(re.sub(r'<[^>]+>', ' ', value or ''))
    return re.sub(r'\s+', ' ', value).strip()


def short_summary(value: str, title: str, source: str) -> str:
    value = clean(value)
    value = re.sub(r'\s*(The post|Der Beitrag)\s+.+$', '', value, flags=re.I)
    if not value or value.casefold() == title.casefold():
        return f'Die vollständige Meldung ist bei {source} verfügbar.'
    sentences = re.split(r'(?<=[.!?])\s+', value)
    result = ' '.join(sentences[:2]).strip()
    if len(result) > 320:
        result = result[:317].rsplit(' ', 1)[0] + '…'
    return result


def parse_date(value: str):
    if not value:
        return None
    try:
        parsed = email.utils.parsedate_to_datetime(value)
        return parsed.replace(tzinfo=dt.timezone.utc) if parsed.tzinfo is None else parsed
    except Exception:
        try:
            return dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
        except Exception:
            return None


def tag(element, name: str) -> str:
    for child in element.iter():
        if child.tag.split('}')[-1].lower() == name.lower() and child.text:
            return child.text.strip()
    return ''


def canonical(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    query = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
    query = [item for item in query if not item[0].lower().startswith(('utm_', 'ref', 'campaign'))]
    return urllib.parse.urlunsplit(
        (parsed.scheme, parsed.netloc.lower(), parsed.path.rstrip('/'), urllib.parse.urlencode(query), '')
    )


def classify(title: str, description: str, source: str) -> str:
    text = f'{title} {description}'
    matches = []
    for index, (category, pattern) in enumerate(CATEGORIES):
        score = len(re.findall(pattern, text, re.I))
        if score:
            matches.append((score, -index, category))
    return max(matches)[2] if matches else SOURCE_DEFAULTS[source]


class WWFPressParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        self.article_depth = None
        self.current = None
        self.capture = None
        self.capture_depth = None
        self.items = []

    def handle_starttag(self, tag, attrs):
        self.depth += 1
        attributes = dict(attrs)
        classes = set(attributes.get('class', '').split())
        if tag == 'article' and 'node--type-press-release-page' in classes:
            self.current = {'title': [], 'summary': [], 'date': [], 'url': ''}
            self.article_depth = self.depth
            return
        if self.current is None:
            return
        if tag == 'a' and attributes.get('href', '').startswith('/de/medien/'):
            self.current['url'] = urllib.parse.urljoin('https://www.wwf.ch', attributes['href'])
        field = None
        if 'field-name--field-publication-date' in classes:
            field = 'date'
        elif tag == 'h4':
            field = 'title'
        elif 'field-name--field-teaser-text' in classes:
            field = 'summary'
        if field:
            self.capture = field
            self.capture_depth = self.depth

    def handle_data(self, data):
        if self.current is not None and self.capture:
            self.current[self.capture].append(data)

    def handle_endtag(self, tag):
        if self.current is not None and tag == 'article' and self.depth == self.article_depth:
            self.items.append(self.current)
            self.current = None
            self.article_depth = None
        if self.capture and self.depth == self.capture_depth:
            self.capture = None
            self.capture_depth = None
        self.depth -= 1


def fetch_wwf(url: str, weight: int):
    request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(request, timeout=25) as response:
        data = response.read(2_000_000).decode(response.headers.get_content_charset() or 'utf-8', errors='replace')
    parser = WWFPressParser()
    parser.feed(data)
    items = []
    for entry in parser.items:
        title = clean(' '.join(entry['title']))
        summary = short_summary(' '.join(entry['summary']), title, 'WWF Schweiz')
        try:
            published = dt.datetime.strptime(clean(' '.join(entry['date'])), '%d.%m.%Y').replace(
                hour=12,
                tzinfo=now().tzinfo,
            )
        except ValueError:
            continue
        if not title or not entry['url']:
            continue
        text = f'{title} {summary}'
        score = weight + (3 if IMPORTANT.search(text) else 0) + (1 if len(summary) > 80 else 0)
        items.append({
            'title': title,
            'url': canonical(entry['url']),
            'date': published.isoformat(),
            'has_time': False,
            'summary': summary,
            'source': 'WWF Schweiz',
            'category': 'Umwelt, Klima & Biodiversität',
            'score': score,
        })
    return items


def fetch(name: str, url: str, weight: int):
    if name == 'WWF Schweiz':
        return fetch_wwf(url, weight)
    request = urllib.request.Request(
        url,
        headers={'User-Agent': USER_AGENT},
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        data = response.read(2_000_000)
    root = ET.fromstring(data)
    items = []
    for element in root.iter():
        if element.tag.split('}')[-1].lower() not in ('item', 'entry'):
            continue
        title = clean(tag(element, 'title'))
        link = tag(element, 'link')
        if not link:
            for child in element.iter():
                if child.tag.split('}')[-1].lower() == 'link' and child.attrib.get('href'):
                    link = child.attrib['href']
                    break
        published = parse_date(
            tag(element, 'pubDate')
            or tag(element, 'published')
            or tag(element, 'updated')
            or tag(element, 'date')
        )
        raw_summary = tag(element, 'description') or tag(element, 'summary') or tag(element, 'content')
        if not title or not link or not published:
            continue
        summary = short_summary(raw_summary, title, name)
        text = f'{title} {summary}'
        score = weight + (3 if IMPORTANT.search(text) else 0) + (1 if len(summary) > 80 else 0)
        score -= 6 if LOW_VALUE.search(text) else 0
        items.append(
            {
                'title': title,
                'url': canonical(link),
                'date': published.isoformat(),
                'summary': summary,
                'source': name,
                'category': classify(title, summary, name),
                'score': score,
            }
        )
    return items


def collect(since: dt.datetime):
    found = []
    checked = 0
    errors = []
    for name, url, weight in FEEDS:
        try:
            source_items = fetch(name, url, weight)
            has_fresh_item = any(
                dt.datetime.fromisoformat(item['date']).astimezone() >= since
                for item in source_items
            )
            if name == 'ETH Zürich' and not has_fresh_item:
                for fallback_url in ETH_FALLBACK_FEEDS:
                    try:
                        source_items.extend(fetch(name, fallback_url, weight))
                    except Exception as exc:
                        logging.warning('feed_fallback source=%s error=%s', name, type(exc).__name__)
            found.extend(source_items)
            checked += 1
        except Exception as exc:
            errors.append(f'{name}: {type(exc).__name__}')
    wwf_since = now() - dt.timedelta(days=30)
    fresh = [
        item for item in found
        if dt.datetime.fromisoformat(item['date']).astimezone() >= since
        or (item['source'] == 'WWF Schweiz' and dt.datetime.fromisoformat(item['date']).astimezone() >= wwf_since)
    ]
    unique = {}
    title_index = {}
    for item in sorted(fresh, key=lambda value: (value['score'], value['date']), reverse=True):
        title_key = re.sub(r'[^a-z0-9äöüß]+', '', item['title'].casefold())
        existing = item['url'] if item['url'] in unique else title_index.get(title_key)
        if existing:
            continue
        unique[item['url']] = item
        title_index[title_key] = item['url']
    return list(unique.values()), checked, len(found), errors


def select_balanced(items, limit: int = ARTICLE_LIMIT):
    ranked = sorted(
        (item for item in items if item['score'] >= 4),
        key=lambda value: (value['score'], value['date']),
        reverse=True,
    )
    selected = []
    for source, _, _ in FEEDS:
        candidate = next((item for item in ranked if item['source'] == source and item not in selected), None)
        if candidate and len(selected) < limit:
            selected.append(candidate)
    for category, _ in CATEGORIES:
        candidate = next((item for item in ranked if item['category'] == category and item not in selected), None)
        if candidate and len(selected) < limit:
            selected.append(candidate)
    for item in ranked:
        if len(selected) >= limit:
            break
        if item not in selected:
            selected.append(item)
    return sorted(selected, key=lambda value: value['date'], reverse=True)


def load_state():
    try:
        return json.loads(STATE_FILE.read_text())
    except Exception:
        return {'last_regular_success': None, 'last_weekly_success': None}


def save_state(state) -> None:
    temporary = STATE_FILE.with_suffix('.tmp')
    temporary.write_text(json.dumps(state, ensure_ascii=False, indent=2) + '\n')
    os.chmod(temporary, 0o600)
    temporary.replace(STATE_FILE)


def load_cache():
    try:
        return json.loads(CACHE_FILE.read_text())
    except Exception:
        return {}


def save_cache(cache) -> None:
    temporary = CACHE_FILE.with_suffix('.tmp')
    temporary.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + '\n')
    os.chmod(temporary, 0o600)
    temporary.replace(CACHE_FILE)


class PublicParagraphParser(HTMLParser):
    BLOCKED = {'script', 'style', 'nav', 'footer', 'header', 'form', 'aside', 'noscript'}

    def __init__(self):
        super().__init__()
        self.blocked_depth = 0
        self.capturing = False
        self.buffer = []
        self.paragraphs = []

    def handle_starttag(self, tag, attrs):
        if tag in self.BLOCKED:
            self.blocked_depth += 1
        if tag == 'p' and self.blocked_depth == 0:
            self.capturing = True
            self.buffer = []

    def handle_endtag(self, tag):
        if tag == 'p' and self.capturing:
            paragraph = clean(''.join(self.buffer))
            if len(paragraph) >= 80:
                self.paragraphs.append(paragraph)
            self.capturing = False
        if tag in self.BLOCKED and self.blocked_depth:
            self.blocked_depth -= 1

    def handle_data(self, data):
        if self.capturing and self.blocked_depth == 0:
            self.buffer.append(data)


BOILERPLATE = re.compile(
    r'newsletter|cookie|datenschutz|weitere artikel|mehr zum thema|lesen sie auch|teilen sie diesen artikel|'
    r'bei der suchmaschine google|scientifica|veranstaltungskalender|abonnieren sie|copyright',
    re.I,
)


def robots_allowed(url: str) -> bool:
    parsed = urllib.parse.urlsplit(url)
    robots_url = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, '/robots.txt', '', ''))
    try:
        request = urllib.request.Request(robots_url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(request, timeout=15) as response:
            rules = response.read(500_000).decode('utf-8', 'ignore').splitlines()
        parser = RobotFileParser()
        parser.set_url(robots_url)
        parser.parse(rules)
        return parser.can_fetch(USER_AGENT, url)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return True
        logging.warning('article_extract url=%s fallback=robots_http_%d', url, exc.code)
        return False
    except Exception:
        logging.warning('article_extract url=%s fallback=robots_unavailable', url)
        return False


def extract_public_text(item) -> str:
    url = item['url']
    if not robots_allowed(url):
        logging.info('article_extract source=%s fallback=robots_denied', item['source'])
        return ''
    try:
        request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(request, timeout=25) as response:
            if response.status != 200:
                return ''
            page = response.read(1_500_000).decode('utf-8', 'ignore')
    except Exception as exc:
        logging.warning('article_extract source=%s fallback=%s', item['source'], type(exc).__name__)
        return ''
    lower_page = page.lower()
    inaccessible = re.search(r'isaccessibleforfree[\\"\s:]+false', lower_page)
    if inaccessible or (item['source'] == 'NZZ' and 'paywall' in lower_page):
        logging.info('article_extract source=%s fallback=paywall', item['source'])
        return ''
    parser = PublicParagraphParser()
    parser.feed(page)
    seen = set()
    paragraphs = []
    for paragraph in parser.paragraphs:
        key = re.sub(r'\W+', '', paragraph.casefold())
        if key in seen or BOILERPLATE.search(paragraph):
            continue
        seen.add(key)
        paragraphs.append(paragraph)
    if not paragraphs:
        return ''
    reference_tokens = {
        token for token in re.findall(r'[a-zäöüß]{5,}', f"{item['title']} {item['summary']}".casefold())
    }
    scores = []
    for index, paragraph in enumerate(paragraphs):
        tokens = set(re.findall(r'[a-zäöüß]{5,}', paragraph.casefold()))
        scores.append((len(tokens & reference_tokens), -index, index))
    best_score, _, start = max(scores)
    if best_score < 2:
        start = 0
    selected = []
    length = 0
    for paragraph in paragraphs[start:]:
        remaining = 1_400 - length
        if remaining <= 0:
            break
        selected.append(paragraph[:remaining])
        length += min(len(paragraph), remaining)
        if len(paragraph) > remaining:
            break
    text = '\n\n'.join(selected)
    return text if len(text) >= 700 else ''


def ollama_text(prompt: str, max_tokens: int):
    payload = json.dumps(
        {
            'model': OLLAMA_MODEL,
            'prompt': prompt,
            'stream': False,
            'keep_alive': '2m',
            'options': {'temperature': 0.1, 'num_ctx': 1024, 'num_predict': max_tokens},
        }
    ).encode()
    request = urllib.request.Request(
        OLLAMA_URL,
        data=payload,
        headers={'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(request, timeout=210) as response:
        answer = json.loads(response.read())
    return answer['response']


def summarize_public_text(item, source_text: str):
    prompt = f'''Fasse den QUELLTEXT sachlich auf Deutsch zusammen. Schreibe genau vier Zeilen.
Jede Zeile beginnt mit ABSATZ 1:, ABSATZ 2:, ABSATZ 3: oder ABSATZ 4: und enthält genau zwei kurze vollständige Sätze.
Verwende ausschliesslich belegte Fakten aus dem Quelltext. Keine Überschrift, keine Erfindungen, keine Wiederholungen.

QUELLTEXT:
{source_text}'''
    result = ollama_text(prompt, 240)
    matches = re.findall(r'(?im)^\s*ABSATZ\s+[1-7]\s*:\s*(.+?)\s*$', result)
    paragraphs = [clean(value) for value in matches if clean(value)]
    if not 4 <= len(paragraphs) <= 7:
        logging.warning('article_summary source=%s rejected=paragraph_count count=%d', item['source'], len(paragraphs))
        return []
    normalized = {re.sub(r'\W+', '', value.casefold()) for value in paragraphs}
    if len(normalized) != len(paragraphs):
        logging.warning('article_summary source=%s rejected=duplicate_paragraph', item['source'])
        return []
    if any(not 35 <= len(value) <= 260 for value in paragraphs):
        logging.warning(
            'article_summary source=%s rejected=paragraph_length lengths=%s',
            item['source'],
            ','.join(str(len(value)) for value in paragraphs),
        )
        return []
    source_numbers = set(re.findall(r'\b\d[\d.,%-]*\b', source_text))
    summary_numbers = set(re.findall(r'\b\d[\d.,%-]*\b', ' '.join(paragraphs)))
    if not summary_numbers <= source_numbers:
        logging.warning(
            'article_summary source=%s rejected=unsupported_numbers values=%s',
            item['source'],
            ','.join(sorted(summary_numbers - source_numbers)),
        )
        return []
    source_tokens = set(re.findall(r'[a-zäöüß]{5,}', source_text.casefold()))
    if any(
        len(set(re.findall(r'[a-zäöüß]{5,}', paragraph.casefold())) & source_tokens) < 2
        for paragraph in paragraphs
    ):
        logging.warning('article_summary source=%s rejected=low_source_overlap', item['source'])
        return []
    return paragraphs


def content_for_article(item, cache, generation_budget):
    cached = cache.get(item['url'])
    if cached and isinstance(cached.get('content'), list):
        same_generator = (
            cached.get('model') == OLLAMA_MODEL
            and cached.get('summary_version') == SUMMARY_VERSION
        )
        if cached.get('expanded') and same_generator:
            return cached['content']
        try:
            cached_at = dt.datetime.fromisoformat(cached['cached_at'])
            if same_generator and now() - cached_at < FAILED_CACHE_TTL:
                return cached['content']
        except (KeyError, TypeError, ValueError):
            pass
    content = [item['summary']]
    expanded = False
    try:
        source_text = extract_public_text(item)
        if source_text:
            if generation_budget['remaining'] <= 0:
                logging.info('article_summary source=%s deferred=generation_budget', item['source'])
                return content
            generation_budget['remaining'] -= 1
            generated = summarize_public_text(item, source_text)
            if generated:
                content = generated
                expanded = True
    except Exception as exc:
        logging.warning('article_summary source=%s fallback=%s', item['source'], type(exc).__name__)
    cache[item['url']] = {
        'content': content,
        'expanded': expanded,
        'cached_at': now().isoformat(),
        'model': OLLAMA_MODEL,
        'summary_version': SUMMARY_VERSION,
    }
    save_cache(cache)
    logging.info('article_summary source=%s expanded=%s paragraphs=%d', item['source'], expanded, len(content))
    return content


def article_id(url: str) -> int:
    return int(hashlib.sha256(url.encode()).hexdigest()[:10], 16) % 900_000_000 + 1_000


def render_typescript(items, mode: str, updated_at: dt.datetime) -> str:
    articles = []
    for item in items:
        published = dt.datetime.fromisoformat(item['date']).astimezone()
        word_count = sum(len(paragraph.split()) for paragraph in item.get('content', [item['summary']]))
        articles.append(
            {
                'id': article_id(item['url']),
                'source': item['source'],
                'category': item['category'],
                'title': item['title'],
                'excerpt': item['summary'],
                'content': item.get('content', [item['summary']]),
                'url': item['url'],
                'time': published.strftime('%d.%m.%Y · %H:%M Uhr') if item.get('has_time', True) else published.strftime('%d.%m.%Y'),
                'readTime': f'{max(2, round(word_count / 180))} Min.',
                'imagePosition': '50%',
            }
        )
    lines = [
        "import type { Article, NewsUpdate } from '../Types/news'",
        '',
        '// Automatically generated from the configured Swiss RSS feeds. Do not edit manually.',
        f'export const newsUpdate: NewsUpdate = {json.dumps({"updatedAt": updated_at.isoformat(), "mode": mode}, ensure_ascii=False)}',
        '',
        'export const articles: Article[] = [',
    ]
    lines.extend(f'  {json.dumps(article, ensure_ascii=False)},' for article in articles)
    lines.extend([']', ''])
    return '\n'.join(lines)


def deploy(items, mode: str, updated_at: dt.datetime) -> None:
    temporary = OUTPUT_FILE.with_suffix('.tmp')
    temporary.write_text(render_typescript(items, mode, updated_at))
    os.chmod(temporary, 0o644)
    temporary.replace(OUTPUT_FILE)
    environment = os.environ.copy()
    environment['PATH'] = '/root/.nvm/versions/node/v24.17.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/bin'
    subprocess.run(['npm', 'run', 'build'], cwd=FRONTEND, env=environment, check=True)
    subprocess.run(['/usr/bin/pm2', 'restart', 'coditozeitung-frontend'], env=environment, check=True)
    subprocess.run(['/usr/bin/pm2', 'save'], env=environment, check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', choices=('regular', 'weekly'), default='regular')
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    setup()
    started = now()
    weekly = args.mode == 'weekly'
    logging.info('start mode=%s dry_run=%s force=%s', args.mode, args.dry_run, args.force)
    if not weekly and started.weekday() == 6 and not args.force:
        logging.info('end skipped=Sunday weekly update takes precedence')
        return
    state = load_state()
    state_key = 'last_weekly_success' if weekly else 'last_regular_success'
    last = state.get(state_key)
    if last and not args.force:
        elapsed = started - dt.datetime.fromisoformat(last)
        minimum = dt.timedelta(days=6) if weekly else dt.timedelta(hours=71)
        if elapsed < minimum:
            logging.info('end skipped=not_due elapsed_hours=%.1f', elapsed.total_seconds() / 3600)
            return
    seven_days_ago = started - dt.timedelta(days=7)
    items, checked, found, errors = collect(seven_days_ago)
    candidates = list(items)
    selected = select_balanced(candidates)
    logging.info(
        'sources_checked=%d articles_found=%d fresh=%d selected=%d errors=%s',
        checked,
        found,
        len(candidates),
        len(selected),
        ','.join(errors) or 'none',
    )
    if checked < 2 or len(selected) < 3:
        raise RuntimeError('Not enough reliable fresh articles; current website data was preserved')
    if args.dry_run:
        print(json.dumps(selected, ensure_ascii=False, indent=2))
        logging.info('end deployment=not_attempted')
        return
    cache = load_cache()
    generation_budget = {'remaining': len(selected)}
    summary_priority = {'ETH Zürich': 0, 'SRF News': 1, 'WOZ': 2, 'NZZ': 3}
    for item in sorted(selected, key=lambda value: summary_priority.get(value['source'], 9)):
        item['content'] = content_for_article(item, cache, generation_budget)
    deploy(selected, args.mode, started)
    state[state_key] = started.isoformat()
    state['last_article_count'] = len(selected)
    state['last_sources'] = sorted({item['source'] for item in selected})
    save_state(state)
    logging.info('end deployment=success articles=%d', len(selected))


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        setup()
        logging.exception('end deployment=failed error=%s', type(exc).__name__)
        print(f'ERROR: {type(exc).__name__}: {exc}', file=sys.stderr)
        sys.exit(1)
