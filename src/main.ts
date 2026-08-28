import './style.css';
import { ensureCollection, getAll, put, remove, replaceAll } from './db';
import { formatDue, judgeAnswer, schedule } from './scheduler';
import type { Card, Collection, Review } from './types';
import { cachedUnlocked, captureLicense, checkoutUrl, getLicense, removeLicense, saveLicense, verifyLicense } from './license';

type View = 'review' | 'library' | 'progress' | 'upgrade';

const appRoot = document.querySelector<HTMLDivElement>('#app');
if (!appRoot) throw new Error('App root is missing.');
const app: HTMLDivElement = appRoot;

const escapeHtml = (value: string): string => value.replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character] ?? character));

const dateTime = (value: number): string => new Intl.DateTimeFormat(undefined, {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
}).format(value);

const download = (name: string, contents: string, type: string): void => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([contents], { type }));
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};

class RhythmApp {
  private view: View = 'review';
  private collections: Collection[] = [];
  private cards: Card[] = [];
  private reviews: Review[] = [];
  private collectionId = '';
  private currentCardId: string | null = null;
  private answerStarted = performance.now();
  private result: { correct: boolean; close: boolean; answer: string; reason: string; interval: string } | null = null;
  private unlocked = cachedUnlocked();
  private licenseNotice = '';
  private status = '';

  async start(): Promise<void> {
    captureLicense();
    this.unlocked = cachedUnlocked();
    const initial = await ensureCollection();
    this.collectionId = localStorage.getItem('rhythm:collection') ?? initial.id;
    await this.load();
    this.renderShell();
    this.bindGlobal();
    await this.renderView();
    this.verifyInBackground();
    this.registerServiceWorker();
  }

  private async load(): Promise<void> {
    [this.collections, this.cards, this.reviews] = await Promise.all([
      getAll<Collection>('collections'), getAll<Card>('cards'), getAll<Review>('reviews')
    ]);
    if (!this.collections.some((collection) => collection.id === this.collectionId)) {
      this.collectionId = this.collections[0]?.id ?? '';
    }
  }

  private renderShell(): void {
    app.innerHTML = `
      <header class="site-header">
        <a class="wordmark" href="#review" data-view="review" aria-label="Retrieval Rhythm home">
          <span class="mark" aria-hidden="true"><i></i><i></i><i></i></span>
          <h1>Retrieval Rhythm</h1>
        </a>
        <nav aria-label="Practice areas">
          <a href="#review" data-view="review">Review <span id="due-count" class="count"></span></a>
          <a href="#library" data-view="library">Library</a>
          <a href="#progress" data-view="progress">Progress</a>
          <a href="#upgrade" data-view="upgrade" class="nav-upgrade">${this.unlocked ? 'Unlocked' : 'Unlock +'}</a>
        </nav>
        <span id="network-state" class="network-state" aria-live="polite"></span>
      </header>
      <main id="main" tabindex="-1"></main>
      <footer>
        <span>Private by default · Your facts stay on this device</span>
        <span><a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a> · Original AI-generated landscape</span>
      </footer>
      <div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
    `;
    this.updateNetwork();
  }

  private bindGlobal(): void {
    app.addEventListener('click', (event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-view]');
      if (!target) return;
      event.preventDefault();
      this.go(target.dataset.view as View);
    });
    window.addEventListener('online', () => this.updateNetwork());
    window.addEventListener('offline', () => this.updateNetwork());
    window.addEventListener('keydown', (event) => {
      const tag = (event.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || event.ctrlKey || event.metaKey || event.altKey) return;
      const destination: Record<string, View> = { '1': 'review', '2': 'library', '3': 'progress' };
      const view = destination[event.key];
      if (view) this.go(view);
    });
    window.addEventListener('hashchange', () => {
      const hash = location.hash.slice(1) as View;
      if (['review', 'library', 'progress', 'upgrade'].includes(hash)) this.go(hash, false);
    });
  }

  private updateNetwork(): void {
    const element = document.querySelector<HTMLElement>('#network-state');
    if (!element) return;
    element.textContent = navigator.onLine ? '' : 'Offline · changes stay local';
    element.classList.toggle('visible', !navigator.onLine);
  }

  private async go(view: View, push = true): Promise<void> {
    this.view = view;
    this.status = '';
    this.result = null;
    this.currentCardId = null;
    if (push) history.pushState({}, '', `#${view}`);
    await this.renderView();
    document.querySelector<HTMLElement>('#main')?.focus({ preventScroll: true });
  }

  private async renderView(): Promise<void> {
    await this.load();
    const due = this.cards.filter((card) => card.collectionId === this.collectionId && card.dueAt <= Date.now()).length;
    const dueCount = document.querySelector('#due-count');
    if (dueCount) dueCount.textContent = due ? String(due) : '';
    document.querySelectorAll<HTMLElement>('nav [data-view]').forEach((item) => {
      if (item.dataset.view === this.view) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    const main = document.querySelector<HTMLElement>('#main');
    if (!main) return;
    try {
      if (this.view === 'review') this.renderReview(main);
      if (this.view === 'library') this.renderLibrary(main);
      if (this.view === 'progress') this.renderProgress(main);
      if (this.view === 'upgrade') this.renderUpgrade(main);
    } catch (error) {
      main.innerHTML = `<section class="error-state"><p class="eyebrow">Local storage paused</p><h2>We couldn’t open your collection.</h2><p>${escapeHtml(error instanceof Error ? error.message : 'Reload the page and try again.')}</p><button id="reload">Reload app</button></section>`;
      main.querySelector('#reload')?.addEventListener('click', () => location.reload());
    }
  }

  private currentCards(): Card[] {
    return this.cards.filter((card) => card.collectionId === this.collectionId);
  }

  private renderReview(main: HTMLElement): void {
    const cards = this.currentCards();
    if (!cards.length) {
      main.innerHTML = `
        <section class="welcome">
          <div class="welcome-copy">
            <p class="eyebrow"><span class="live-dot"></span>Typed recall, timed quietly</p>
            <h2>Remember the fact.<br><em>Skip the self-rating.</em></h2>
            <p class="lede">Type what you remember. Rhythm compares the answer, notices the time and any retries, then tells you exactly why it will return.</p>
            <button class="primary" data-view="library">Add your first facts</button>
            <p class="microcopy">No account · Works offline · Data stays here</p>
          </div>
          <figure class="landscape">
            <picture><source media="(max-width: 700px)" srcset="/assets/recall-landscape-720.webp"><img src="/assets/recall-landscape.webp" width="1200" height="800" alt="Glass markers rising at measured intervals along a luminous path" fetchpriority="high" decoding="async"></picture>
            <figcaption><span>Now</span><span>1 day</span><span>3 days</span><span>7 days</span></figcaption>
          </figure>
        </section>
        <section class="how-it-works" aria-labelledby="how-heading">
          <p class="eyebrow">The whole loop</p><h2 id="how-heading">One answer. One visible reason.</h2>
          <ol><li><span>01</span><strong>You type</strong><p>No “hard” or “easy” buttons.</p></li><li><span>02</span><strong>Rhythm observes</strong><p>Match, time, and retries only.</p></li><li><span>03</span><strong>You see why</strong><p>Every next due time is explained.</p></li></ol>
        </section>`;
      return;
    }

    const dueCards = cards.filter((card) => card.dueAt <= Date.now()).sort((a, b) => a.dueAt - b.dueAt);
    if (this.result && this.currentCardId) {
      const card = cards.find((item) => item.id === this.currentCardId);
      if (!card) { this.result = null; this.currentCardId = null; this.renderReview(main); return; }
      main.innerHTML = `
        <section class="review-wrap">
          <div class="session-meta"><span class="eyebrow">Answer observed</span><span>${dueCards.length} due now</span></div>
          <article class="result-panel ${this.result.correct ? 'is-correct' : 'is-retry'}" aria-live="polite">
            <p class="result-label">${this.result.correct ? (this.result.close ? 'Close match accepted' : 'Matched') : 'Not matched yet'}</p>
            <h2>${escapeHtml(card.prompt)}</h2>
            <div class="answer-reveal"><span>Accepted answer</span><strong>${escapeHtml(this.result.answer.replaceAll(';', ' ·'))}</strong></div>
            <div class="due-because"><span class="rhythm-node" aria-hidden="true"></span><div><strong>Due because…</strong><p>${escapeHtml(this.result.reason)}</p></div></div>
            <button id="next-card" class="primary">${dueCards.some((item) => item.id !== card.id) ? 'Next prompt' : 'Finish for now'}</button>
          </article>
        </section>`;
      main.querySelector('#next-card')?.addEventListener('click', () => {
        this.result = null;
        this.currentCardId = null;
        this.renderView();
      });
      return;
    }

    const card = dueCards[0];
    if (!card) {
      const next = [...cards].sort((a, b) => a.dueAt - b.dueAt)[0];
      main.innerHTML = `
        <section class="complete-state">
          <div class="orbit" aria-hidden="true"><span></span></div>
          <p class="eyebrow">Rhythm clear</p><h2>You’re caught up.</h2>
          <p>${next ? `The next fact returns <strong>${escapeHtml(formatDue(next.dueAt))}</strong>.` : 'Add another fact whenever you are ready.'}</p>
          ${next ? `<div class="next-reason"><strong>Next due because…</strong><p>${escapeHtml(next.dueReason)}</p></div>` : ''}
          <button data-view="library">Open library</button>
        </section>`;
      return;
    }

    this.currentCardId = card.id;
    this.answerStarted = performance.now();
    main.innerHTML = `
      <section class="review-wrap">
        <div class="session-meta"><span class="eyebrow">Recall ${cards.length - dueCards.length + 1} · ${dueCards.length} due</span><span>Answer from memory</span></div>
        <article class="prompt-panel">
          <p class="prompt-label">Prompt</p><h2>${escapeHtml(card.prompt)}</h2>
          <form id="answer-form" novalidate>
            <label for="typed-answer">Your answer</label>
            <input id="typed-answer" name="answer" autocomplete="off" autocapitalize="sentences" required aria-describedby="answer-help answer-error" />
            <p id="answer-help" class="field-help">Case and punctuation don’t matter. Press Enter to check.</p>
            <p id="answer-error" class="field-error" aria-live="polite"></p>
            <button class="primary" type="submit">Check answer</button>
          </form>
        </article>
        <div class="rhythm-preview" aria-label="Current rhythm: now, then timing inferred from this answer"><span class="active">Now</span><i></i><span>Next timing</span><i></i><span>Later</span></div>
      </section>`;
    const input = main.querySelector<HTMLInputElement>('#typed-answer');
    input?.focus();
    main.querySelector('#answer-form')?.addEventListener('submit', (event) => this.submitAnswer(event, card));
  }

  private async submitAnswer(event: Event, card: Card): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const input = form.elements.namedItem('answer') as HTMLInputElement;
    const error = form.querySelector<HTMLElement>('#answer-error');
    if (!input.value.trim()) {
      if (error) error.textContent = 'Type an answer before checking.';
      input.focus();
      return;
    }
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (button) { button.disabled = true; button.textContent = 'Checking…'; }
    const latency = Math.max(500, Math.round(performance.now() - this.answerStarted));
    const judged = judgeAnswer(input.value, card.answer);
    const next = schedule(card, judged.correct, latency);
    const review: Review = {
      id: crypto.randomUUID(), cardId: card.id, collectionId: card.collectionId,
      timestamp: Date.now(), typed: input.value, correct: judged.correct,
      latencyMs: latency, retry: card.retryCount, previousStage: card.stage, nextDue: next.dueAt
    };
    const updated: Card = {
      ...card, stage: next.stage, retryCount: next.retryCount, dueAt: next.dueAt,
      dueReason: next.reason, totalCorrect: card.totalCorrect + (judged.correct ? 1 : 0),
      totalReviews: card.totalReviews + 1, lastResult: judged.correct ? 'correct' : 'retry',
      lastLatencyMs: latency, lastReviewedAt: Date.now(), updatedAt: Date.now()
    };
    try {
      await Promise.all([put('cards', updated), put('reviews', review)]);
      await this.load();
      this.result = { correct: judged.correct, close: judged.close, answer: card.answer, reason: next.reason, interval: next.intervalLabel };
      this.renderReview(document.querySelector<HTMLElement>('#main')!);
    } catch {
      if (error) error.textContent = 'The answer could not be saved. Your text is still here—try again.';
      if (button) { button.disabled = false; button.textContent = 'Check answer'; }
    }
  }

  private collectionOptions(): string {
    return this.collections.map((collection) => `<option value="${collection.id}" ${collection.id === this.collectionId ? 'selected' : ''}>${escapeHtml(collection.name)}</option>`).join('');
  }

  private renderLibrary(main: HTMLElement): void {
    const cards = this.currentCards().sort((a, b) => b.createdAt - a.createdAt);
    main.innerHTML = `
      <section class="page-heading">
        <div><p class="eyebrow">Your local fact set</p><h2>Library</h2><p>Keep this collection small enough to return to. Twenty clear facts is a good start.</p></div>
        <label class="collection-select">Collection<select id="collection-select">${this.collectionOptions()}</select></label>
      </section>
      <section class="library-grid">
        <div class="editor-pane">
          <h3>Add a fact</h3>
          <form id="card-form" novalidate>
            <label for="prompt">Prompt</label><textarea id="prompt" name="prompt" rows="3" required></textarea>
            <label for="answer">Accepted answer</label><input id="answer" name="answer" required aria-describedby="answer-note form-status">
            <p id="answer-note" class="field-help">For alternatives, separate answers with a semicolon.</p>
            <p id="form-status" class="field-error" aria-live="polite"></p>
            <button type="submit" class="primary">Add fact</button>
          </form>
          <details class="bulk-add"><summary>Add many at once</summary>
            <form id="bulk-form"><label for="bulk">One fact per line: prompt, then a tab, then answer</label><textarea id="bulk" name="bulk" rows="7" placeholder="Capital of Senegal&#9;Dakar"></textarea><p class="field-error" id="bulk-error" aria-live="polite"></p><button type="submit">Add lines</button></form>
          </details>
        </div>
        <div class="facts-pane">
          <div class="facts-toolbar"><div><h3>${cards.length} ${cards.length === 1 ? 'fact' : 'facts'}</h3><p>${cards.filter((card) => card.dueAt <= Date.now()).length} due now</p></div>
            <div class="toolbar-actions"><button id="export-json" class="quiet">Export JSON</button><button id="export-csv" class="quiet">Export CSV</button><label class="file-button">Import JSON<input id="import-file" type="file" accept="application/json,.json"></label></div>
          </div>
          ${this.status ? `<p class="status-message" role="status">${escapeHtml(this.status)}</p>` : ''}
          ${cards.length ? `<ul class="fact-list">${cards.map((card) => `<li><div><strong>${escapeHtml(card.prompt)}</strong><span>${escapeHtml(card.answer.replaceAll(';', ' ·'))}</span><small>${escapeHtml(formatDue(card.dueAt))} · ${escapeHtml(card.dueReason)}</small></div><button class="icon-button delete-card" data-id="${card.id}" aria-label="Delete ${escapeHtml(card.prompt)}">Delete</button></li>`).join('')}</ul>` : `<div class="inline-empty"><span class="empty-node"></span><h3>No facts yet</h3><p>Add one here, or paste a tab-separated list to begin.</p></div>`}
        </div>
      </section>
      <section class="collection-tools"><div><p class="eyebrow">Collections</p><h2>Separate a subject</h2><p>The free collection stays fully useful. Multiple collections are part of Rhythm+.</p></div>
        ${this.unlocked ? `<form id="collection-form"><label for="collection-name">New collection name</label><div class="inline-form"><input id="collection-name" name="name" required><button type="submit">Create collection</button></div></form>` : `<button data-view="upgrade">See Rhythm+</button>`}
      </section>`;
    main.querySelector<HTMLSelectElement>('#collection-select')?.addEventListener('change', (event) => {
      this.collectionId = (event.target as HTMLSelectElement).value;
      localStorage.setItem('rhythm:collection', this.collectionId);
      this.renderView();
    });
    main.querySelector('#card-form')?.addEventListener('submit', (event) => this.addCard(event));
    main.querySelector('#bulk-form')?.addEventListener('submit', (event) => this.addBulk(event));
    main.querySelector('#collection-form')?.addEventListener('submit', (event) => this.addCollection(event));
    main.querySelectorAll<HTMLButtonElement>('.delete-card').forEach((button) => button.addEventListener('click', () => this.deleteCard(button.dataset.id ?? '')));
    main.querySelector('#export-json')?.addEventListener('click', () => this.exportJson());
    main.querySelector('#export-csv')?.addEventListener('click', () => this.exportCsv());
    main.querySelector<HTMLInputElement>('#import-file')?.addEventListener('change', (event) => this.importJson(event));
  }

  private async addCard(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const prompt = String(data.get('prompt') ?? '').trim();
    const answer = String(data.get('answer') ?? '').trim();
    const status = form.querySelector<HTMLElement>('#form-status');
    if (!prompt || !answer) { if (status) status.textContent = 'Add both a prompt and an accepted answer.'; return; }
    const now = Date.now();
    const card: Card = { id: crypto.randomUUID(), collectionId: this.collectionId, prompt, answer, createdAt: now, updatedAt: now, dueAt: now, stage: -1, retryCount: 0, totalCorrect: 0, totalReviews: 0, dueReason: 'New fact—ready for its first recall.' };
    await put('cards', card);
    this.status = `Added “${prompt}”.`;
    await this.renderView();
    document.querySelector<HTMLTextAreaElement>('#prompt')?.focus();
  }

  private async addBulk(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const lines = String(new FormData(form).get('bulk') ?? '').split('\n').map((line) => line.trim()).filter(Boolean);
    const parsed = lines.map((line) => line.split('\t')).filter((parts) => parts.length >= 2);
    const error = form.querySelector<HTMLElement>('#bulk-error');
    if (!lines.length || parsed.length !== lines.length) { if (error) error.textContent = 'Every non-empty line needs a prompt, a tab, and an answer.'; return; }
    const now = Date.now();
    await Promise.all(parsed.map((parts, index) => put<Card>('cards', {
      id: crypto.randomUUID(), collectionId: this.collectionId, prompt: parts[0]?.trim() ?? '', answer: parts.slice(1).join('\t').trim(),
      createdAt: now + index, updatedAt: now, dueAt: now, stage: -1, retryCount: 0, totalCorrect: 0, totalReviews: 0, dueReason: 'New fact—ready for its first recall.'
    })));
    this.status = `Added ${parsed.length} facts.`;
    await this.renderView();
  }

  private async addCollection(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.unlocked) return;
    const form = event.currentTarget as HTMLFormElement;
    const name = String(new FormData(form).get('name') ?? '').trim();
    if (!name) return;
    const collection = { id: crypto.randomUUID(), name, createdAt: Date.now() };
    await put('collections', collection);
    this.collectionId = collection.id;
    localStorage.setItem('rhythm:collection', collection.id);
    await this.renderView();
  }

  private async deleteCard(id: string): Promise<void> {
    const card = this.cards.find((item) => item.id === id);
    if (!card || !confirm(`Delete “${card.prompt}”? Its review history will remain in exports.`)) return;
    await remove('cards', id);
    this.status = `Deleted “${card.prompt}”.`;
    await this.renderView();
  }

  private exportJson(): void {
    download(`retrieval-rhythm-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), collections: this.collections, cards: this.cards, reviews: this.reviews }, null, 2), 'application/json');
    this.showToast('JSON backup downloaded.');
  }

  private exportCsv(): void {
    const quote = (value: string | number): string => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [['collection', 'prompt', 'answer', 'due', 'reviews', 'correct'], ...this.cards.map((card) => [this.collections.find((collection) => collection.id === card.collectionId)?.name ?? '', card.prompt, card.answer, new Date(card.dueAt).toISOString(), card.totalReviews, card.totalCorrect])];
    download('retrieval-rhythm-facts.csv', rows.map((row) => row.map(quote).join(',')).join('\n'), 'text/csv');
    this.showToast('CSV export downloaded.');
  }

  private async importJson(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text()) as { collections?: Collection[]; cards?: Card[]; reviews?: Review[] };
      if (!Array.isArray(payload.collections) || !payload.collections.length || !Array.isArray(payload.cards)) throw new Error('That file is not a Retrieval Rhythm backup.');
      if (!payload.cards.every((card) => card.id && card.collectionId && card.prompt && card.answer && Number.isFinite(card.dueAt))) throw new Error('Some facts are missing required fields.');
      if (!confirm(`Replace local data with ${payload.cards.length} imported facts? Export first if you need a backup.`)) return;
      await replaceAll({ collections: payload.collections, cards: payload.cards, reviews: payload.reviews ?? [] });
      this.collectionId = payload.collections[0]!.id;
      this.status = `Imported ${payload.cards.length} facts.`;
      await this.renderView();
    } catch (error) {
      this.status = error instanceof Error ? error.message : 'Import failed. Choose a valid JSON backup.';
      await this.renderView();
    }
  }

  private renderProgress(main: HTMLElement): void {
    const cards = this.currentCards();
    const reviews = this.reviews.filter((review) => review.collectionId === this.collectionId).sort((a, b) => b.timestamp - a.timestamp);
    const correct = reviews.filter((review) => review.correct).length;
    const dayKeys = new Set(reviews.map((review) => new Date(review.timestamp).toISOString().slice(0, 10)));
    const recentDays = Array.from({ length: 28 }, (_, index) => {
      const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (27 - index));
      const key = date.toISOString().slice(0, 10);
      return { key, label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), active: dayKeys.has(key) };
    });
    const upcoming = [1, 3, 7].map((days) => ({ days, count: cards.filter((card) => card.dueAt <= Date.now() + days * 86_400_000).length }));
    main.innerHTML = `
      <section class="page-heading"><div><p class="eyebrow">Observed, not diagnosed</p><h2>Your rhythm</h2><p>These are practice patterns, not a measure of learning ability.</p></div><label class="collection-select">Collection<select id="collection-select">${this.collectionOptions()}</select></label></section>
      <section class="stat-strip"><div><strong>${dayKeys.size}</strong><span>practice days</span></div><div><strong>${reviews.length ? Math.round(correct / reviews.length * 100) : 0}%</strong><span>typed matches</span></div><div><strong>${cards.length}</strong><span>facts kept</span></div></section>
      <section class="rhythm-calendar"><div><p class="eyebrow">Last 28 days</p><h3>Return, don’t streak.</h3><p>Each lit marker is a day you practiced. Missed days carry no penalty.</p></div><div class="day-grid" role="img" aria-label="${dayKeys.size} practice days in the last 28 days">${recentDays.map((day) => `<span class="${day.active ? 'active' : ''}" title="${day.label}${day.active ? ': practiced' : ''}"></span>`).join('')}</div></section>
      <section class="upcoming"><div><p class="eyebrow">What’s ahead</p><h3>Upcoming recalls</h3></div><ol>${upcoming.map((item) => `<li><span>Within ${item.days} ${item.days === 1 ? 'day' : 'days'}</span><strong>${item.count}</strong></li>`).join('')}</ol></section>
      <section class="history"><div><p class="eyebrow">Rhythm+ detail</p><h3>Review history</h3></div>
        ${this.unlocked ? (reviews.length ? `<div class="table-wrap"><table><thead><tr><th>When</th><th>Prompt</th><th>Result</th><th>Response</th></tr></thead><tbody>${reviews.slice(0, 100).map((review) => `<tr><td>${escapeHtml(dateTime(review.timestamp))}</td><td>${escapeHtml(this.cards.find((card) => card.id === review.cardId)?.prompt ?? 'Deleted fact')}</td><td>${review.correct ? 'Matched' : 'Retry'}</td><td>${Math.round(review.latencyMs / 1000)} s</td></tr>`).join('')}</tbody></table></div>` : '<p>No reviews yet. Your first typed answer will appear here.</p>') : `<div class="locked-inline"><p>Unlock the full timeline, including response time and retry outcomes.</p><button data-view="upgrade">See Rhythm+</button></div>`}
      </section>`;
    main.querySelector<HTMLSelectElement>('#collection-select')?.addEventListener('change', (event) => {
      this.collectionId = (event.target as HTMLSelectElement).value;
      localStorage.setItem('rhythm:collection', this.collectionId);
      this.renderView();
    });
  }

  private renderUpgrade(main: HTMLElement): void {
    main.innerHTML = `
      <section class="upgrade-hero">
        <div><p class="eyebrow">A small tool, paid once</p><h2>${this.unlocked ? 'Rhythm+ is unlocked.' : 'Keep more subjects in rhythm.'}</h2><p>Core recall stays free. Rhythm+ adds multiple collections and a detailed review timeline for <strong>$12 one-time</strong>.</p></div>
        <div class="price-panel"><span>Rhythm+</span><strong>$12</strong><small>one-time purchase</small>${this.unlocked ? '<span class="unlocked-badge">Active on this device</span>' : `<a class="button primary" href="${checkoutUrl}">Buy Rhythm+</a>`}</div>
      </section>
      <section class="tier-compare" aria-label="Plan comparison"><div><h3>Always free</h3><ul><li>One complete collection</li><li>Unlimited typed reviews</li><li>Transparent timing reasons</li><li>Offline use</li><li>JSON and CSV data export</li></ul></div><div class="plus-tier"><h3>Rhythm+</h3><ul><li>Everything in free</li><li>Multiple collections</li><li>Detailed review history</li><li>Support independent software</li></ul></div></section>
      <section class="restore"><div><p class="eyebrow">Already purchased?</p><h3>Restore your license</h3><p>Paste the license token from your receipt. Verification needs a connection once per day; cached access works offline.</p></div>
        <form id="license-form"><label for="license-token">License token</label><div class="inline-form"><input id="license-token" name="license" autocomplete="off" value=""><button type="submit">Verify license</button></div><p id="license-status" class="field-help" aria-live="polite">${escapeHtml(this.licenseNotice)}</p></form>
        ${getLicense() ? '<button id="remove-license" class="text-button">Remove license from this device</button>' : ''}
      </section>
      <p class="legal-note">Sociobot / Dodo is the merchant of record. Refunds are handled there and revoke the license automatically. See <a href="/terms/">terms</a> and <a href="/privacy/">privacy</a>.</p>`;
    main.querySelector('#license-form')?.addEventListener('submit', (event) => this.restoreLicense(event));
    main.querySelector('#remove-license')?.addEventListener('click', () => {
      removeLicense(); this.unlocked = false; this.licenseNotice = 'License removed from this device.'; this.renderView();
    });
  }

  private async restoreLicense(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const token = String(new FormData(form).get('license') ?? '').trim();
    const status = form.querySelector<HTMLElement>('#license-status');
    if (!token) { if (status) status.textContent = 'Paste the token from your purchase receipt.'; return; }
    saveLicense(token);
    if (status) status.textContent = 'Checking license…';
    try {
      this.unlocked = await verifyLicense(true);
      this.licenseNotice = this.unlocked ? 'License verified. Rhythm+ is active.' : 'That license is not active. Check the token or buy Rhythm+.';
    } catch {
      this.unlocked = cachedUnlocked();
      this.licenseNotice = 'Could not reach the license service. Cached access remains available offline.';
    }
    await this.renderView();
  }

  private async verifyInBackground(): Promise<void> {
    if (!getLicense()) return;
    try {
      const valid = await verifyLicense();
      if (valid !== this.unlocked) { this.unlocked = valid; this.licenseNotice = valid ? '' : 'License no longer active.'; await this.renderView(); }
    } catch { /* free experience and cached verdict continue */ }
  }

  private showToast(message: string, action?: () => void): void {
    const toast = document.querySelector<HTMLDivElement>('#toast');
    if (!toast) return;
    toast.hidden = false;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>${action ? '<button>Refresh</button>' : ''}`;
    if (action) toast.querySelector('button')?.addEventListener('click', action);
    else setTimeout(() => { toast.hidden = true; }, 3500);
  }

  private registerServiceWorker(): void {
    if (!('serviceWorker' in navigator)) return;
    const register = async (): Promise<void> => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showToast('An update is ready.', () => { worker.postMessage('SKIP_WAITING'); location.reload(); });
            }
          });
        });
      } catch { /* app remains fully usable without installation */ }
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }
}

const rhythm = new RhythmApp();
rhythm.start().catch((error: unknown) => {
  app.innerHTML = `<main id="main"><section class="error-state"><h1>Retrieval Rhythm</h1><h2>Local storage did not start.</h2><p>${escapeHtml(error instanceof Error ? error.message : 'Reload and try again.')}</p><button onclick="location.reload()">Reload app</button></section></main>`;
});
