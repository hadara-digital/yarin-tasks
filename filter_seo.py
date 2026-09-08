import json, sys, os

path = r'C:\Users\hadar\Desktop\Claude\Projects\לקוחות\הדרה דיגיטל - SEO\00 ניהול פרויקט\seo-dashboard\data\seo-pages.json'

with open(path, encoding='utf-8') as f:
    data = json.load(f)

print('Top-level keys:', list(data.keys()), file=sys.stderr)

# Collect all items
items = []
if isinstance(data, list):
    items = data
else:
    for key in ('pages', 'posts', 'items', 'tasks'):
        if key in data:
            items.extend(data[key])

print(f'Total items collected: {len(items)}', file=sys.stderr)

target_statuses = {'צריך תיקונים', 'בתור לקוואורק'}
target_types = {'עמוד', 'פוסט'}

results = []
for item in items:
    status = item.get('status', '')
    ttype = item.get('task_type', item.get('type', ''))
    if status in target_statuses and ttype in target_types:
        notes = item.get('notes', '') or ''
        results.append({
            'id': item.get('id', ''),
            'title': item.get('title', item.get('name', '')),
            'status': status,
            'task_type': ttype,
            'priority': item.get('priority', ''),
            'notes': notes[:600],
            'fix_requests': item.get('fix_requests', []),
            'base_content': bool(item.get('base_content', '')),
            'focus_keyphrase': item.get('focus_keyphrase', ''),
            'draft_file': item.get('draft_file', ''),
            'slug': item.get('slug', ''),
        })

priority_order = {'גבוהה': 0, 'בינונית': 1, 'נמוכה': 2, '': 3}

def sort_key(x):
    s = 0 if x['status'] == 'צריך תיקונים' else 1
    p = priority_order.get(x['priority'], 3)
    return (s, p)

results.sort(key=sort_key)

print(f'Matching items: {len(results)}', file=sys.stderr)
for r in results:
    print(f"  {r['id']} | {r['status']} | {r['task_type']} | {r['priority']} | {r['title'][:70]}", file=sys.stderr)

print(json.dumps(results, ensure_ascii=False, indent=2))
