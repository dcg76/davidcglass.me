#!/usr/bin/env python3
"""Build the blog from Markdown files in /posts.

Each post is a .md file with a short header:

    ---
    title: My Post Title
    date: 2026-11-20
    excerpt: One or two sentences shown on the blog page.
    image: /images/blog/my-photo.jpg
    image_alt: Short description of the photo
    ---

    Post text in Markdown...

Run:  python3 _tools/build_blog.py
Creates blog.html (the list) and blog/<slug>/index.html (each post),
and adds every post to sitemap.xml.
"""
import datetime, html, os, re, sys
import markdown

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS = os.path.join(ROOT, 'posts')
SITE = 'https://www.davidcglass.me'

def read_post(path):
    raw = open(path, encoding='utf-8').read()
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', raw, re.S)
    if not m: sys.exit(f'{path}: missing --- header')
    meta = {}
    for line in m.group(1).splitlines():
        if ':' in line:
            k, v = line.split(':', 1); meta[k.strip()] = v.strip()
    for k in ('title', 'date', 'excerpt', 'image'):
        if not meta.get(k): sys.exit(f'{path}: header is missing "{k}"')
    fname = os.path.basename(path)[:-3]
    meta['slug'] = re.sub(r'^\d{4}-\d{2}-\d{2}-', '', fname)
    meta['dt'] = datetime.date.fromisoformat(meta['date'])
    meta['body'] = markdown.markdown(m.group(2), extensions=['extra', 'smarty'])
    words = len(re.sub('<[^>]+>', ' ', meta['body']).split())
    meta['read'] = max(1, round(words / 225))
    meta.setdefault('image_alt', meta['title'])
    return meta

def nice(d): return d.strftime('%B %-d, %Y')

def shell(src_page, title, desc, url, image, body, current='Blog'):
    """Reuse the header/menu/footer from an existing page so everything matches."""
    page = open(os.path.join(ROOT, src_page), encoding='utf-8').read()
    head_end = page.index('</head>'); main_start = page.index('<main>'); main_end = page.index('</main>') + 7
    head = page[:head_end]
    head = re.sub(r'<title>.*?</title>', f'<title>{html.escape(title)}</title>', head)
    head = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + html.escape(desc), head)
    head = re.sub(r'(<meta property="og:description" content=")[^"]*', lambda m: m.group(1) + html.escape(desc), head)
    head = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + html.escape(title), head)
    head = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m.group(1) + url, head)
    head = re.sub(r'(<meta property="og:url" content=")[^"]*', lambda m: m.group(1) + url, head)
    head = re.sub(r'(<meta property="og:image" content=")[^"]*', lambda m: m.group(1) + SITE + image, head)
    head = re.sub(r'<script type="application/ld\+json">.*?</script>\n?', '', head, flags=re.S)
    mid = page[head_end:main_start]
    mid = re.sub(r' aria-current="page"', '', mid)
    mid = mid.replace(f'href="/blog">{current}', f'href="/blog" aria-current="page">{current}')
    tail = re.sub(r'<script>\s*/\* Paste the Google.*?</script>\n?', '', page[main_end:], flags=re.S)
    return head + mid + '<main>\n' + body + '\n</main>' + tail

def build():
    posts = sorted((read_post(os.path.join(POSTS, f)) for f in os.listdir(POSTS) if f.endswith('.md')),
                   key=lambda p: p['dt'], reverse=True)
    # Blog list page
    cards = '\n'.join(f'''      <a class="post-card" href="/blog/{p['slug']}/">
        <div class="post-card-img"><img src="{p['image']}" alt="{html.escape(p['image_alt'])}" loading="lazy"></div>
        <div class="post-card-body">
          <div class="post-meta">{nice(p['dt'])} &middot; {p['read']} min read</div>
          <h3>{html.escape(p['title'])}</h3>
          <p>{html.escape(p['excerpt'])}</p>
          <span class="more">Read more &rarr;</span>
        </div>
      </a>''' for p in posts)
    body = f'''  <header class="wrap page-head">
    <div class="eyebrow">Blog</div>
    <h1>Notes &amp; ideas.</h1>
    <p class="lead">Thoughts on technology, events, gaming, media and building things.</p>
  </header>

  <section class="wrap blog-list">
    <div class="post-grid">
{cards}
    </div>
  </section>'''
    out = shell('contact.html', 'Blog | David C. Glass', 'Thoughts on technology, events, gaming, media and building things.',
                SITE + '/blog', posts[0]['image'] if posts else '/images/share/og-image.jpg', body)
    open(os.path.join(ROOT, 'blog.html'), 'w', encoding='utf-8').write(out)

    # Individual posts
    for i, p in enumerate(posts):
        newer = posts[i - 1] if i > 0 else None
        older = posts[i + 1] if i + 1 < len(posts) else None
        nav = '<div class="post-nav" role="navigation" aria-label="More posts">'
        nav += f'<a class="older" href="/blog/{older["slug"]}/"><span>&larr; Older</span>{html.escape(older["title"])}</a>' if older else '<span></span>'
        nav += f'<a class="newer" href="/blog/{newer["slug"]}/"><span>Newer &rarr;</span>{html.escape(newer["title"])}</a>' if newer else '<span></span>'
        nav += '</div>'
        body = f'''  <header class="page-hero post-hero" style="--hero:url('{p['image']}')">
    <div class="wrap">
      <a class="eyebrow back" href="/blog">&larr; Blog</a>
      <h1>{html.escape(p['title'])}</h1>
      <div class="post-meta">{nice(p['dt'])} &middot; {p['read']} min read</div>
    </div>
  </header>

  <section class="wrap">
    <article class="post-body">
{p['body']}
    </article>
    {nav}
  </section>'''
        out = shell('contact.html', f"{p['title']} | David C. Glass", p['excerpt'], f"{SITE}/blog/{p['slug']}/", p['image'], body)
        d = os.path.join(ROOT, 'blog', p['slug']); os.makedirs(d, exist_ok=True)
        open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(out)

    # Sitemap
    sm_path = os.path.join(ROOT, 'sitemap.xml'); sm = open(sm_path, encoding='utf-8').read()
    sm = re.sub(r'\s*<url>\s*<loc>' + re.escape(SITE) + r'/blog[^<]*</loc>.*?</url>', '', sm, flags=re.S)
    entries = [f'  <url>\n    <loc>{SITE}/blog</loc>\n    <lastmod>{posts[0]["date"] if posts else datetime.date.today()}</lastmod>\n  </url>']
    entries += [f'  <url>\n    <loc>{SITE}/blog/{p["slug"]}/</loc>\n    <lastmod>{p["date"]}</lastmod>\n  </url>' for p in posts]
    sm = sm.replace('</urlset>', '\n'.join(entries) + '\n</urlset>')
    open(sm_path, 'w', encoding='utf-8').write(sm)
    print(f'Built blog with {len(posts)} post(s).')

if __name__ == '__main__':
    build()
