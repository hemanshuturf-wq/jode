import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneRig, retargetClip } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { groups, rooms } from './content.js';
import { officialPages, legalPages } from './official-data.js';
import { products } from './products.js';
import { sceneDescriptions } from './product-scenes.js';
import { mountStudio, disposeStudio } from './studio.js';
let restoringRoute = false; function recordRoute(route) { if (restoringRoute || location.hash === route) return; history.pushState(null, '', route); }
const $ = s => document.querySelector(s); const wrap = $('#panel-wrap'); let previousFocus = null;
const productList = items => items.map(([n, d]) => `<button class="product product-button" data-product="${n}"><span><strong>${n}</strong><span class="product-description">${d}</span></span><span aria-hidden="true">↗</span></button>`).join('');
const escapeText = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const contactLink = '<button class="primary" data-panel="contact">Discuss your requirements <span aria-hidden="true">→</span></button>';
let studio = null, selectedProduct = null, cancelNavigation = () => { };
function safeStudio(host, config) { try { if (document.body.classList.contains('graphics-unavailable')) throw new Error('Graphics unavailable'); return mountStudio(host, config); } catch (error) { host.innerHTML = '<p class="studio-fallback">The 3D preview is unavailable on this device. Official product imagery and capabilities are still available.</p>'; host.closest('.studio-shell')?.classList.add('studio-unavailable'); let index = 0; config.onFeature?.(0); return { select: i => { index = i; config.onFeature?.(index) }, pause: () => false, focus: () => { }, stop: () => { } }; } }

const content = {
  reception: `<h2 id="panel-title">Welcome. How can<br>we help you?</h2><p class="description">Explore the areas that matter to your business. Your visitor will take you there.</p><button class="panel-choice" data-go="payments"><span>Payments & banking<small>Infrastructure, integration, and verification</small></span><span aria-hidden="true">→</span></button><button class="panel-choice" data-go="business"><span>Business systems<small>ERP, operations, and customer engagement</small></span><span aria-hidden="true">→</span></button><button class="panel-choice" data-go="meeting"><span>Meet with Jodetx<small>Discuss a product or a business requirement</small></span><span aria-hidden="true">→</span></button><div class="panel-footer"><span class="small">An original virtual office.<br>Not a replica of the physical premises.</span><button class="secondary" data-close>Keep exploring →</button></div>`,
  payments: `<h2 id="panel-title">Connected financial<br>operations.</h2><p class="description">Explore Jodetx’s payment and banking portfolio. Choose your requirements with the team through the official onboarding page.</p>${productList(groups.payments)}<div class="panel-footer">${contactLink}</div>`,
  business: `<h2 id="panel-title">Systems that fit<br>your organisation.</h2><p class="description">From education and housing societies to everyday business operations, explore Jodetx’s ERP and management portfolio.</p>${productList(groups.business)}<div class="panel-footer">${contactLink}</div>`,
  meeting: `<h2 id="panel-title">Let’s talk about<br>your next step.</h2><p class="description">Start with your business needs. Jodetx’s official onboarding flow covers product selection, business details, and a follow-up from the team.</p><article class="product"><h3>Product consultation</h3><p>Find the right solution for your organisation.</p></article><article class="product"><h3>API & ERP onboarding</h3><p>Discuss integration with your existing systems.</p></article><article class="product"><h3>Business onboarding</h3><p>Continue securely on Jodetx’s current website.</p></article><div class="panel-footer">${contactLink}</div><p class="small">Opens jodetx.com in a new tab. This prototype does not collect or transmit personal information.</p>`,
  about: `<h2 id="panel-title">Technology.<br>With a business purpose.</h2><p class="description">Jode Technologies Private Limited focuses on simplifying transactions and helping businesses operate within the financial ecosystem.</p><article class="product"><h3>Payments & financial infrastructure</h3><p>Tools for payment operations, connected banking, and verification.</p></article><article class="product"><h3>Business technology</h3><p>ERP and management platforms for a range of organisations.</p></article><article class="product"><h3>Based in Thane</h3><p>301-A & 301-B, Third Floor, WiFi Park IT Premises Society, Plot B-3, Road 1, Wagle Industrial Estate, Thane (West), 400 604.</p></article><a class="panel-link" href="https://jodetx.com/#/about" target="_blank" rel="noopener">Read more about Jodetx <span aria-hidden="true">↗</span></a><p class="small">This is a proposed office experience, not a photograph or reconstruction of Jodetx’s actual office.</p>`,
  directory: `<h2 id="panel-title">The Jodetx portfolio.</h2><p class="description">Explore 21 product and platform listings, with a dedicated overview and capabilities for each.</p><div class="catalogue-controls"><label for="product-search">Find a product or capability</label><input id="product-search" type="search" placeholder="Search payments, ERP, verification…"><div class="catalogue-filters"><button data-filter="all" aria-pressed="true">All solutions</button><button data-filter="payments" aria-pressed="false">Payments & banking</button><button data-filter="business" aria-pressed="false">Business systems</button></div></div><div id="catalogue-results"></div><div class="panel-footer"><button class="secondary" data-panel="about">About Jodetx →</button><button class="secondary" data-panel="policies">Policies & onboarding →</button></div>`,
  policies: `<h2 id="panel-title">Clear next steps.<br>Official information.</h2><p class="description">Review Jodetx’s official terms and policies on the current company website. Legal documents and business onboarding remain on the official site.</p><a class="panel-choice" href="https://jodetx.com/#/terms" target="_blank" rel="noopener"><span>Terms of Use</span><span aria-hidden="true">↗</span></a><a class="panel-choice" href="https://jodetx.com/#/privacy" target="_blank" rel="noopener"><span>Privacy Policy</span><span aria-hidden="true">↗</span></a><a class="panel-choice" href="https://jodetx.com/#/verification" target="_blank" rel="noopener"><span>Verification Consent</span><span aria-hidden="true">↗</span></a><a class="panel-choice" href="https://jodetx.com/#/policies" target="_blank" rel="noopener"><span>All company policies</span><span aria-hidden="true">↗</span></a><div class="panel-footer">${contactLink}</div><p class="small">This prototype does not issue OTPs, process payments, verify businesses, or collect personal details.</p>`
};
let catalogueFilter = 'all';
function renderCatalogue() { const query = ($('#product-search')?.value || '').trim().toLowerCase(); const list = products.filter(p => (catalogueFilter === 'all' || p.category === catalogueFilter) && [p.name, p.summary, ...p.features].join(' ').toLowerCase().includes(query)); $('#catalogue-results').innerHTML = `<p class="result-count" aria-live="polite">${list.length} ${list.length === 1 ? 'solution' : 'solutions'}</p>` + (list.length ? list.map(p => `<button class="catalogue-card" data-product="${p.name}"><span class="catalogue-category">${p.category === 'payments' ? 'Payments & banking' : 'Business systems'}</span><strong>${p.name}</strong><span>${p.summary}</span><span class="catalogue-more">Explore capabilities <span aria-hidden="true">↗</span></span></button>`).join('') : '<p class="description">No matching solutions. Try another term or select All solutions.</p>'); }
function showProduct(name) { const p = products.find(p => p.name === name); if (!p) return; selectedProduct = p; content.product = `<button class="back-link" data-panel="directory">← All solutions</button><h2 id="panel-title">${p.name}</h2><p class="description">${p.summary}</p><section class="official-gallery"><div class="official-label">FROM THE OFFICIAL JODETX WEBSITE</div><img class="official-preview" src="${officialPages[p.name]?.preview || ''}" alt="${escapeText(p.name)} official website preview" loading="lazy"><div class="official-thumbnails">${(officialPages[p.name]?.images || []).map(im => `<button class="image-thumb" data-gallery-src="${im.src}" aria-label="View ${escapeText(im.alt)}"><img src="${im.src}" alt="${escapeText(im.alt)}" loading="lazy"></button>`).join('')}</div><details><summary>Official product details & walkthrough</summary>${(officialPages[p.name]?.states || []).map((st, i) => `<section class="source-state"><h3>${escapeText(st.label || `Product view ${i + 1}`)}</h3><p>${escapeText(st.text).replace(/\n/g, '<br>')}</p></section>`).join('') || `<p>${escapeText(officialPages[p.name]?.text || '').replace(/\n/g, '<br>')}</p>`}</details></section><section class="studio-shell"><div id="product-studio" class="studio-canvas"></div><div class="studio-caption"><span class="studio-kicker">Illustrative 3D product walkthrough</span><strong id="active-feature">${p.features[0]}</strong><p>${sceneDescriptions[p.name]} Illustrative model—not the live product interface.</p></div><div class="studio-controls"><button id="feature-prev" aria-label="Previous capability">←</button><span id="feature-counter">01 / ${String(p.features.length).padStart(2, '0')}</span><button id="feature-play" aria-pressed="true">Pause walkthrough</button><button id="feature-next" aria-label="Next capability">→</button></div></section><h3 class="section-label">Explore each capability</h3><div class="capability-grid">${p.features.map((f, i) => `<button class="capability" data-feature="${i}" aria-pressed="${i === 0}"><span>${String(i + 1).padStart(2, '0')}</span><h3>${f}</h3><span class="capability-action">Explore in 3D →</span></button>`).join('')}</div><div class="detail-note"><h3>Discuss the fit for your business.</h3><p>Confirm product availability, supported integrations, commercial terms, and onboarding requirements directly with Jodetx.</p></div><div class="panel-footer">${contactLink}<a class="panel-link" href="${p.url}" target="_blank" rel="noopener">Official product page ↗</a></div>`; panel('product'); }
function studioFeature(index) { if (!selectedProduct || !$('#active-feature')) return; const label = $('#active-feature'); label.textContent = selectedProduct.features[index]; if (!reduced) label.animate([{ opacity: .2, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' }); $('#feature-counter').textContent = `${String(index + 1).padStart(2, '0')} / ${String(selectedProduct.features.length).padStart(2, '0')}`; document.querySelectorAll('[data-feature]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.feature) === index))); }
content.contact = `<h2 id="panel-title">Let’s build the<br>right connection.</h2><p class="description">Tell us what your business needs. This prototype prepares an enquiry draft locally; use Jodetx’s official onboarding page to submit your details to the company.</p><section class="studio-shell contact-studio"><div id="contact-studio" class="studio-canvas"></div><div class="studio-caption"><span class="studio-kicker">Your enquiry workspace</span><strong id="contact-stage-label">A conversation starts here.</strong><p>Focus a field to follow the enquiry journey.</p></div></section><div class="enquiry-progress"><span id="form-progress-text">0 of 5 required details complete</span><div><span id="form-progress-bar"></span></div></div><form id="enquiry-form"><div class="form-grid"><label class="field">Full name <span aria-hidden="true">*</span><input name="name" autocomplete="name" required maxlength="100" placeholder="Your full name" data-stage="Your name"></label><label class="field">Company <span aria-hidden="true">*</span><input name="company" autocomplete="organization" required maxlength="150" placeholder="Company or organisation" data-stage="Your company"></label><label class="field">Work email <span aria-hidden="true">*</span><input name="email" type="email" autocomplete="email" required maxlength="200" placeholder="you@company.com" data-stage="Contact details"></label><label class="field">Phone <span class="optional">Optional</span><input name="phone" type="tel" autocomplete="tel" maxlength="25" placeholder="Include your country code" data-stage="Contact details"></label><label class="field full">Product of interest <span aria-hidden="true">*</span><select name="product" required data-stage="Product requirements"><option value="">Choose a product or platform</option>${products.map(p => `<option>${p.name}</option>`).join('')}<option>Help me choose a solution</option></select></label><label class="field full">What would you like to discuss? <span aria-hidden="true">*</span><textarea name="message" required minlength="10" maxlength="2000" rows="4" placeholder="Tell us about your requirements, current systems, or integration plans." data-stage="Your requirements"></textarea><span class="field-help">10–2,000 characters. Don’t include passwords, bank details, or identity documents.</span></label></div><label class="consent"><input type="checkbox" name="acknowledged" required><span>I understand this prepares a local draft and does not send an enquiry. <a href="https://jodetx.com/#/privacy" target="_blank" rel="noopener">Official privacy policy&nbsp;↗</a></span></label><p id="form-status" class="form-status" role="status" aria-live="polite"></p><div class="form-actions"><button type="submit" class="primary">Prepare & download enquiry <span aria-hidden="true">↓</span></button><button type="reset" class="secondary">Clear form</button></div></form><section id="draft-confirmation" hidden><div class="draft-mark" aria-hidden="true">✓</div><h3>Your enquiry draft is ready.</h3><p>Saved as a text-file download. It has not been sent to Jodetx.</p><a class="primary" href="https://jodetx.com/#/contact" target="_blank" rel="noopener">Continue to official onboarding ↗</a><button class="secondary" id="new-draft">Prepare another draft →</button></section><div class="contact-direct"><span>Prefer to continue directly?</span><a href="https://jodetx.com/#/contact" target="_blank" rel="noopener">Open Jodetx onboarding ↗</a></div>`;
content.about += `<div class="panel-footer"><p class="field-help">Character: “Indian man with suit” by Polymount. Used within this prototype under <a href="https://sketchfab.com/licenses" target="_blank" rel="noopener">Sketchfab Free Standard terms</a>. Do not extract, redistribute, or reuse the character as a standalone asset. Acquire your own license from the <a href="https://sketchfab.com/3d-models/indian-man-with-suit-720635f58afc408795d5b3e73c5bb8c5" target="_blank" rel="noopener">creator’s page</a> before production use.</p></div>`;
content.operations = `<h2 id="panel-title">Built for the everyday.</h2><p class="description">An operations studio for reconciliation, reporting, verification, and enterprise workflows.</p>${productList([...groups.payments.filter(([n]) => ['ReconX', 'Verification Suite', 'Banking & Financial Services Suite'].includes(n)), ...groups.business.filter(([n]) => ['B2B Solution', 'PigmyX'].includes(n))])}`;
content.lounge = `<h2 id="panel-title">A little room to connect.</h2><p class="description">Explore the people-facing side of Jodetx: communities, rewards, entertainment, and everyday services.</p>${productList(groups.business.filter(([n]) => ['RewardX', 'StoryBox', 'Saloonz', 'TempleG', 'Housing Society ERP'].includes(n)))}`;
content.cabin = `<h2 id="panel-title">A bigger perspective.</h2><p class="description">From payments to business platforms, explore the full portfolio or start a conversation with the team.</p><button class="panel-choice" data-panel="about">About Jodetx →</button><button class="panel-choice" data-panel="directory">All 21 product listings →</button>${contactLink}`;
content.about += `<section class="company-details"><h3>Visit Jodetx</h3><p>301-A & 301-B, Third Floor, WiFi Park IT Premises Society, Plot No. B-3, Road No. 1, Wagle Industrial Estate, Thane (West) - 400 604</p><a href="tel:+9102245243922">+91 022 4524 3922</a><br><a href="mailto:compliance@jodetx.com">compliance@jodetx.com</a><details><summary>Company information from the official website</summary><p>${escapeText(officialPages.about?.text || '').replace(/\n/g, '<br>')}</p>${(officialPages.about?.states || []).map(st => `<h3>${escapeText(st.label)}</h3><p>${escapeText(st.text).replace(/\n/g, '<br>')}</p>`).join('')}</details></section>`;
content.policies = `<h2 id="panel-title">Policies, clearly.</h2><p class="description">Official legal documents captured for reference. The live documents on Jodetx’s website take precedence.</p>${legalPages.map(l => `<details class="legal-document"><summary>${escapeText(l.name)}</summary><a href="${l.url}" target="_blank" rel="noopener">Open current official document ↗</a><p>${escapeText(l.text).replace(/\n/g, '<br>')}</p></details>`).join('')}`;
document.addEventListener('click', e => { const b = e.target.closest('[data-gallery-src]'); if (b) { const im = $('.official-preview'); im.src = b.dataset.gallerySrc; im.alt = b.getAttribute('aria-label'); } });
let currentFeature = 0;
document.addEventListener('click', e => { const b = e.target.closest('[data-feature],#feature-prev,#feature-next,#feature-play'); if (!b || !studio || !selectedProduct) return; if (b.id === 'feature-play') { const playing = studio.pause(); b.textContent = playing ? 'Pause walkthrough' : 'Play walkthrough'; b.setAttribute('aria-pressed', String(playing)); return } currentFeature = b.dataset.feature !== undefined ? Number(b.dataset.feature) : (currentFeature + (b.id === 'feature-next' ? 1 : -1) + selectedProduct.features.length) % selectedProduct.features.length; studio.select(currentFeature) });
function contactProgress() { const form = $('#enquiry-form'); if (!form) return; const fields = ['name', 'company', 'email', 'product', 'message']; const complete = fields.filter(n => { const f = form.elements[n]; return f.value.trim() && f.checkValidity() }).length; $('#form-progress-text').textContent = `${complete} of 5 required details complete`; $('#form-progress-bar').style.width = `${complete * 20}%`; }
document.addEventListener('focusin', e => { if (e.target.matches('#enquiry-form [data-stage]')) { const text = e.target.dataset.stage; studio?.focus(text); $('#contact-stage-label').textContent = text } });
document.addEventListener('input', e => { if (e.target.closest('#enquiry-form')) { const f = e.target; f.removeAttribute('aria-invalid'); if (['name', 'company'].includes(f.name)) f.setCustomValidity(f.value && !f.value.trim() ? 'Enter a name, not only spaces.' : ''); if (f.name === 'phone') f.setCustomValidity(f.value && !/^\+?[0-9 ()-]{7,25}$/.test(f.value) ? 'Use 7–25 characters: digits, spaces, parentheses, or an initial +.' : ''); if (f.name === 'message') f.setCustomValidity(f.value.trim().length < 10 ? 'Please describe your requirements using at least 10 characters.' : ''); contactProgress() } });
document.addEventListener('change', e => { if (e.target.closest('#enquiry-form')) contactProgress() });
document.addEventListener('invalid', e => { if (e.target.closest('#enquiry-form')) { e.target.setAttribute('aria-invalid', 'true'); $('#form-status').textContent = 'Please complete the highlighted fields and check their format.' } }, true);
document.addEventListener('reset', e => { if (e.target.id === 'enquiry-form') setTimeout(() => { if (!e.target.isConnected) return; for (const f of e.target.elements) if (f.setCustomValidity) f.setCustomValidity(''); contactProgress(); $('#form-status').textContent = ''; document.querySelectorAll('#enquiry-form [aria-invalid]').forEach(f => f.removeAttribute('aria-invalid')); studio?.focus('Your enquiry'); $('#contact-stage-label').textContent = 'A conversation starts here.'; $('#contact-studio').closest('.studio-shell').querySelector('.studio-caption p').textContent = 'Focus a field to follow the enquiry journey.' }, 0) });
document.addEventListener('submit', e => { if (e.target.id !== 'enquiry-form') return; e.preventDefault(); const form = e.target; if (!form.reportValidity()) return; const values = new FormData(form); const lines = ['JODETX — ENQUIRY DRAFT', 'This draft has not been sent.', '', ...['name', 'company', 'email', 'phone', 'product'].map(n => `${n[0].toUpperCase() + n.slice(1)}: ${values.get(n) || 'Not provided'}`), '', 'Requirements:', String(values.get('message')), '', 'Submit through https://jodetx.com/#/contact']; const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'Jodetx-Enquiry-Draft.txt'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); studio?.focus('Enquiry draft prepared'); $('#contact-stage-label').textContent = 'Your draft is prepared—not sent.'; $('#contact-studio').closest('.studio-shell').querySelector('.studio-caption p').textContent = 'Prepared locally. Continue to official onboarding to submit.'; form.hidden = true; $('#draft-confirmation').hidden = false; if (!reduced) $('#draft-confirmation').animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' }); $('#draft-confirmation').scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'nearest' }) });
document.addEventListener('click', e => { if (e.target.id === 'new-draft') { $('#enquiry-form').hidden = false; $('#draft-confirmation').hidden = true; $('#enquiry-form').reset(); $('#enquiry-form input').focus() } });
document.addEventListener('input', e => { if (e.target.id === 'product-search') renderCatalogue() }); document.addEventListener('click', e => { const product = e.target.closest('[data-product]'); if (product) return showProduct(product.dataset.product); const filter = e.target.closest('[data-filter]'); if (filter) { catalogueFilter = filter.dataset.filter; document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === filter))); renderCatalogue() } });
let cardAnimation = null, overlayAnimation = null, cardGeneration = 0;
function panel(id, fromArrival = false) { if (!content[id]) return; if (!fromArrival) recordRoute(id === 'product' ? '#/product/' + encodeURIComponent(selectedProduct.name) : '#/' + id); if (!fromArrival) cancelNavigation(); const wasOpen = wrap.classList.contains('open'); const generation = ++cardGeneration; cardAnimation?.cancel(); overlayAnimation?.cancel(); disposeStudio(); studio = null; previousFocus = document.activeElement; $('#panel-content').innerHTML = content[id]; $('#panel-tag').textContent = id === 'reception' ? 'Your visit starts here' : 'Inside Jodetx'; wrap.classList.add('open'); $('.panel').scrollTop = 0; $('.panel').classList.toggle('wide', id === 'directory' || id === 'product' || id === 'contact'); if (id === 'directory') { catalogueFilter = 'all'; renderCatalogue() } if (id === 'product') { currentFeature = 0; studio = safeStudio($('#product-studio'), { product: selectedProduct, isReduced: () => reduced, onFeature: i => { currentFeature = i; studioFeature(i) } }) } if (id === 'contact') { studio = safeStudio($('#contact-studio'), { mode: 'contact', isReduced: () => reduced }); contactProgress() } if (!reduced) { cardAnimation = $('.panel').animate([{ opacity: 0, transform: 'translate3d(0,24px,0) scale(.98)' }, { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' }); if (!wasOpen) overlayAnimation = wrap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' }); } $('#close').focus({ preventScroll: true }); }
function close() { if (!wrap.classList.contains('open')) return; if (!restoringRoute) history.replaceState(null, '', '#/'); const generation = ++cardGeneration; cardAnimation?.cancel(); overlayAnimation?.cancel(); const finish = () => { if (generation !== cardGeneration) return; wrap.classList.remove('open'); disposeStudio(); studio = null; if (previousFocus?.isConnected) previousFocus.focus(); else[...document.querySelectorAll('header button')].find(b => b.offsetParent !== null)?.focus(); }; if (reduced) { finish(); return } cardAnimation = $('.panel').animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(12px)' }], { duration: 220, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }); overlayAnimation = wrap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease-in', fill: 'forwards' }); overlayAnimation.finished.then(finish).catch(() => { }); }
$('#close').onclick = close; wrap.onclick = e => { if (e.target === wrap) close() }; document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); if (e.key === 'Tab' && wrap.classList.contains('open')) { let a = [...wrap.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')].filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length); let first = a[0], last = a[a.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() } } });
let go = () => { }, entered = false; document.addEventListener('click', e => { const b = e.target.closest('[data-panel],[data-room],[data-go],[data-close]'); if (!b) return; if (b.hasAttribute('data-close')) return close(); if (b.dataset.panel) return panel(b.dataset.panel); if (b.dataset.go) { close(); return go(b.dataset.go) } if (b.dataset.room) { close(); go(b.dataset.room) } });
let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; const motionButton = $('#motion'); function motionLabel() { document.body.classList.toggle('reduce-motion', reduced); motionButton.textContent = reduced ? 'Motion reduced' : 'Motion on'; motionButton.setAttribute('aria-pressed', String(reduced)) } motionLabel(); motionButton.onclick = () => { reduced = !reduced; motionLabel(); if (reduced && window.__jodetx) { const n = window.__jodetx.navigation(); if (n.state === 'travelling' || n.state === 'settling') go(n.destination) } };
function restoreRoute() { restoringRoute = true; try { const route = location.hash.replace(/^#\//, ''); if (route.startsWith('product/')) showProduct(decodeURIComponent(route.slice(8))); else if (route.startsWith('office/')) go(route.slice(7)); else if (content[route]) panel(route); else close(); } catch (e) { console.warn('Invalid app route'); } finally { restoringRoute = false; } } window.addEventListener('hashchange', restoreRoute);
init().then(restoreRoute).catch(e => { console.error(e); document.body.classList.add('graphics-unavailable'); $('#loading').classList.add('done'); $('#fallback').style.display = 'block'; $('#intro').style.display = 'none'; $('#toolbar').style.display = 'none'; });
async function init() {
  const stage = $('#stage'), scene = new THREE.Scene(); scene.background = new THREE.Color('#f1f0eb'); scene.fog = new THREE.Fog('#f1f0eb', 85, 160);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); renderer.setPixelRatio(Math.min(stage.clientWidth < 650 ? 1.25 : 1.6, devicePixelRatio || 1)); const maxAnisotropy = renderer.capabilities.getMaxAnisotropy(); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.16; stage.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-label', '3D cutaway office. Use the destination buttons to explore.');
  const camera = new THREE.OrthographicCamera(-15, 15, 10, -10, .1, 200); camera.position.set(20, 19, 24); let camTarget = new THREE.Vector3(0, .3, 0); camera.lookAt(camTarget);
  scene.add(new THREE.HemisphereLight('#e8f1fa', '#8d8778', 2.1)); const sun = new THREE.DirectionalLight('#fff4df', 3.5); sun.position.set(-12, 22, 12); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -22; sun.shadow.camera.right = 22; sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -22; sun.shadow.normalBias = .04; sun.shadow.bias = -.00004; scene.add(sun); scene.add(sun.target); const fill = new THREE.DirectionalLight('#d5edff', .9); fill.position.set(10, 7, -7); scene.add(fill);
  const mats = {}; const mat = (name, color, rough = .8, metal = 0) => mats[name] = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  mat('stone', '#e5e1d8'); mat('wall', '#f3f1e9'); mat('edge', '#beb9a9'); mat('navy', '#1f3347', .65); mat('metal', '#343f45', .4, .45); mat('rubber', '#262f33', .92); mat('white', '#faf9f4'); mat('blue', '#047da4', .6); mat('fabric', '#8c9b9b'); mat('sofa', '#dcd9cf', .85); mat('skin', '#be8c68'); mat('hair', '#302b28'); mat('trousers', '#27394a'); mat('shirt', '#527b91'); mat('leaf', '#456447'); mat('leaf2', '#62815c'); mat('soil', '#554939'); mat('pot', '#b8a78b'); mat('book', '#74868a'); mat('paper', '#faf8f2', .85); mat('roadStripe', '#edeae0', .85); mats.roadStripe.polygonOffset = true; mats.roadStripe.polygonOffsetFactor = -1.5; mats.roadStripe.polygonOffsetUnits = -3;
  mat('darkWood', '#3e2b1f', .75); mat('walnut', '#453123', .72); mat('smokedOak', '#281f18', .7); mat('whiteDesk', '#f7f6f2', .65); mat('graphiteDesk', '#32383e', .7); mat('marbleTravertine', '#ebe6dd', .6); mat('deskPad', '#1c1d20', .7);
  mat('sofaTerracotta', '#a8533b', .85); mat('sofaForest', '#36523f', .85); mat('sofaTeal', '#224d56', .85); mat('sofaMustard', '#c98535', .85); mat('sofaCharcoal', '#323940', .88); mat('fabricCognac', '#9a5b35', .68); mat('fabricSage', '#627e66', .85); mat('fabricBlush', '#a86975', .85);
  mat('rugReception', '#ded7c8', .95); mat('rugPayments', '#1b2a38', .92); mat('rugBusiness', '#b89264', .88); mat('rugMeeting', '#222830', .95); mat('rugOperations', '#2d353d', .9); mat('rugLounge', '#964d3b', .95); mat('rugCabin', '#172332', .92);
  mat('goldTrim', '#cba158', .35, .75); mat('brass', '#d4ab5d', .3, .8); mat('ceramicTerracotta', '#b85e3f', .75); mat('ceramicWhite', '#f7f6f2', .7); mat('ceramicSage', '#68826e', .75); mat('ceramicCobalt', '#1b436e', .7); mat('ceramicBlack', '#222326', .8);
  mat('laptopSilver', '#b6bcc2', .35, .7); mat('laptopSpaceGrey', '#484d52', .4, .65); mat('laptopGold', '#cca97c', .35, .65); mat('laptopBlack', '#242629', .5, .4);
  mat('bookNavy', '#1b3650', .8); mat('bookRed', '#88343f', .8); mat('bookAmber', '#cb802d', .8); mat('bookForest', '#2f553e', .8); mat('bookTeal', '#1d5862', .8); mat('bookTerracotta', '#9d4f3b', .8); mat('bookGold', '#bfa052', .5, .5);
  mat('carRed', '#882026', .3, .28); mat('carBlue', '#1f3a54', .3, .28); mat('carCream', '#d8d4ca', .3, .28); mat('carGreen', '#224532', .3, .28); mat('carGrey', '#464d52', .3, .28); mat('carGold', '#b89d6e', .3, .28);
  function tex(kind) { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = kind === 'wood' ? '#b59973' : '#e4e0d8'; x.fillRect(0, 0, 512, 512); let seed = 17; function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 } for (let i = 0; i < 2500; i++) { const a = rand(), b = rand(); x.strokeStyle = kind === 'wood' ? `rgba(77,54,31,${rand() * .1})` : `rgba(113,106,94,${rand() * .035})`; x.lineWidth = rand() * 1.5; x.beginPath(); x.moveTo(0, b * 512); x.bezierCurveTo(150, b * 512 + rand() * 5, 360, b * 512 - rand() * 4, 512, b * 512 + rand() * 8); x.stroke(); if (kind !== 'wood') { x.fillStyle = `rgba(150,144,133,${rand() * .05})`; x.fillRect(a * 512, b * 512, rand() * 22, 1) } } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAnisotropy; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(kind === 'wood' ? 1 : 3, kind === 'wood' ? 1 : 3); return t }
  mats.wood = new THREE.MeshStandardMaterial({ map: tex('wood'), roughness: .78 }); mats.floor = new THREE.MeshStandardMaterial({ map: tex('stone'), roughness: .9 }); const glass = new THREE.MeshPhysicalMaterial({ color: '#9ac6ce', metalness: 0, roughness: .12, transparent: true, opacity: .15, depthWrite: false, side: THREE.DoubleSide }); glass.forceSinglePass = true;
  const staticObjects = []; let dynamic = false; const boxGeo = new THREE.BoxGeometry(1, 1, 1); const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 20); const sphereGeo = new THREE.SphereGeometry(1, 16, 12);
  function mesh(geo, m, x, y, z, sx = 1, sy = 1, sz = 1, parent = scene) { const o = new THREE.Mesh(geo, typeof m === 'string' ? mats[m] : m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = m !== glass; o.receiveShadow = m !== glass; parent.add(o); if (parent === scene && !dynamic && m !== glass) staticObjects.push(o); return o }
  const box = (x, y, z, w, h, d, m = 'white', p = scene) => mesh(boxGeo, m, x, y, z, w, h, d, p); const softBox = (x, y, z, w, h, d, m = 'white', p = scene, r = .05) => mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 3, h / 3, d / 3)), m, x, y, z, 1, 1, 1, p); const cyl = (x, y, z, r, h, m = 'metal', p = scene) => mesh(cylinderGeo, m, x, y, z, r, h, r, p);
  function textPlane(text, w, h, color = '#17283f', size = 64, bg = null) { const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w); let x = c.getContext('2d'); if (bg) { x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height) } x.fillStyle = color; x.font = `500 ${size}px Arial`; while (x.measureText(text).width > c.width - 64 && size > 16) { size -= 2; x.font = `500 ${size}px Arial` } x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, c.height / 2); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAnisotropy; return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !bg, depthWrite: false, alphaTest: .02, side: THREE.FrontSide })) }
  function wallLabel(text, x, y, z, w = 3, h = .45) { const o = textPlane(text, w, h, '#243d50', 80); o.position.set(x, y, z); scene.add(o); return o }
  // Elevated architectural model. The front and right elevations are intentionally cut away.
  box(0, -.3, 0, 18.4, .6, 18.2, 'stone'); box(0, .015, 0, 18, .08, 17.8, 'floor'); box(0, -.58, 0, 18.7, .08, 18.5, 'edge'); box(0, -.65, 0, 19.3, .12, 19.1, 'wall');
  const backWallMaterial = mats.wall; const sideWallMaterial = mats.wall; const backWall = box(0, 1.9, -8.8, 18, 3.8, .18, 'wall'); const sideWall = box(-16.9, 1.9, -2.8, .18, 3.8, 12, 'wall'); const eastSideWall = box(16.9, 1.9, -2.8, .18, 3.8, 12, 'wall'); box(0, .15, -8.6, 17.8, .25, .08, 'wood'); box(-8.7, .15, -2.8, .08, .25, 12, 'wood'); box(16.9, .15, -2.8, .08, .25, 12, 'wood');
  // Tall glazing, mullions and an uninterrupted view along the rear elevation.
  for (let x = -7.7; x < 8.5; x += 2.4) { box(x, 2.2, -8.64, 2.25, 2.65, .03, glass); box(x - 1.17, 2.2, -8.58, .055, 2.9, .07, 'metal') } box(.3, 3.68, -8.58, 17.3, .07, .12, 'metal'); box(.3, .76, -8.58, 17.3, .07, .12, 'metal');
  // Fine-leaved planting, kept muted rather than rounded toy-like shrubs.
  const foliageShape = new THREE.Shape(); foliageShape.moveTo(0, 0); foliageShape.quadraticCurveTo(-.07, .15, 0, .28); foliageShape.quadraticCurveTo(.07, .15, 0, 0); const foliageGeo = new THREE.ShapeGeometry(foliageShape, 4); mats.leaf.side = mats.leaf2.side = THREE.DoubleSide;
  function hedge(x, z, rx = .35, ry = .35, rz = .4) { for (let i = 0; i < 100; i++) { const t = i * 2.39996, fy = (i + .5) / 100, rad = Math.sqrt(1 - Math.pow(fy * 2 - 1, 2)); const o = mesh(foliageGeo, i % 4 ? 'leaf' : 'leaf2', x + Math.cos(t) * rx * rad, -.11 + fy * ry * 1.7, z + Math.sin(t) * rz * rad, .8, .8, .8); o.rotation.set(Math.sin(t) * .8, t, Math.cos(t) * .6) } }
  // Landscape beyond the glazing. Muted distant forms rather than an invented skyline.
  box(0, -.25, -11, 19, .12, 4, 'sofa'); for (let i = 0; i < 25; i++) { const x = -9 + i * .75; hedge(x, -11.4, .6, .48, .7) }
  for (let z = -7.9; z < 8.5; z += 1.55)box(0, .062, z, 18, .004, .015, 'edge'); for (let x = -8; x < 9; x += 1.7)box(x, .063, 0, .012, .004, 17.5, 'edge');
  // A clear circulation spine connects all destinations.
  box(0, .071, -1, 2.05, .012, 13.6, 'wall'); for (const x of [-1.04, 1.04]) box(x, .079, -1, .015, .007, 13.6, 'wood');
  function slats(x, z, w, h) { box(x, h / 2, z, w, h, .12, 'navy'); for (let a = x - w / 2 + .06; a < x + w / 2; a += .12)box(a, h / 2, z + .09, .045, h, .09, 'wood') }
  slats(-4.2, -1.9, 5.8, .8); slats(4.9, -1.9, 5.6, .8);
  function partition(x, z, w, angle = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = angle; scene.add(g); box(0, 1.3, 0, w, 2.6, .025, glass, g); for (let a = -w / 2; a <= w / 2 + .01; a += w / 3) { box(a, 1.3, .03, .035, 2.6, .045, 'metal', g) } box(0, 2.6, .03, w, .04, .045, 'metal', g); box(0, .12, .03, w, .1, .04, 'metal', g) }
  partition(-5, -4.5, 7); partition(5.3, -4.5, 6.5); partition(-1.5, -6.6, 4.2, Math.PI / 2);
  // Distinct Room Flooring / Rugs with rich thematic palettes
  box(6.3, .065, 3.3, 4.2, .008, 4.2, 'rugReception'); box(6.3, .068, 3.3, 4.35, .004, 4.35, 'wood');
  box(-5.28, .065, -5.1, 5.8, .008, 6.2, 'rugPayments'); box(-5.28, .068, -5.1, 5.95, .004, 6.35, 'edge');
  box(5.28, .065, -5.1, 5.8, .008, 6.2, 'rugBusiness'); box(5.28, .068, -5.1, 5.95, .004, 6.35, 'goldTrim');
  box(.75, .065, -6.55, 4.2, .008, 3.4, 'rugMeeting'); box(.75, .068, -6.55, 4.35, .004, 3.55, 'goldTrim');
  // Reception: fluted oak desk, stone countertop and the brand mark.
  slats(-2.7, 2.45, 4.6, 1.08); box(-2.7, 1.12, 2.4, 4.8, .12, 1.02, 'marbleTravertine'); box(-2.7, .55, 2.09, 4.5, 1.1, .7, 'wood'); wallLabel('RECEPTION', -2.7, .7, 2.57, 2.35, .27);
  const screenCache = new Map(); function getScreen(type = 'dashboard') { if (screenCache.has(type)) return screenCache.get(type).clone(); const c = document.createElement('canvas'); c.width = 768; c.height = 432; const ctx = c.getContext('2d'); if (type === 'payments') { ctx.fillStyle = '#101d2a'; ctx.fillRect(0, 0, 768, 432); ctx.fillStyle = '#b0c8d8'; ctx.font = 'bold 22px Arial'; ctx.fillText('Jodetx / Payments Orchestration', 28, 42); ctx.font = '14px Arial'; ctx.fillStyle = '#00d084'; ctx.fillText('● LIVE TRANSACTION ROUTING — 99.98% SUCCESS', 28, 70);[['UPI / IMPS Gateway', '42,850 tx/m', '#00e5ff'], ['ReconX Automated', '100% Settled', '#00d084'], ['Connected Banking', '< 180ms Latency', '#69b4ff']].forEach(([title, val, col], i) => { ctx.fillStyle = '#172838'; ctx.fillRect(28 + i * 238, 96, 222, 85); ctx.fillStyle = '#8ca5b5'; ctx.font = '13px Arial'; ctx.fillText(title, 42 + i * 238, 124); ctx.fillStyle = col; ctx.font = 'bold 20px Arial'; ctx.fillText(val, 42 + i * 238, 156); }); ctx.strokeStyle = '#00d084'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i < 20; i++) { let x = 30 + i * 25, y = 330 - Math.sin(i * .45) * 45 - i * 5; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) } ctx.stroke(); ctx.strokeStyle = '#1e3345'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(28, 225 + i * 42); ctx.lineTo(520, 225 + i * 42); ctx.stroke(); } for (let i = 0; i < 5; i++) { ctx.fillStyle = '#1e3345'; ctx.fillRect(570, 225 + i * 32, 160, 10); ctx.fillStyle = i === 1 ? '#00e5ff' : '#00d084'; ctx.fillRect(570, 225 + i * 32, 145 - i * 18, 10); } } else if (type === 'operations') { ctx.fillStyle = '#121820'; ctx.fillRect(0, 0, 768, 432); ctx.fillStyle = '#c5d2dc'; ctx.font = 'bold 22px Arial'; ctx.fillText('Jodetx / Operations Studio', 28, 42); ctx.font = '14px Arial'; ctx.fillStyle = '#00b4d8'; ctx.fillText('● SYSTEM CLUSTER HEALTH — ALL NODES ACTIVE', 28, 70);[['Verification Suite', '12,410 Verified', '#00b4d8'], ['Banking APIs', '24ms Ping', '#48cae4'], ['Queue Backlog', '0 Tasks Pending', '#f3722c']].forEach(([title, val, col], i) => { ctx.fillStyle = '#1a2430'; ctx.fillRect(28 + i * 238, 96, 222, 85); ctx.fillStyle = '#8ea1b0'; ctx.font = '13px Arial'; ctx.fillText(title, 42 + i * 238, 124); ctx.fillStyle = col; ctx.font = 'bold 20px Arial'; ctx.fillText(val, 42 + i * 238, 156); }); ctx.strokeStyle = '#00b4d8'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 20; i++) { let x = 30 + i * 25, y = 305 + Math.sin(i * .8) * 35; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) } ctx.stroke(); ctx.strokeStyle = '#223242'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(28, 225 + i * 42); ctx.lineTo(520, 225 + i * 42); ctx.stroke(); } for (let i = 0; i < 5; i++) { ctx.fillStyle = '#223242'; ctx.fillRect(570, 225 + i * 32, 160, 10); ctx.fillStyle = i === 4 ? '#f3722c' : '#00b4d8'; ctx.fillRect(570, 225 + i * 32, 130 - i * 15, 10); } } else if (type === 'business') { ctx.fillStyle = '#152128'; ctx.fillRect(0, 0, 768, 432); ctx.fillStyle = '#cad6d6'; ctx.font = 'bold 22px Arial'; ctx.fillText('Jodetx / Business Systems', 28, 42); ctx.font = '14px Arial'; ctx.fillStyle = '#d48834'; ctx.fillText('● ENTERPRISE ERP & WORKFLOW SUITE', 28, 70);[['Active Workspaces', '1,420 Tenants', '#d48834'], ['Platform Analytics', '+34.2% Growth', '#29a3a8'], ['Automation Rules', '8,950 Active', '#e2a95c']].forEach(([title, val, col], i) => { ctx.fillStyle = '#1e2c34'; ctx.fillRect(28 + i * 238, 96, 222, 85); ctx.fillStyle = '#8ca0a8'; ctx.font = '13px Arial'; ctx.fillText(title, 42 + i * 238, 124); ctx.fillStyle = col; ctx.font = 'bold 20px Arial'; ctx.fillText(val, 42 + i * 238, 156); }); ctx.strokeStyle = '#d48834'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 16; i++) { let x = 36 + i * 32, y = 330 - (i % 4) * 26 - i * 4; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) } ctx.stroke(); ctx.strokeStyle = '#253742'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(28, 225 + i * 42); ctx.lineTo(520, 225 + i * 42); ctx.stroke(); } for (let i = 0; i < 5; i++) { ctx.fillStyle = '#253742'; ctx.fillRect(570, 225 + i * 32, 160, 10); ctx.fillStyle = i % 2 ? '#29a3a8' : '#d48834'; ctx.fillRect(570, 225 + i * 32, 140 - i * 16, 10); } } else if (type === 'director') { ctx.fillStyle = '#0f1722'; ctx.fillRect(0, 0, 768, 432); ctx.fillStyle = '#e8dcc4'; ctx.font = 'bold 22px Arial'; ctx.fillText('JODETX / EXECUTIVE DIRECTORY', 28, 42); ctx.font = '14px Arial'; ctx.fillStyle = '#cfa356'; ctx.fillText('● STRATEGIC PORTFOLIO & ENTERPRISE SCALE', 28, 70);[['Processed Vol', '₹ 4,820 Cr / Q3', '#cfa356'], ['Enterprise Clients', '250+ Banking Partners', '#5bc0be'], ['Annual Growth', '+142% Year-on-Year', '#e0c58a']].forEach(([title, val, col], i) => { ctx.fillStyle = '#172230'; ctx.fillRect(28 + i * 238, 96, 222, 85); ctx.fillStyle = '#9cb0c2'; ctx.font = '13px Arial'; ctx.fillText(title, 42 + i * 238, 124); ctx.fillStyle = col; ctx.font = 'bold 20px Arial'; ctx.fillText(val, 42 + i * 238, 156); }); ctx.strokeStyle = '#cfa356'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i < 20; i++) { let x = 30 + i * 25, y = 345 - Math.pow(i / 19, 1.8) * 115; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) } ctx.stroke(); ctx.strokeStyle = '#1d2c3d'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(28, 225 + i * 42); ctx.lineTo(520, 225 + i * 42); ctx.stroke(); } for (let i = 0; i < 5; i++) { ctx.fillStyle = '#1d2c3d'; ctx.fillRect(570, 225 + i * 32, 160, 10); ctx.fillStyle = i === 0 ? '#5bc0be' : '#cfa356'; ctx.fillRect(570, 225 + i * 32, 150 - i * 14, 10); } } else { ctx.fillStyle = '#162838'; ctx.fillRect(0, 0, 768, 432); ctx.fillStyle = '#b6cad4'; ctx.font = 'bold 22px Arial'; ctx.fillText('Jodetx / Living Office', 28, 42); ctx.font = '14px Arial'; ctx.fillStyle = '#8ba6b4'; ctx.fillText('WORKSPACE CONCIERGE & DIRECTORY', 28, 70);['Payments', 'Reconciliation', 'Operations'].forEach((t, i) => { ctx.fillStyle = '#223f50'; ctx.fillRect(28 + i * 240, 96, 220, 85); ctx.fillStyle = '#77b8cb'; ctx.font = '16px Arial'; ctx.fillText(t, 43 + i * 240, 134); }); ctx.strokeStyle = '#65afc3'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i < 18; i++) { let x = 32 + i * 27, y = 310 - Math.sin(i * .6) * 35 - i * 3; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) } ctx.stroke(); ctx.strokeStyle = '#3b5665'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(28, 230 + i * 42); ctx.lineTo(520, 230 + i * 42); ctx.stroke(); } for (let i = 0; i < 5; i++) { ctx.fillStyle = i === 2 ? '#53a3bb' : '#446273'; ctx.fillRect(578, 227 + i * 32, 132 - i * 10, 8); } } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAnisotropy; const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(.74, .41), new THREE.MeshBasicMaterial({ map: t })); screenCache.set(type, screenMesh); return screenMesh; }
  function dashboardScreen() { return getScreen('dashboard'); }
  function monitor(x, z, rot = 0, type = 'dashboard') { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); box(0, .96, 0, .09, .28, .06, 'metal', g); box(0, .808, .02, .36, .014, .22, 'metal', g); softBox(0, 1.17, 0, .81, .48, .055, 'metal', g, .012); box(0, 1.17, .032, .74, .41, .012, 'navy', g); box(0, .807, .33, .46, .012, .14, 'metal', g); for (let row = 0; row < 4; row++)for (let col = 0; col < 12; col++)box(-.20 + col * .036, .816, .285 + row * .028, .022, .006, .016, 'fabric', g); softBox(.44, .814, .28, .09, .022, .14, 'navy', g, .012); const screen = getScreen(type); screen.position.set(0, 1.17, .043); g.add(screen); }
  monitor(-3.6, 2.14, Math.PI, 'reception'); cyl(-1.1, 1.21, 2.22, .10, .12, 'ceramicTerracotta');
  box(-5.55, 2.4, -8.38, 5.65, 1.5, .06, backWallMaterial); const logoTexture = new THREE.TextureLoader().load('__LOGO_URL__'); logoTexture.colorSpace = THREE.SRGBColorSpace; logoTexture.anisotropy = maxAnisotropy; logoTexture.minFilter = THREE.LinearMipmapLinearFilter; logoTexture.magFilter = THREE.LinearFilter; const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.9, .92), new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, depthWrite: false, alphaTest: .02, side: THREE.FrontSide })); logoMesh.position.set(-5.55, 2.64, -8.32); scene.add(logoMesh); wallLabel('PAYMENTS & CONNECTED BANKING', -5.5, 2.10, -8.31, 5.2, .35); wallLabel('BUSINESS SYSTEMS', 4.65, 2.2, -8.45, 4.3, .4);
  function chair(x, z, rot = 0, theme = 'navy') { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); const frameMat = theme === 'director' ? 'goldTrim' : 'metal'; cyl(0, .29, 0, .048, .45, frameMat, g); for (let a = 0; a < 5; a++) { const angle = a * Math.PI * 2 / 5; const caster = cyl(Math.sin(angle) * .30, .11, Math.cos(angle) * .30, .055, .065, 'rubber', g); caster.rotation.z = Math.PI / 2; const arm = box(0, .13, .17, .038, .035, .37, frameMat, g); arm.rotation.y = a * Math.PI * 2 / 5; arm.position.x = Math.sin(a * Math.PI * 2 / 5) * .16; arm.position.z = Math.cos(a * Math.PI * 2 / 5) * .16 } const seatMat = theme === 'cognac' ? 'fabricCognac' : theme === 'teal' ? 'sofaTeal' : theme === 'charcoal' ? 'sofaCharcoal' : theme === 'emerald' ? 'sofaForest' : theme === 'director' ? 'darkWood' : 'navy'; const backMat = theme === 'cognac' ? 'fabricCognac' : theme === 'teal' ? 'sofaTeal' : theme === 'charcoal' ? 'sofaCharcoal' : theme === 'emerald' ? 'sofaForest' : theme === 'director' ? 'smokedOak' : 'fabric'; const ribMat = theme === 'cognac' ? 'goldTrim' : theme === 'director' ? 'goldTrim' : 'sofa'; softBox(0, .53, 0, .61, .11, .57, seatMat, g); const back = softBox(0, .94, -.27, .56, .7, .10, backMat, g); back.rotation.x = -.09; for (let i = 0; i < 5; i++)box(0, .74 + i * .08, -.205, .43, .008, .008, ribMat, g); for (const dx of [-.23, .23]) { const spine = box(dx, .93, -.33, .022, .66, .025, frameMat, g); spine.rotation.x = -.09; } for (let i = 0; i < 5; i++) { const angle = i * Math.PI * 2 / 5; const wheel = cyl(Math.sin(angle) * .33, .075, Math.cos(angle) * .33, .043, .032, frameMat, g); wheel.rotation.z = Math.PI / 2; } for (let s of [-1, 1]) { box(s * .33, .64, 0, .03, .27, .03, frameMat, g); box(s * .33, .77, .02, .06, .04, .33, seatMat, g) } }
  function desk(x, z, rot = 0, topMat = 'wood', legMat = 'white', chairTheme = 'navy', screenType = 'dashboard', acc = {}) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); softBox(0, .75, 0, 2.45, .10, 1.15, topMat, g, .035); for (const xx of [-1.02, 1.02]) { box(xx, .39, 0, .065, .73, .83, legMat, g) } box(0, .59, 0, 2.1, .04, .08, 'metal', g); box(.86, .55, -.16, .42, .5, .66, legMat, g); box(-.58, .808, .08, .38, .010, .52, 'paper', g); box(-.57, .816, .07, .34, .004, .46, 'white', g); box(-.34, .808, .12, .015, .008, .18, 'brass', g); cyl(.84, .86, .27, .08, .12, acc.cup || 'white', g); monitor(x, z - .25, rot, screenType); chair(x, z + 1.0, rot + Math.PI, chairTheme) }
  for (const x of [-6.7, -3.85]) for (const z of [-6.8, -3.4]) desk(x, z, 0, 'whiteDesk', 'metal', 'navy', 'payments', { cup: 'ceramicBlack' });
  for (const x of [3.85, 6.7]) desk(x, -3.4, 0, 'wood', 'white', 'teal', 'business', { cup: 'ceramicTerracotta' });
  // Business lounge: quiet shelves, sofas and space for a conversation.
  function sofa(x, z, rot = 0, bodyMat = 'sofa', cushionMat = 'fabric', legMat = 'wood') { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); softBox(0, .33, 0, 2.1, .4, .86, bodyMat, g); softBox(0, .79, -.35, 2.1, .62, .21, bodyMat, g); for (const a of [-1.04, 1.04]) softBox(a, .65, 0, .18, .55, .89, bodyMat, g); for (const a of [-.5, .5]) { softBox(a, .57, .07, .9, .14, .6, cushionMat, g); softBox(a, .88, -.23, .90, .48, .16, bodyMat, g); box(a, .60, .39, .82, .006, .006, 'edge', g) } for (const a of [-.88, .88]) for (const b of [-.28, .28]) box(a, .09, b, .065, .18, .065, legMat, g) }
  sofa(6.45, -6.9, 0, 'sofaForest', 'sofaMustard', 'darkWood'); sofa(7.7, -5.1, -Math.PI / 2, 'sofaForest', 'sofaMustard', 'darkWood'); box(5.45, .46, -5.35, 1.6, .08, .8, 'darkWood'); for (const x of [4.83, 6.08]) box(x, .24, -5.35, .08, .42, .65, 'wood'); box(5.65, .53, -5.35, .35, .05, .42, 'bookAmber');
  box(8.45, 1.25, -6.55, .32, 2.5, 3.0, 'wood'); for (const y of [.2, .8, 1.4, 2.0, 2.5]) box(8.24, y, -6.55, .6, .05, 3, 'wood'); const bookColors = ['bookNavy', 'bookAmber', 'bookRed', 'bookForest', 'bookTeal', 'bookTerracotta', 'bookGold', 'bookNavy', 'bookAmber', 'bookForest', 'bookRed', 'bookTeal']; for (let a = 0; a < 12; a++) { box(8.17, 1.65, -7.7 + a * .17, .27, .4, .12, bookColors[a]) }
  // Meeting suite sits at the end of the circulation spine.
  softBox(.75, .82, -6.55, 1.7, .10, 2.3, 'walnut', scene, .03); box(.75, .875, -6.55, .22, .015, .8, 'goldTrim'); for (const z of [-7.3, -5.8]) box(.75, .43, z, .58, .76, .16, 'metal'); for (const z of [-7.23, -5.98]) { chair(-.7, z, Math.PI / 2, 'cognac'); chair(2.1, z, -Math.PI / 2, 'cognac') } box(.74, .89, -6.43, .5, .025, .34, 'paper'); cyl(.75, .885, -6.55, .09, .025, 'ceramicBlack'); cup(-.3, .875, -6.3, 'ceramicCobalt'); cup(1.7, .875, -6.8, 'ceramicCobalt'); wallLabel('LET’S TALK', .65, 2.5, -8.43, 2.2, .45);
  // Reception waiting area.
  sofa(5.6, 4.1, Math.PI, 'sofa', 'sofaTerracotta', 'wood'); sofa(7.65, 2.6, -Math.PI / 2, 'sofa', 'sofaTerracotta', 'wood'); box(5.6, .45, 2.65, 1.8, .08, .8, 'marbleTravertine'); for (let xx of [4.95, 6.25]) box(xx, .24, 2.65, .04, .42, .6, 'goldTrim'); box(5.65, .52, 2.65, .4, .055, .35, 'paper'); cup(5.15, .51, 2.65, 'ceramicTerracotta');
  // Plants use individually arranged, tapered leaves; no billboard trees.
  function plant(x, z, r = .45, h = 1.8, potMat = 'pot') { const pot = new THREE.Mesh(new THREE.CylinderGeometry(r * .7, r * .51, .62, 24), typeof potMat === 'string' ? mats[potMat] : potMat); pot.position.set(x, .31, z); pot.castShadow = true; scene.add(pot); staticObjects.push(pot); cyl(x, .63, z, r * .62, .025, 'soil'); cyl(x, h / 2 + .4, z, .028, h - .45, 'wood'); for (let i = 0; i < 27; i++) { const angle = i * 2.39996, y = .88 + (i % 7) * .135, len = .35 + (i % 5) * .055; const stem = cyl(x + Math.cos(angle) * len * .25, y + .055, z + Math.sin(angle) * len * .25, .008, len * .6, 'wood'); stem.rotation.z = Math.cos(angle) * .82; stem.rotation.x = Math.sin(angle) * .82; const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.bezierCurveTo(-.14, .12, -.19, .38, 0, .64); leafShape.bezierCurveTo(.19, .38, .14, .12, 0, 0); const geo = new THREE.ShapeGeometry(leafShape, 10); geo.computeVertexNormals(); const leafMat = mats[i % 2 ? 'leaf' : 'leaf2']; leafMat.side = THREE.DoubleSide; const leaf = mesh(geo, leafMat, x + Math.cos(angle) * len * .3, y + .07, z + Math.sin(angle) * len * .3, .75, .9, .75); leaf.rotation.set(.8 * Math.sin(angle), angle, .85 * Math.cos(angle)); } }
  plant(-7.6, 3.1, .53, 2.0, 'ceramicWhite'); plant(-6.6, 7, .55, 1.9, 'pot'); plant(7.5, 6.75, .5, 1.7, 'ceramicWhite'); plant(3.2, -7.85, .36, 1.5, 'brass'); plant(-7.65, -.3, .35, 1.55, 'ceramicBlack'); plant(7.7, -.25, .35, 1.45, 'pot'); plant(-1.1, -3.9, .28, 1.35, 'pot');
  function cup(x, y, z, cupMat = 'white') { const shape = [new THREE.Vector2(.04, 0), new THREE.Vector2(.066, .01), new THREE.Vector2(.068, .12), new THREE.Vector2(.055, .125), new THREE.Vector2(.052, .025)]; mesh(new THREE.LatheGeometry(shape, 24), cupMat, x, y, z); const handle = mesh(new THREE.TorusGeometry(.040, .009, 8, 18), cupMat, x + .072, y + .066, z); cyl(x, y + .025, z, .052, .003, 'soil'); cyl(x, y - .012, z, .10, .015, cupMat) }
  cup(-1.65, 1.19, 2.25, 'ceramicTerracotta');
  function laptop(x, y, z, bodyMat = 'metal') { softBox(x, y, z, .49, .02, .32, bodyMat, scene, .006); const lid = softBox(x, y + .17, z - .125, .49, .31, .014, bodyMat, scene, .005); lid.rotation.x = -.16; const screen = mesh(new THREE.PlaneGeometry(.43, .255), mats.navy, x, y + .17, z - .108); screen.rotation.x = -.16; softBox(x, y + .015, z + .07, .13, .001, .09, 'fabric', scene, .006) }
  laptop(-5.8, .816, -3.3, 'laptopSpaceGrey'); laptop(4.5, .816, -3.3, 'laptopSilver');
  for (let i = 0; i < 12; i++) { const z = -7.7 + i * .17; box(8.02, 1.71, z, .005, .009, .065, 'paper'); box(8.02, 1.65, z, .005, .05, .008, 'paper') }
  // Framed architectural artwork, avoiding invented logos or photographs.
  box(-8.74, 2.1, -1.6, .055, 1.15, 1.65, 'wood'); box(-8.70, 2.1, -1.6, .025, 1.05, 1.55, 'paper'); box(-8.68, 2.1, -1.6, .01, .7, .7, 'fabric'); box(-8.67, 2.1, -1.6, .005, .045, 1.1, 'navy');
  // Low entrance glazing leaves the architecture readable in a cutaway view.
  for (const x of [-6.4, 6.4]) { box(x, .58, 7.75, 4.8, 1.16, .018, glass); for (const dx of [-2.4, 2.4]) box(x + dx, .62, 7.75, .035, 1.23, .035, 'metal') }
  box(0, .03, 8.35, 2.6, .055, .8, 'wood'); const doors = []; for (const x of [-.64, .64]) { let g = new THREE.Group(); g.position.set(x, 0, 7.72); scene.add(g); box(0, 1.22, 0, 1.24, 2.44, .018, glass, g); for (const dx of [-.62, .62]) box(dx, 1.22, 0, .025, 2.44, .04, 'metal', g); box(0, 2.44, 0, 1.24, .035, .04, 'metal', g); doors.push(g) }
  // Exterior approach, broad steps and shallow planting beds.
  box(0, -.15, 9.75, 5.1, .25, 1.8, 'stone'); box(0, -.33, 10.8, 6, .15, .7, 'stone'); box(0, -.47, 11.4, 6.7, .12, .6, 'stone'); box(-5.4, -.22, 9, 4, .35, 1.5, 'wood'); box(5.5, -.22, 9, 4, .35, 1.5, 'wood'); for (let i = 0; i < 12; i++) { hedge(-7.1 + i * .3, 9, .24, .28, .42); hedge(3.8 + i * .3, 9, .24, .27, .4) }

  // Expanded campus: two furnished wings and a landscaped city block.
  for (const x of [-13, 13]) { box(x, -.3, 0, 8, .6, 18.2, 'stone'); box(x, .015, 0, 8, .08, 17.8, 'floor'); box(x, -.58, 0, 8, .08, 18.5, 'edge'); box(x, -.65, 0, 8, .12, 19.1, 'wall'); box(x, 1.8, -8.8, 8, 3.6, .16, backWallMaterial); for (let dx = -3; dx <= 3; dx += 2) { box(x + dx, 2, -8.67, 1.85, 2.6, .02, glass); box(x + dx - .95, 2, -8.62, .045, 2.7, .05, 'metal') } for (let z = -7.9; z < 8.5; z += 1.55)box(x, .062, z, 8, .004, .015, 'edge'); }
  // Operations & Lounge floor rugs
  box(-13, .065, -4.9, 6.8, .008, 6.2, 'rugOperations'); box(-13, .068, -4.9, 6.95, .004, 6.35, 'metal');
  box(-13.1, .065, 3.4, 6.2, .008, 5.2, 'rugLounge'); box(-13.1, .068, 3.4, 6.35, .004, 5.35, 'wood');
  box(13, .065, 3.5, 6.4, .008, 5.8, 'rugCabin'); box(13, .068, 3.5, 6.55, .004, 5.95, 'goldTrim');
  for (const x of [-14.4, -11.4]) for (const z of [-6.5, -3.3]) desk(x, z, 0, 'graphiteDesk', 'metal', 'charcoal', 'operations', { cup: 'ceramicBlack' });
  for (const x of [11.4, 14.4]) for (const z of [-6.5, -3.3]) desk(x, z, 0, 'wood', 'metal', 'charcoal', 'business', { cup: 'ceramicSage' });
  laptop(-13.8, .816, -3.2, 'laptopBlack');
  partition(-13, -1.5, 7.4); partition(13, -1.5, 7.4); partition(9.2, -5.6, 6.1, Math.PI / 2); partition(-9.2, -5.6, 6.1, Math.PI / 2);
  wallLabel('OPERATIONS STUDIO', -13, 2.6, -8.5, 5, .34); wallLabel('WORK STUDIO', 13, 2.6, -8.5, 4, .34);
  sofa(-14.3, 3.8, Math.PI, 'sofaTerracotta', 'fabricSage', 'wood'); sofa(-12, 2, -Math.PI / 2, 'sofaTerracotta', 'fabricSage', 'wood'); box(-14.1, .45, 2.1, 1.6, .08, .8, 'wood'); cup(-14.2, .5, 2.1, 'ceramicSage');
  // Director's Executive Cabin
  softBox(12.7, .79, 3.4, 3.6, .14, 1.6, 'smokedOak', scene, .035); box(12.7, .79, 3.4, 3.64, .02, 1.64, 'goldTrim'); softBox(12.7, .865, 3.4, 1.8, .015, 1.0, 'deskPad', scene, .02); for (const x of [11.3, 14.1]) box(x, .4, 3.4, .14, .75, 1.3, 'smokedOak'); monitor(12.7, 3.0, Math.PI, 'director'); chair(12.7, 2.25, 0, 'director'); chair(11.8, 4.55, Math.PI, 'emerald'); chair(13.6, 4.55, Math.PI, 'emerald'); cyl(14.0, .96, 3.2, .06, .02, 'brass'); cyl(14.0, 1.12, 3.2, .015, .32, 'brass'); softBox(14.0, 1.28, 3.2, .24, .06, .12, 'brass'); laptop(12.1, .876, 3.2, 'laptopGold'); cup(13.4, .876, 3.2, 'white'); partition(14, 5.7, 4); wallLabel('DIRECTOR', 13, 1.6, 5.65, 2, .28);
  plant(-16.1, .6, .38, 1.6, 'ceramicBlack'); plant(-9.8, 7.3, .45, 1.8, 'ceramicTerracotta'); plant(9.8, .6, .38, 1.6, 'brass'); plant(16.1, 7.3, .45, 1.8, 'ceramicWhite');
  for (const x of [-13, 13]) { box(x, .58, 7.75, 7.8, 1.16, .018, glass); for (const dx of [-3.9, 0, 3.9]) box(x + dx, .62, 7.75, .035, 1.23, .035, 'metal'); }
  mat('asphalt', '#262a30'); mat('grass', '#6ea05b'); mat('city', '#f1efe7'); mat('window', '#587e91', .3);
  mat('concreteDark', '#2d333b', .8); mat('buildingStone', '#ebe8df', .75); mat('buildingGlass', '#264b63', .15, .45); mat('buildingBronze', '#5a4635', .4, .6); mat('roofDark', '#1e2228', .85);
  mat('bldTerracotta', '#a85038', .78); mat('bldWhiteStone', '#f8fafc', .8); mat('bldSandstone', '#e7dfce', .8);
  mat('bldRoyalNavy', '#1e293b', .6); mat('bldEmerald', '#1d5448', .5); mat('bldBronze', '#614833', .45, .55);
  mat('bldSlateGrey', '#475569', .75); mat('bldCoralOchre', '#a85437', .75); mat('bldDarkBasalt', '#262e38', .85);
  mat('bldGlassAzure', '#38bdf8', .08, .55); mat('bldGlassCyan', '#06b6d4', .08, .55); mat('bldGlassGold', '#d4af37', .18, .5); mat('bldGlassIce', '#7dd3fc', .05, .6);
  mat('bldLouver', '#e2e8f0', .5);
  mat('marketGreen', '#15803d', .7); mat('marketAwning', '#166534', .8);
  mat('cafeWood', '#2e1d13', .75); mat('cafeAwning', '#9a3412', .8);
  mat('retailGlass', '#38bdf8', .10, .4); mat('awningCream', '#faf5eb', .8);
  mat('bikeRed', '#e11d48', .4, .4); mat('busGlass', '#68a1b0', .12, .3);
  mats.headlight = new THREE.MeshBasicMaterial({ color: '#fffadc' }); mats.taillight = new THREE.MeshBasicMaterial({ color: '#ff2525' });
  mats.lobbyGlow = new THREE.MeshBasicMaterial({ color: '#fef3c7' });
  mats.beaconRed = new THREE.MeshBasicMaterial({ color: '#ef4444' });
  mats.flowerRed = new THREE.MeshStandardMaterial({ color: '#e11d48', roughness: .6 });
  mats.flowerYellow = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: .6 });
  box(0, -1, -6, 110, .4, 100, 'city');
  box(0, -.77, -19, 90, .04, 6, 'asphalt');
  box(23, -.77, 3, 6, .04, 80, 'asphalt');
  box(-23, -.77, 3, 6, .04, 80, 'asphalt');
  box(0, -.77, 19.5, 90, .04, 6, 'asphalt');
  for (let x = -38; x < 40; x += 3.2) { box(x, -.742, -19, 1.6, .012, .09, 'roadStripe'); box(x, -.742, 19.5, 1.6, .012, .09, 'roadStripe') }
  for (let z = -26; z < 32; z += 3.2) for (const x of [-23, 23]) box(x, -.742, z, .09, .012, 1.6, 'roadStripe');
  for (let i = 0; i < 9; i++) { box(18.4 + i * .36, -.741, 14.8, .19, .013, 3, 'roadStripe'); box(-18.4 - i * .36, -.741, 14.8, .19, .013, 3, 'roadStripe') }
  for (let i = 0; i < 9; i++) { box(18.4 + i * .36, -.741, -14.8, .19, .013, 3, 'roadStripe'); box(-18.4 - i * .36, -.741, -14.8, .19, .013, 3, 'roadStripe') }
  box(0, -.74, 14.3, 35, .1, 3, 'stone'); box(0, -.76, -14.1, 35, .1, 2.4, 'stone');
  for (const x of [-19, 19]) box(x, -.73, 0, 2.8, .12, 29, 'stone');
  for (let x = -16; x <= 16; x += 4) { box(x, -.71, -12.9, 2.7, .12, 1.4, 'grass'); hedge(x, -12.9, 1, .6, .55) }
  // Outer sidewalks for commercial shops (safely between road and buildings)
  box(-30.5, -.74, -0.5, 7, .1, 21, 'stone');
  box(30.5, -.74, -0.5, 7, .1, 21, 'stone');

  // Background Promenade, Parkway Lawn, Plaza, and EXACTLY 3 Modern Skyline Towers:
  // 1. North Promenade Sidewalk (North of North road, z from -22 to -25.2)
  box(0, -.74, -23.6, 96, .1, 3.2, 'stone');
  // Row of 7 street trees along the North sidewalk
  for (const tx of [-27, -18, -9, 0, 9, 18, 27]) streetTree(tx, -23.6);
  // Modern pathway LED bollards along promenade
  for (const tx of [-22.5, -13.5, -4.5, 4.5, 13.5, 22.5]) {
    cyl(tx, -.55, -23.6, .07, .38, 'metal'); cyl(tx, -.35, -23.6, .072, .05, 'headlight');
  }
  // 2. Central Greenway Park Belt (between sidewalk and towers, z from -25.2 to -41.8, full 16.6m width!)
  box(0, -.72, -33.5, 96, .08, 16.6, 'grass');
  // Manicured boxwood hedges along park border
  for (const tx of [-28, -21, -14, -7, 0, 7, 14, 21, 28]) hedge(tx, -25.8, 1.4, .65, .5);
  // Cross-walkways connecting sidewalk through park to the 3 towers
  for (const wx of [-20, 0, 20]) box(wx, -.715, -33.5, 2.4, .09, 16.0, 'stone');
  // Modern park benches in greenway
  for (const bx of [-10, 10]) {
    box(bx, -.5, -33, 1.8, .4, .55, 'wood'); box(bx, -.3, -33.22, 1.8, .45, .08, 'wood');
    cyl(bx - .8, -.55, -33, .04, .35, 'metal'); cyl(bx + .8, -.55, -33, .04, .35, 'metal');
  }
  // Perennial flower beds
  for (const fx of [-15, 15]) {
    box(fx, -.65, -34, 3.2, .2, 1.8, 'stone'); box(fx, -.52, -34, 2.9, .15, 1.5, 'grass');
    box(fx - .8, -.42, -34, .4, .1, .4, 'flowerRed'); box(fx, -.42, -34, .4, .1, .4, 'flowerYellow'); box(fx + .8, -.42, -34, .4, .1, .4, 'flowerRed');
  }
  // 3. Paved Tower Promenade & Plaza at base of towers (z from -41.8 to -48)
  box(0, -.73, -44.8, 76, .1, 6.0, 'stone');
  // Low wide plaza steps leading up to each of the 3 tower entrances
  for (const tx of [-20, 0, 20]) {
    box(tx, -.68, -42.0, 5.0, .08, 1.2, 'stone');
    box(tx, -.62, -42.6, 4.4, .08, 1.0, 'stone');
  }

  // THE 3 MAIN BACKGROUND SKYLINE TOWERS (Only 3 towers, seated 21+ meters behind road):
  function skylineTower(x, z, width, depth, height, variant = 'lumina') {
    const lobbyH = 3.0;
    // Transparent double-height lobby with warm interior illumination
    box(x, lobbyH / 2 - .75, z, width * .7, lobbyH - .2, depth * .6, 'lobbyGlow');
    box(x, lobbyH / 2 - .75, z + depth / 2 + .06, width - 1.2, lobbyH - .2, .05, 'bldGlassAzure');
    // Travertine corner and structural piers
    for (const sx of [-width / 2, width / 2]) for (const sz of [-depth / 2, depth / 2]) {
      box(x + sx, lobbyH / 2 - .75, z + sz, .8, lobbyH, .8, 'bldWhiteStone');
    }
    // Cantilevered entrance canopy
    box(x, lobbyH - .75, z + depth / 2 + .65, width * .55, .14, 1.5, 'goldTrim');
    box(x, lobbyH - .77, z + depth / 2 + .65, width * .45, .02, .08, 'headlight');
    box(x, lobbyH - .75, z, width + .35, .18, depth + .35, 'goldTrim');

    // Tower Body shaft:
    // Core recessed inside by 0.35m on all sides, eliminating any facade overlap
    const shaftH = height - lobbyH;
    const shaftY = lobbyH - .75 + shaftH / 2;
    box(x, shaftY, z, width - .7, shaftH, depth - .7, 'concreteDark');

    // Discrete floor spandrels and window ribbons (Zero vertical overlap)
    const glassMat = variant === 'solaria' ? 'bldGlassCyan' : 'bldGlassAzure';
    for (let y = lobbyH - .75; y < height - 1.4; y += 1.9) {
      // 1. Solid spandrel band (y to y + .65)
      box(x, y + .325, z, width, .65, depth, 'bldWhiteStone');
      box(x, y + .65, z, width + .1, .08, depth + .1, 'goldTrim');

      // 2. Window ribbon (y + .65 to y + 1.85, height 1.2) - NO solid wall behind facade
      const winY = y + 1.25;
      box(x, winY, z, width - .04, 1.12, depth - .04, glassMat);

      // 3. Corner columns at window level
      for (const sx of [-width / 2, width / 2]) for (const sz of [-depth / 2, depth / 2]) {
        box(x + sx, winY, z + sz, .6, 1.12, .6, 'bldWhiteStone');
      }

      // 4. Vertical mullions standing slightly proud of glass
      for (let mx = -width / 2 + 1.4; mx <= width / 2 - 1.4; mx += 1.8) {
        box(x + mx, winY, z + depth / 2 + .04, .05, 1.12, .06, 'metal');
        box(x + mx, winY, z - depth / 2 - .04, .05, 1.12, .06, 'metal');
      }
      for (let mz = -depth / 2 + 1.4; mz <= depth / 2 - 1.4; mz += 1.8) {
        box(x + width / 2 + .04, winY, z + mz, .06, 1.12, .05, 'metal');
        box(x - width / 2 - .04, winY, z + mz, .06, 1.12, .05, 'metal');
      }

      // 5. Architectural sun louver
      box(x, winY + .52, z + depth / 2 + .14, width + .08, .04, .2, 'bldLouver');
    }

    const topY = height - .75;
    if (variant === 'lumina') {
      // Center Tower: Iconic stepped crown, glazed penthouse, architectural mast & beacon
      box(x, topY + .15, z, width + .2, .3, depth + .2, 'goldTrim');
      box(x, topY + 1.1, z, width * .7, 1.6, depth * .7, 'bldGlassAzure');
      box(x, topY + 2.0, z, width * .75, .2, depth * .75, 'goldTrim');
      cyl(x, topY + 3.6, z, .06, 3.0, 'goldTrim');
      cyl(x, topY + 5.5, z, .02, 1.8, 'metal');
      box(x, topY + 6.5, z, .14, .14, .14, 'beaconRed');
    } else if (variant === 'nordic') {
      // Left Tower: Rooftop sky-terrace, glass balustrade, timber pergola, evergreen planters
      box(x, topY + .12, z, width + .15, .24, depth + .15, 'goldTrim');
      box(x, topY + .5, z + depth / 2 + .05, width * .9, .6, .03, 'busGlass');
      box(x, topY + 1.4, z, width * .65, .08, depth * .65, 'darkWood');
      for (const px of [x - 3.2, x + 3.2]) {
        box(px, topY + .35, z, .9, .4, .9, 'stone');
        box(px, topY + .7, z, .75, .35, .75, 'grass');
        box(px, topY + .95, z, .55, .25, .55, 'leaf');
      }
    } else {
      // Right Tower: Beveled titanium cornice, recessed mechanical penthouse, roof louvers
      box(x, topY + .18, z, width + .25, .36, depth + .25, 'goldTrim');
      box(x, topY + 1.0, z, width * .65, 1.3, depth * .65, 'bldWhiteStone');
      for (const lz of [-1.5, 0, 1.5]) box(x, topY + 1.8, z + lz, width * .55, .06, .22, 'metal');
    }
  }

  // 1. Center: The Lumina Spire (Clean white stone, sky azure glass, champagne gold crown & spire)
  skylineTower(0, -46.5, 13.5, 7.5, 15.5, 'lumina');
  // 2. Left: Nordic Innovation Highrise (Scandinavian white stone, sky azure ribbon glass, rooftop garden)
  skylineTower(-20, -46.5, 11.5, 7.0, 12.5, 'nordic');
  // 3. Right: Solaria Horizon Tower (Clean white stone, cyan curtain glass, beveled crown)
  skylineTower(20, -46.5, 11.5, 7.0, 13.5, 'solaria');

  // West commercial building: Clean 3-story modern commercial pavilion (x in [-41, -31], z in [-8, 8])
  // Base plinth
  box(-36, -.55, 0, 10.2, .38, 16.2, 'stone');
  // Recessed interior core
  box(-36, 3.8, 0, 9.4, 8.4, 15.4, 'concreteDark');
  // Structural corner piers
  for (const cx of [-40.6, -31.4]) for (const cz of [-7.6, 7.6]) {
    box(cx, 3.8, cz, .8, 8.4, .8, 'bldWhiteStone');
  }

  // Ground Floor Storefront (y in [-.35, 2.5]):
  // East storefront (facing road):
  box(-31.0, 2.2, 0, .24, .6, 14.8, 'metal');
  box(-31.0, -.45, 0, .24, .4, 14.8, 'stone');
  box(-31.0, .85, 0, .05, 2.1, 14.4, 'retailGlass');
  for (let sz = -6.0; sz <= 6.0; sz += 2.0) {
    box(-30.92, .85, sz, .08, 2.15, .08, 'metal');
  }
  const martSign = textPlane('METRO SUPERMART · ORGANIC & FRESH', 9.2, .85, '#ffffff', 52, '#15803d');
  martSign.position.set(-30.82, 2.45, 0); martSign.rotation.y = Math.PI / 2; scene.add(martSign);

  // South storefront (facing camera):
  box(-36, 2.2, 8.0, 8.8, .6, .24, 'metal');
  box(-36, -.45, 8.0, 8.8, .4, .24, 'stone');
  box(-36, .85, 8.0, 8.4, 2.1, .05, 'retailGlass');
  for (let sx = -39.0; sx <= -33.0; sx += 2.0) {
    box(sx, .85, 8.08, .08, 2.15, .08, 'metal');
  }
  const martSouthSign = textPlane('METRO SUPERMART', 5.6, .7, '#ffffff', 48, '#15803d');
  martSouthSign.position.set(-36, 2.45, 8.16); scene.add(martSouthSign);

  // Floor 2 Windows (y = 3.9) and Spandrel:
  box(-36, 2.8, 0, 10.0, .6, 16.0, 'bldWhiteStone');
  box(-36, 3.1, 0, 10.12, .08, 16.12, 'goldTrim');
  box(-31.0, 3.9, 0, .05, 1.4, 14.8, 'bldGlassAzure');
  box(-36, 3.9, 8.0, 8.8, 1.4, .05, 'bldGlassAzure');
  for (let sz = -6.0; sz <= 6.0; sz += 2.4) box(-30.93, 3.9, sz, .07, 1.42, .07, 'metal');
  for (let sx = -39.0; sx <= -33.0; sx += 2.4) box(sx, 3.9, 8.07, .07, 1.42, .07, 'metal');

  // Floor 3 Windows (y = 5.9) and Spandrel:
  box(-36, 4.8, 0, 10.0, .6, 16.0, 'bldWhiteStone');
  box(-36, 5.1, 0, 10.12, .08, 16.12, 'goldTrim');
  box(-31.0, 5.9, 0, .05, 1.4, 14.8, 'bldGlassAzure');
  box(-36, 5.9, 8.0, 8.8, 1.4, .05, 'bldGlassAzure');
  for (let sz = -6.0; sz <= 6.0; sz += 2.4) box(-30.93, 5.9, sz, .07, 1.42, .07, 'metal');
  for (let sx = -39.0; sx <= -33.0; sx += 2.4) box(sx, 5.9, 8.07, .07, 1.42, .07, 'metal');

  // Roof Parapet and crown:
  box(-36, 6.9, 0, 10.0, .6, 16.0, 'bldWhiteStone');
  box(-36, 7.25, 0, 10.15, .12, 16.15, 'goldTrim');
  box(-36, 7.8, 0, 6.0, .9, 9.0, 'metal');

  // Canvas awning along the side
  box(-30.2, 2.15, 0, 1.4, .08, 11.2, 'marketAwning');
  for (let z = -5; z <= 5; z += 1.8) box(-30.2, 2.16, z, 1.42, .012, .45, 'awningCream');
  // Sidewalk rustic wooden fruit crates & stacked produce
  for (let i = 0; i < 4; i++) {
    box(-28.6, -.48, -4.5 + i * 1.4, .65, .42, .9, 'wood');
    const fruitCol = i === 0 ? '#ea580c' : i === 1 ? '#dc2626' : i === 2 ? '#65a30d' : '#eab308';
    box(-28.6, -.24, -4.5 + i * 1.4, .58, .12, .82, fruitCol);
  }
  // Chalkboard sidewalk produce sign
  box(-28.2, -.45, 1.5, .04, .55, .38, 'cafeWood');
  const produceSign = textPlane('FRESH ORGANIC\nLOCAL FARM\nPRODUCE 100%', 1.0, 1.2, '#fef9c3', 52, '#14532d');
  produceSign.position.set(-28.16, -.45, 1.5); produceSign.rotation.y = Math.PI / 2; scene.add(produceSign);
  // Row of 4 chrome metal shopping carts parked neatly
  for (let k = 0; k < 4; k++) {
    box(-28.6, -.42, 3.0 + k * .75, .52, .5, .44, 'chromeSilver');
    box(-28.6, -.16, 3.2 + k * .75, .54, .04, .04, 'bikeRed');
    cyl(-28.8, -.62, 2.85 + k * .75, .05, .04, 'rubber'); cyl(-28.4, -.62, 3.15 + k * .75, .05, .04, 'rubber');
  }
  // White electric delivery van parked at loading zone
  softBox(-26.2, -.24, -7.5, 1.7, .95, 3.4, 'white', scene, .12);
  softBox(-26.2, .35, -7.0, 1.6, .75, 2.0, 'white', scene, .1);
  box(-26.2, .38, -6.0, 1.4, .45, .03, 'window');
  const vanDecal = textPlane('METRO EXPRESS', 1.8, .35, '#15803d', 42, '#ffffff');
  vanDecal.position.set(-27.06, -.15, -7.5); vanDecal.rotation.y = -Math.PI / 2; scene.add(vanDecal);
  for (const a of [-.92, .92]) for (const b of [-8.4, -6.6]) {
    const tire = cyl(-26.2 + a, -.48, b, .28, .16, 'rubber'); tire.rotation.z = Math.PI / 2;
  }
  for (const a of [-.55, .55]) box(-26.2 + a, -.15, -5.78, .24, .12, .03, 'sofaMustard');

  // East 2-Story Boutique Lifestyle Pavilion (x in [31, 40], z in [-8, 8])
  box(35.5, -.55, 0, 9.2, .38, 16.2, 'stone');
  // Upper floor spandrel and ribbon windows
  box(35.5, 2.5, 0, 9.0, .4, 16.0, 'bldWhiteStone');
  box(31.0, 3.1, 0, .05, .8, 14.8, 'bldGlassAzure');
  box(35.5, 3.1, 8.0, 7.8, .8, .05, 'bldGlassAzure');
  for (const cx of [31.4, 39.6]) for (const cz of [-7.6, 7.6]) {
    box(cx, 3.1, cz, .7, .8, .7, 'bldWhiteStone');
  }
  box(35.5, 3.65, 0, 9.0, .3, 16.0, 'bldWhiteStone');
  box(35.5, 3.85, 0, 9.15, .12, 16.15, 'goldTrim');

  // Rooftop Garden Terrace Balustrade & Pergola at y = 3.9
  for (let rx of [31.1, 39.9]) box(rx, 4.3, 0, .04, .7, 15.8, 'busGlass');
  for (let rz of [-7.9, 7.9]) box(35.5, 4.3, rz, 8.8, .7, .04, 'busGlass');
  for (const pz of [-4, 0, 4]) {
    box(35.5, 5.0, pz, 7.6, .1, .14, 'darkWood');
    box(33.0, 5.0, pz, .14, .1, 2.2, 'darkWood'); box(38.0, 5.0, pz, .14, .1, 2.2, 'darkWood');
  }

  // CONNECTED TECH STORE: Ground floor on North half of East sidewalk (z in [-7.5, 0])
  box(31.0, 2.1, -3.8, .22, .45, 7.2, 'metal');
  box(31.0, -.45, -3.8, .22, .4, 7.2, 'stone');
  box(31.0, .82, -3.8, .05, 2.1, 6.8, 'retailGlass');
  for (let k = -6.4; k <= -1.2; k += 1.7) {
    box(30.92, .82, k, .08, 2.15, .08, 'metal');
  }
  const techSign = textPlane('CONNECTED TECH · SMART DEVICES', 6.2, .75, '#ffffff', 48, '#005a9c');
  techSign.position.set(30.84, 2.35, -3.8); techSign.rotation.y = -Math.PI / 2; scene.add(techSign);
  box(30.3, 2.15, -3.8, 1.2, .06, 6.8, 'navy');
  for (let k = -6.0; k <= -1.2; k += 1.6) {
    box(31.6, -.35, k, .44, .75, .44, 'white');
    laptop(31.6, .05, k, 'laptopSilver');
  }

  // ARTISAN COFFEE & BAKERY: Ground floor on South half of East sidewalk (z in [0, 7.5])
  box(31.0, 2.1, 3.8, .22, .45, 7.2, 'cafeWood');
  box(31.0, -.45, 3.8, .22, .4, 7.2, 'stone');
  box(31.0, .82, 3.8, .05, 2.1, 6.8, 'retailGlass');
  for (let k = 1.2; k <= 6.4; k += 1.7) {
    box(30.92, .82, k, .08, 2.15, .08, 'cafeWood');
  }
  const cafeSign = textPlane('ARTISAN COFFEE · BAKERY', 5.8, .75, '#fef6ee', 50, '#382215');
  cafeSign.position.set(30.84, 2.35, 3.8); cafeSign.rotation.y = -Math.PI / 2; scene.add(cafeSign);
  box(30.3, 2.15, 3.8, 1.4, .08, 6.8, 'cafeAwning');
  for (let z = .8; z <= 6.8; z += 1.4) box(30.3, 2.16, z, 1.42, .012, .35, 'awningCream');

  // South-facing storefront for bakery cafe (facing front camera!)
  box(35.5, 2.1, 8.0, 8.6, .45, .22, 'cafeWood');
  box(35.5, -.45, 8.0, 8.6, .4, .22, 'stone');
  box(35.5, .82, 8.0, 8.0, 2.1, .05, 'retailGlass');
  for (let sx = 32.2; sx <= 38.8; sx += 2.2) {
    box(sx, .82, 8.08, .08, 2.15, .08, 'cafeWood');
  }
  const cafeSouthSign = textPlane('ARTISAN BAKERY & CAFE', 6.2, .7, '#fef6ee', 50, '#382215');
  cafeSouthSign.position.set(35.5, 2.35, 8.16); scene.add(cafeSouthSign);
  // Outdoor Sidewalk Cafe Seating: bistro tables, chairs, parasol, coffee cups, croissants
  for (const tz of [2.0, 4.4, 6.6]) {
    cyl(28.6, -.45, tz, .38, .55, 'wood'); cyl(28.6, -.70, tz, .12, .05, 'metal');
    cyl(28.6, -.15, tz, .05, .08, 'ceramicWhite');
    box(28.6, -.16, tz + .18, .12, .02, .12, 'ceramicTerracotta');
    for (const cz of [tz - .55, tz + .55]) {
      box(28.6, -.48, cz, .32, .42, .32, 'cafeWood');
      box(28.6, -.18, cz, .32, .36, .04, 'cafeWood');
    }
  }
  cyl(28.6, .8, 4.4, .035, 1.9, 'metal'); cyl(28.6, 1.7, 4.4, 1.35, .25, 'cafeAwning');
  box(27.8, -.45, 1.0, .04, .55, .38, 'cafeWood');
  const menuText = textPlane('SPECIALTY COFFEE\nFRESH CROISSANTS\nDAILY ROAST', 1.0, 1.2, '#f5ecd8', 54, '#241b16');
  menuText.position.set(27.76, -.45, 1.0); menuText.rotation.y = -Math.PI / 2; scene.add(menuText);
  // Modern Glass Bus Transit Shelter on West sidewalk (x = -19.4, z = 7)
  box(-19.4, .45, 7, .06, 2.3, 3.4, 'busGlass');
  box(-18.6, 1.6, 7, 1.6, .06, 3.5, 'metal');
  for (const pz of [5.4, 8.6]) cyl(-17.9, .45, pz, .045, 2.3, 'metal');
  box(-19.0, -.35, 7, .42, .45, 2.4, 'wood');
  const busScreen = textPlane('LINE 10 · METRO AIRPORT · 2 MIN', 2.8, .35, '#00e5ff', 44, '#101e28');
  busScreen.position.set(-18.6, 1.42, 7); busScreen.rotation.y = -Math.PI / 2; scene.add(busScreen);
  cyl(-17.8, .4, 4.8, .035, 2.2, 'metal'); cyl(-17.8, 1.45, 4.8, .22, .04, 'carGold');
  // City Bike Sharing Station on East sidewalk (x = 19.4, z = -6)
  box(19.4, -.55, -6, .15, .45, 4.2, 'metal');
  for (let bz = -7.4; bz <= -4.6; bz += 1.3) {
    cyl(19.4, -.42, bz - .35, .25, .05, 'rubber');
    cyl(19.4, -.42, bz + .35, .25, .05, 'rubber');
    box(19.4, -.32, bz, .05, .32, .55, 'bikeRed');
    box(19.4, -.12, bz + .32, .32, .03, .04, 'chromeSilver');
  }
  // Jodetx 24/7 Digital Banking ATM Kiosk on East sidewalk (x = 19.4, z = 7)
  box(19.4, .35, 7, 1.2, 2.1, 1.2, 'bldDarkBasalt');
  box(18.78, .35, 7, .04, 1.8, .9, 'window');
  const atmScreen = textPlane('Jodetx 24/7 ATM\nTOUCH TO START', 1.2, .8, '#00e5ff', 56, '#0f2238');
  atmScreen.position.set(18.75, .55, 7); atmScreen.rotation.y = -Math.PI / 2; scene.add(atmScreen);
  // Street Trees in raised square granite planters
  function streetTree(tx, tz) {
    box(tx, -.55, tz, 1.6, .45, 1.6, 'stone'); box(tx, -.32, tz, 1.3, .12, 1.3, 'soil');
    cyl(tx, .45, tz, .09, 1.5, 'darkWood');
    for (const [dy, rad] of [[1.3, .85], [1.8, .72], [2.2, .55]]) {
      cyl(tx, dy, tz, rad, .45, 'leaf');
    }
  }
  streetTree(-19.2, -11.5); streetTree(19.2, 11.5); streetTree(-19.2, 12.5); streetTree(19.2, -12.5);
  // Pedestrian crossing signals with glowing walk lights
  for (const [sx, sz] of [[-18.2, 13.6], [18.2, 13.6], [-18.2, -13.6], [18.2, -13.6]]) {
    cyl(sx, .5, sz, .035, 2.4, 'metal'); box(sx, 1.65, sz, .14, .28, .12, 'navy');
    box(sx, 1.65, sz + .07, .08, .18, .02, 'headlight');
  }
  // Modern pathway LED bollards and stone planters (replaces tall crossarm street lamps)
  for (const x of [-19.2, 19.2]) for (const z of [-8, 0, 8]) {
    cyl(x, -.55, z, .07, .38, 'metal'); cyl(x, -.35, z, .072, .05, 'headlight');
  }
  for (const x of [-14, -6, 6, 14]) {
    box(x, -.55, 15.8, 2.2, .38, .8, 'stone'); box(x, -.34, 15.8, 2.0, .14, .64, 'grass'); hedge(x, 15.8, 1.8, .42, .55);
  }
  for (const x of [-10, -2, 2, 10]) {
    cyl(x, -.55, 15.8, .07, .38, 'metal'); cyl(x, -.35, 15.8, .072, .05, 'headlight');
  }
  function makeRoundedCircuit(corners, radius = 3.5, segmentsPerCorner = 6) {
    const points = [], n = corners.length;
    for (let i = 0; i < n; i++) {
      const prev = corners[(i - 1 + n) % n], curr = corners[i], next = corners[(i + 1) % n];
      const v1 = { x: prev[0] - curr[0], z: prev[1] - curr[1] }, len1 = Math.hypot(v1.x, v1.z); v1.x /= len1; v1.z /= len1;
      const v2 = { x: next[0] - curr[0], z: next[1] - curr[1] }, len2 = Math.hypot(v2.x, v2.z); v2.x /= len2; v2.z /= len2;
      const pStart = { x: curr[0] + v1.x * radius, z: curr[1] + v1.z * radius }, pEnd = { x: curr[0] + v2.x * radius, z: curr[1] + v2.z * radius };
      for (let s = 0; s <= segmentsPerCorner; s++) {
        const t = s / segmentsPerCorner, it = 1 - t;
        const x = it * it * pStart.x + 2 * it * t * curr[0] + t * t * pEnd.x, z = it * it * pStart.z + 2 * it * t * curr[1] + t * t * pEnd.z;
        points.push({ x, z });
      }
    }
    let totalLen = 0; const dists = [0];
    for (let i = 1; i <= points.length; i++) { const p0 = points[i - 1], p1 = points[i % points.length], d = Math.hypot(p1.x - p0.x, p1.z - p0.z); totalLen += d; dists.push(totalLen); }
    return { points, dists, totalLen };
  }
  function getCircuitPose(circuit, dist) {
    let s = ((dist % circuit.totalLen) + circuit.totalLen) % circuit.totalLen; const n = circuit.points.length; let i = 0;
    while (i < n - 1 && circuit.dists[i + 1] <= s) i++;
    const segStartDist = circuit.dists[i], segEndDist = circuit.dists[i + 1] || circuit.totalLen, segLen = Math.max(0.0001, segEndDist - segStartDist), t = (s - segStartDist) / segLen;
    const p0 = circuit.points[i], p1 = circuit.points[(i + 1) % n], x = p0.x + (p1.x - p0.x) * t, z = p0.z + (p1.z - p0.z) * t, dx = p1.x - p0.x, dz = p1.z - p0.z;
    return { x, z, yaw: Math.atan2(dx, dz) };
  }
  const circuitA = makeRoundedCircuit([[24.3, -20.3], [24.3, 20.8], [-24.3, 20.8], [-24.3, -20.3]], 3.5);
  const circuitB = makeRoundedCircuit([[21.7, 18.2], [21.7, -17.7], [-21.7, -17.7], [-21.7, 18.2]], 3.0);
  function makeCar(color, type = 'sedan') {
    const g = new THREE.Group(); g.position.set(0, -.68, 0); scene.add(g); const wheels = [];
    if (type === 'suv') {
      softBox(0, .50, 0, 1.82, .64, 3.6, color, g, .18); softBox(0, 1.08, -.15, 1.54, .62, 2.2, color, g, .14);
      for (const a of [-.65, .65]) box(a, 1.42, -.15, .04, .05, 1.8, 'metal', g);
      const frontWind = box(0, 1.10, .96, 1.35, .42, .03, 'window', g); frontWind.rotation.x = -.22;
      const rearWind = box(0, 1.10, -1.24, 1.35, .42, .03, 'window', g); rearWind.rotation.x = .12;
      for (const a of [-.78, .78]) { box(a, 1.10, -.15, .02, .38, 1.9, 'window', g); box(a * 1.12, .88, .85, .14, .10, .16, color, g); }
      box(0, .36, 1.81, 1.4, .24, .05, 'rubber', g); box(0, .36, -1.81, 1.4, .24, .05, 'rubber', g);
      for (const a of [-.62, .62]) { box(a, .55, 1.81, .32, .14, .03, 'headlight', g); box(a, .55, -1.81, .28, .12, .03, 'taillight', g); }
      for (const a of [-.93, .93]) for (const b of [-1.1, 1.15]) {
        const tire = cyl(a, .32, b, .32, .18, 'rubber', g); tire.rotation.z = Math.PI / 2;
        cyl(0, .10 * Math.sign(a), 0, .18, .04, 'laptopSilver', tire); wheels.push(tire);
      }
    } else {
      softBox(0, .45, 0, 1.72, .54, 3.4, color, g, .16); softBox(0, .94, -.06, 1.44, .48, 1.75, color, g, .12);
      const frontWind = box(0, .96, .82, 1.28, .36, .03, 'window', g); frontWind.rotation.x = -.28;
      const rearWind = box(0, .96, -.94, 1.28, .36, .03, 'window', g); rearWind.rotation.x = .24;
      for (const a of [-.73, .73]) { box(a, .96, -.06, .02, .32, 1.45, 'window', g); box(a * 1.14, .75, .72, .12, .09, .14, color, g); }
      box(0, .34, 1.71, 1.3, .22, .05, 'metal', g); box(0, .34, -1.71, 1.3, .22, .05, 'metal', g);
      for (const a of [-.56, .56]) { box(a, .48, 1.71, .30, .12, .03, 'headlight', g); box(a, .48, -1.71, .26, .10, .03, 'taillight', g); }
      for (const a of [-.88, .88]) for (const b of [-1.02, 1.06]) {
        const tire = cyl(a, .29, b, .29, .16, 'rubber', g); tire.rotation.z = Math.PI / 2;
        cyl(0, .09 * Math.sign(a), 0, .16, .03, 'laptopSilver', tire); wheels.push(tire);
      }
    }
    return { g, wheels };
  }
  const movingCars = [
    { ...makeCar('carRed', 'sedan'), circuit: circuitA, dist: 0, speed: 7.2 },
    { ...makeCar('carCream', 'sedan'), circuit: circuitA, dist: circuitA.totalLen * .34, speed: 7.2 },
    { ...makeCar('carGreen', 'suv'), circuit: circuitA, dist: circuitA.totalLen * .68, speed: 7.2 },
    { ...makeCar('carBlue', 'sedan'), circuit: circuitB, dist: 0, speed: 6.5 },
    { ...makeCar('carGold', 'sedan'), circuit: circuitB, dist: circuitB.totalLen * .34, speed: 6.5 },
    { ...makeCar('carGrey', 'suv'), circuit: circuitB, dist: circuitB.totalLen * .68, speed: 6.5 }
  ];


  // Architectural finish details, grouped with static geometry for efficient rendering.
  for (const x of [-13, 0, 13]) { box(x, .16, -8.57, x === 0 ? 17.7 : 7.7, .22, .04, 'white'); box(x, .275, -8.548, x === 0 ? 17.7 : 7.7, .016, .018, 'edge'); }
  box(-16.78, .16, -2.7, .035, .22, 11.7, 'white'); box(-16.758, .275, -2.7, .018, .016, 11.7, 'edge');
  for (const x of [-15, -11, -6, -2, 3, 7, 11, 15]) { softBox(x, .48, -8.49, .15, .18, .025, 'white', scene, .015); for (const dx of [-.025, .025]) box(x + dx, .49, -8.47, .012, .03, .004, 'navy'); box(x, .435, -8.47, .012, .018, .004, 'navy'); }
  for (const [i, g] of doors.entries()) { const x = i === 0 ? .43 : -.43; for (const z of [-.075, .075]) { box(x, 1.10, z, .024, .26, .03, 'metal', g); box(x, .99, z * .6, .035, .025, .09, 'metal', g); box(x, 1.21, z * .6, .035, .025, .09, 'metal', g); } }
  for (const x of [-14.4, -11.4, -6.7, -3.85, 3.85, 6.7, 11.4, 14.4]) { box(x + .64, .47, -3.83, .045, .46, .035, 'rubber'); box(x + .65, .25, -3.81, .18, .022, .035, 'rubber'); }
  for (const x of [-16.95, 16.95]) { box(x, .055, 0, .07, .06, 18.1, 'edge'); box(x, .075, 0, .09, .022, 18.2, 'wood'); }

  // Baked contact shading complements the real directional shadows.
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128; const sc = shadowCanvas.getContext('2d'), grad = sc.createRadialGradient(64, 64, 5, 64, 64, 62); grad.addColorStop(0, 'rgba(25,35,40,.22)'); grad.addColorStop(1, 'rgba(25,35,40,0)'); sc.fillStyle = grad; sc.fillRect(0, 0, 128, 128); const shadowMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }); function shadow(x, z, w, d) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, d), shadowMat); o.rotation.x = -Math.PI / 2; o.position.set(x, .09, z); scene.add(o); return o } shadow(-2.7, 2.4, 5.5, 1.9); for (let x of [-6.7, -3.85, 3.85, 6.7]) shadow(x, -3.4, 3.1, 2.4);
  // Textured, fully skinned human model with retargeted skeletal walking and idle clips.
  function bufferFromBase64(value) { const bytes = Uint8Array.from(atob(value), c => c.charCodeAt(0)); return bytes.buffer }
  const loader = new GLTFLoader(); const [human, motion] = await Promise.all([loader.parseAsync(bufferFromBase64('__HUMAN_MODEL__'), ''), loader.parseAsync(bufferFromBase64('__MOTION_MODEL__'), '')]);
  let humanMesh, sourceMesh; human.scene.traverse(o => { if (o.isSkinnedMesh) humanMesh = o }); motion.scene.traverse(o => { if (o.isSkinnedMesh && !sourceMesh) sourceMesh = o });
  human.scene.updateMatrixWorld(true); motion.scene.updateMatrixWorld(true); humanMesh.skeleton.update();
  const humanTemplate = cloneRig(human.scene); const humanBounds = new THREE.Box3().setFromObject(human.scene), humanHeight = humanBounds.max.y - humanBounds.min.y;
  const canonical = name => name.replace(/^mixamorig[:_]?/, '').replace(/_\d+$/, '');
  const targetBones = humanMesh.skeleton.bones, sourceBones = sourceMesh.skeleton.bones; const sourceRest = new Map(sourceBones.map(b => [b.name, b.getWorldQuaternion(new THREE.Quaternion())])); const targetRest = new Map(targetBones.map(b => [b.name, b.getWorldQuaternion(new THREE.Quaternion())])); const hipBone = targetBones.find(b => canonical(b.name) === 'Hips'), hipParentInverse = hipBone.parent.matrixWorld.clone().invert(), hipWorld = hipBone.getWorldPosition(new THREE.Vector3());
  function transfer(name) {
    const original = motion.animations.find(a => a.name === name), mixer = new THREE.AnimationMixer(motion.scene), action = mixer.clipAction(original).play(), frames = Math.ceil(original.duration * 30) + 1, times = new Float32Array(frames), values = new Map(targetBones.map(b => [b.name, new Float32Array(frames * 4)])), hips = new Float32Array(frames * 3); let sourceStartY;
    for (let f = 0; f < frames; f++) { const time = f * original.duration / (frames - 1); times[f] = time; mixer.setTime(time); motion.scene.updateMatrixWorld(true); const desiredWorld = new Map(); for (const bone of targetBones) { const src = sourceBones.find(b => canonical(b.name) === canonical(bone.name)); const q = src ? src.getWorldQuaternion(new THREE.Quaternion()).multiply(sourceRest.get(src.name).clone().invert()).multiply(targetRest.get(bone.name)) : targetRest.get(bone.name).clone(); desiredWorld.set(bone.name, q); const parentQ = desiredWorld.get(bone.parent?.name) || bone.parent.getWorldQuaternion(new THREE.Quaternion()); parentQ.clone().invert().multiply(q).normalize().toArray(values.get(bone.name), f * 4) } const srcHip = sourceBones.find(b => canonical(b.name) === canonical(hipBone.name)).getWorldPosition(new THREE.Vector3()); if (f === 0) sourceStartY = srcHip.y; const p = hipWorld.clone(); p.y += (srcHip.y - sourceStartY) * .98; p.applyMatrix4(hipParentInverse).toArray(hips, f * 3) } action.stop(); const tracks = targetBones.map(b => new THREE.QuaternionKeyframeTrack(b.name + '.quaternion', times, values.get(b.name))); tracks.push(new THREE.VectorKeyframeTrack(hipBone.name + '.position', times, hips)); return new THREE.AnimationClip(name, original.duration, tracks);
  }
  const walkClip = transfer('walk'), idleClip = transfer('idle');
  const hairGeoCache=new Map();
  function buildHairGeometry(style){
    const geos=[];
    const add=(geo,pos,rot)=>{
      const g=geo.clone();
      if(rot){if(rot.x)g.rotateX(rot.x);if(rot.y)g.rotateY(rot.y);if(rot.z)g.rotateZ(rot.z);}
      if(pos)g.translate(...pos);
      geos.push(g.index?g.toNonIndexed():g);
    };
    if(style===1){
      // High ponytail with sleek tie
      add(new THREE.SphereGeometry(.122,16,12,0,Math.PI*2,0,Math.PI*.7),[0,.12,-.01]);
      add(new THREE.CylinderGeometry(.115,.07,.14,12),[0,.07,-.05],{x:.35});
      add(new THREE.CylinderGeometry(.042,.048,.12,10),[0,.16,-.155],{x:-.55});
      add(new THREE.CylinderGeometry(.045,.035,.15,10),[0,.05,-.19],{x:-.25});
      add(new THREE.CylinderGeometry(.032,.015,.14,10),[0,-.08,-.21],{x:-.1});
    }else if(style===2){
      // Sleek shoulder bob
      add(new THREE.SphereGeometry(.124,16,12,0,Math.PI*2,0,Math.PI*.72),[0,.125,-.01]);
      for(const s of [-1,1])add(new THREE.CylinderGeometry(.065,.052,.18,10),[s*.112,.04,.01],{z:-s*.12});
      add(new THREE.CylinderGeometry(.118,.095,.16,12),[0,.05,-.07],{x:.2});
      add(new THREE.BoxGeometry(.16,.055,.03),[0,.165,.096]);
    }else if(style===3){
      // Chic high bun / topknot with volume
      add(new THREE.SphereGeometry(.124,16,12,0,Math.PI*2,0,Math.PI*.72),[0,.125,-.01]);
      add(new THREE.SphereGeometry(.065,14,12),[0,.235,-.06]);
      add(new THREE.CylinderGeometry(.07,.055,.05,12),[0,.185,-.055]);
      add(new THREE.BoxGeometry(.15,.045,.03),[0,.16,.095]);
    }else if(style===4){
      // Modern wavy lob / textured layered cut
      add(new THREE.SphereGeometry(.125,16,12,0,Math.PI*2,0,Math.PI*.72),[0,.125,-.01]);
      for(const s of [-1,1]){
        add(new THREE.CylinderGeometry(.07,.055,.22,10),[s*.12,.01,.015],{z:-s*.14,x:.1});
        add(new THREE.SphereGeometry(.058,10,8),[s*.118,-.11,.02]);
      }
      add(new THREE.CylinderGeometry(.12,.10,.16,12),[0,.05,-.075],{x:.22});
      add(new THREE.BoxGeometry(.16,.052,.03),[0,.165,.095]);
    }else{
      // Style 0: Cascading long hair over shoulders
      add(new THREE.SphereGeometry(.124,16,12,0,Math.PI*2,0,Math.PI*.72),[0,.125,-.01]);
      for(const s of [-1,1]){
        add(new THREE.CylinderGeometry(.065,.058,.18,10),[s*.115,.05,.015],{z:-s*.1});
        add(new THREE.CylinderGeometry(.055,.045,.20,10),[s*.12,-.11,.02],{z:-s*.05});
      }
      add(new THREE.CylinderGeometry(.118,.105,.16,12),[0,.05,-.075],{x:.2});
      add(new THREE.CylinderGeometry(.102,.088,.18,12),[0,-.10,-.095],{x:.12});
      add(new THREE.BoxGeometry(.16,.052,.03),[0,.165,.095]);
    }
    const merged=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());return merged;
  }
  const ponytailTieGeo=new THREE.CylinderGeometry(.038,.038,.032,12);ponytailTieGeo.rotateX(-.65);ponytailTieGeo.translate(0,.19,-.11);
  const bunClipGeo=new THREE.TorusGeometry(.055,.008,8,16);bunClipGeo.rotateX(Math.PI/2);bunClipGeo.translate(0,.215,-.06);
  function getHairGeo(style){if(!hairGeoCache.has(style))hairGeoCache.set(style,buildHairGeometry(style));return hairGeoCache.get(style);}
  function createFemaleHair(style=0,hairColor='#261b16'){
    const g=new THREE.Group();
    const mat=new THREE.MeshStandardMaterial({color:hairColor,roughness:.82,metalness:.05});
    const mesh=new THREE.Mesh(getHairGeo(style),mat);mesh.castShadow=false;mesh.receiveShadow=true;g.add(mesh);
    if(style===1){const tie=new THREE.Mesh(ponytailTieGeo,mats.goldTrim);tie.castShadow=false;tie.receiveShadow=true;g.add(tie);}
    if(style===3){const clip=new THREE.Mesh(bunClipGeo,mats.goldTrim);clip.castShadow=false;clip.receiveShadow=true;g.add(clip);}
    return g;
  }
  const glassesGeo=(()=>{
    const geos=[];const add=(g,pos)=>{g.translate(...pos);geos.push(g.index?g.toNonIndexed():g);};
    for(const s of [-1,1]){add(new THREE.TorusGeometry(.025,.004,8,16),[s*.048,.122,.138]);}
    add(new THREE.BoxGeometry(.026,.005,.006),[0,.122,.141]);
    for(const s of [-1,1]){add(new THREE.BoxGeometry(.005,.005,.11),[s*.074,.124,.085]);}
    const m=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());return m;
  })();
  function createGlasses(color='#202228'){return new THREE.Mesh(glassesGeo,new THREE.MeshStandardMaterial({color,roughness:.35,metalness:.65}));}
  const peopleStyles = [
    // 0: Visitor (male tech founder in white button-down, indigo jeans, white sneakers)
    { top: '#f4f5f7', bottom: '#222f42', inner: '#f4f5f7', belt: '#382417', shoes: '#edeef0', hair: '#38251c', skin: '#dca080', female: false, beard: false },
    // 1: Reception Lead (female, chic coral red top, navy tailored pants, tan shoes, ponytail)
    { top: '#e04c38', bottom: '#1e293b', inner: '#fff5ed', belt: '#946e3e', shoes: '#824e35', hair: '#201614', skin: '#dfa280', female: true, hairStyle: 1 },
    // 2: Operations Staff (male engineer, emerald knit sweater, beige chinos, brown loafers, glasses)
    { top: '#25704a', bottom: '#ab9577', inner: '#ffffff', belt: '#362318', shoes: '#38251a', hair: '#241a15', skin: '#c88e67', female: false, beard: true, glasses: true },
    // 3: Systems Lead (female director, royal cobalt blouse, off-white trousers, sleek bob)
    { top: '#1f57ad', bottom: '#ede9e1', inner: '#f9f8f5', belt: '#a8813f', shoes: '#1e1c21', hair: '#40281c', skin: '#d59a76', female: true, hairStyle: 2 },
    // 4: Desk 1 Operations (female analyst, sunny mustard crewneck, slate jeans, topknot bun)
    { top: '#dba327', bottom: '#2b323c', inner: '#dba327', shoes: '#f2f3f5', hair: '#1a1512', skin: '#caa07a', female: true, hairStyle: 3 },
    // 5: Desk 2 Operations (male engineer, crimson red casual overshirt, white tee, indigo jeans)
    { top: '#b83344', bottom: '#1f2838', inner: '#fefefe', belt: '#2e1e16', shoes: '#78482e', hair: '#36251b', skin: '#cf936f', female: false, beard: false },
    // 6: Desk 3 Business Systems (female designer, pastel lilac sweater, khaki chinos, long hair)
    { top: '#8e5eb5', bottom: '#a89274', inner: '#8e5eb5', shoes: '#4e2e20', hair: '#ba9250', skin: '#dba484', female: true, hairStyle: 0 },
    // 7: Desk 4 Business Systems (male dev, cyan/teal shirt, charcoal slacks, black shoes, beard)
    { top: '#1c8b94', bottom: '#2c3038', inner: '#1c8b94', belt: '#1c1b1a', shoes: '#1a1a1a', hair: '#1e1814', skin: '#c48b66', female: false, beard: true },
    // 8: Desk 5 Operations Studio (male data eng, heather grey sweatshirt, navy chinos, trainers)
    { top: '#5f6c7a', bottom: '#1c2533', inner: '#ffffff', belt: '#262422', shoes: '#f0f2f5', hair: '#291e17', skin: '#cfa07f', female: false, beard: false, glasses: true },
    // 9: Desk 6 Operations Studio (female UI lead, mint sage top, white pants, wavy lob)
    { top: '#3a7d5e', bottom: '#ede9e1', inner: '#3a7d5e', belt: '#825332', shoes: '#885534', hair: '#6b2d1c', skin: '#d89e7a', female: true, hairStyle: 4 },
    // 10: Desk 7 Work Studio (female analyst, vibrant rose pink cardigan, dark denim, ponytail)
    { top: '#c94d76', bottom: '#212b3a', inner: '#fff0f4', shoes: '#1e1c1f', hair: '#201614', skin: '#d29774', female: true, hairStyle: 1 },
    // 11: Desk 8 Director (distinguished male director, midnight navy blazer, sky blue shirt, charcoal trousers, silver hair)
    { top: '#1a2d47', bottom: '#2d333b', inner: '#6894c4', belt: '#201712', shoes: '#4a1c22', hair: '#84878c', skin: '#d49f7e', female: false, beard: true },
    // 12: Wanderer 1 Lounge (female marketing lead, terracotta orange top, slate pants, sleek bob)
    { top: '#d95e2d', bottom: '#262d36', inner: '#d95e2d', shoes: '#7a472b', hair: '#3a2418', skin: '#dba37e', female: true, hairStyle: 2 },
    // 13: Wanderer 2 Main Aisle (male product lead, royal blue polo, beige chinos, white sneakers)
    { top: '#1e5cb3', bottom: '#a69275', inner: '#1e5cb3', belt: '#302219', shoes: '#f2f3f5', hair: '#221915', skin: '#c88e67', female: false, beard: false },
    // 14: Wanderer 3 Ops Studio (female agile coach, emerald jade blouse, dark navy jeans, long hair)
    { top: '#227d5b', bottom: '#202b3b', inner: '#eafff5', shoes: '#663a22', hair: '#1c1512', skin: '#d69e7b', female: true, hairStyle: 0 },
    // 15: Wanderer 4 Work Studio (male writer, amber hoodie, charcoal jeans, white sneakers, beard)
    { top: '#c78020', bottom: '#2f343d', inner: '#c78020', belt: '#241a14', shoes: '#f5f5f7', hair: '#181514', skin: '#cd9470', female: false, beard: true }
  ];
  function person(clothing = 'shirt', skin = 'skin', scale = 1) {
    const root = new THREE.Group(), model = cloneRig(humanTemplate);
    root.add(model); scene.add(root);
    const palette = { shirt: '#698299', white: '#b6b2a2', navy: '#52677d', olive: '#859176', brown: '#a28370' };
    const cfg = typeof clothing === 'object' && clothing !== null ? clothing : { top: palette[clothing] || (typeof clothing === 'string' && clothing.startsWith('#') ? clothing : palette.shirt), bottom: '#263445' };
    const targetHeight = cfg.female ? 1.68 : 1.78;
    model.scale.setScalar(targetHeight / humanHeight * scale);
    model.position.y = .075 - humanBounds.min.y * model.scale.y;
    let headBone = null;
    model.traverse(o => {
      if (o.isBone && canonical(o.name) === 'Head') headBone = o;
      if (o.isBone && cfg.female && canonical(o.name).includes('Shoulder')) o.scale.set(.88, .94, .88);
      if (o.isSkinnedMesh) {
        if (o.name === 'Object_11') { if (cfg.female || cfg.beard === false) o.visible = false; }
        if (o.name === 'Object_9') { if (cfg.female) o.visible = false; }
        o.material = o.material.clone(); o.material.metalness = 0; o.material.forceSinglePass = true; o.material.roughness = .82;
        if (o.material.name.includes('look')) {
          o.material.map = null;
          o.geometry = o.geometry.clone();
          const pos = o.geometry.attributes.position;
          const count = pos.count;
          const colArr = new Float32Array(count * 3);
          const topCol = new THREE.Color(cfg.top || cfg.suit || '#e05342');
          const botCol = new THREE.Color(cfg.bottom || cfg.pants || '#263445');
          const innerCol = new THREE.Color(cfg.inner || cfg.shirt || '#f5f6f8');
          const beltCol = new THREE.Color(cfg.belt || '#201815');
          for (let i = 0; i < count; i++) {
            const y = pos.getY(i), x = pos.getX(i), z = pos.getZ(i);
            let c = topCol;
            if (y < .86) {
              c = botCol;
            } else if (y >= .86 && y < .90 && cfg.belt) {
              c = beltCol;
            } else if (cfg.inner && y >= 1.15 && y <= 1.48 && Math.abs(x) < .085 && z > .038) {
              c = innerCol;
            }
            colArr[i * 3] = c.r;
            colArr[i * 3 + 1] = c.g;
            colArr[i * 3 + 2] = c.b;
          }
          o.geometry.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
          o.material.vertexColors = true;
          o.material.color.set('#ffffff');
          o.material.needsUpdate = true;
        } else if (o.material.name.includes('shoes')) {
          o.material.map = null;
          if (cfg.shoes) o.material.color.set(cfg.shoes);
          o.material.needsUpdate = true;
        } else if (o.material.name.includes('hair')) {
          o.material.map = null;
          if (cfg.hair) o.material.color.set(cfg.hair);
          o.material.needsUpdate = true;
        } else if (o.material.name.includes('body')) {
          if (cfg.skin) o.material.color.set(cfg.skin);
        }
        if (o.material.map) o.material.map.anisotropy = maxAnisotropy;
        o.castShadow = false; o.receiveShadow = true; o.frustumCulled = false;
      }
    });
    if (headBone) {
      if (cfg.female) {
        const hair = createFemaleHair(cfg.hairStyle || 0, cfg.hair || '#261b16');
        headBone.add(hair);
      }
      if (cfg.glasses) {
        headBone.add(createGlasses(cfg.glassesColor || '#222226'));
      }
    }
    const mixer = new THREE.AnimationMixer(model), idle = mixer.clipAction(idleClip).play(), walk = mixer.clipAction(walkClip).play();
    walk.setEffectiveWeight(0); mixer.update(0); let blend = 0; const savedPose = new Map(); const footShadow = shadow(0, 0, .75, .75);
    return {
      root, model, mixer, shadow: footShadow,
      get walkWeight() { return blend },
      finishWalk() { blend = 0; idle.setEffectiveWeight(1); walk.setEffectiveWeight(0); mixer.update(0) },
      walk(distance, moving, dt = .016, speed = 0) {
        const goal = moving ? Math.min(1, speed / .65) : 0;
        blend = THREE.MathUtils.damp(blend, goal, 7, dt);
        idle.setEffectiveWeight(1 - blend);
        walk.setEffectiveWeight(blend);
        walk.timeScale = Math.max(.25, speed / 1.08);
        if (root.userData.seated) for (const [bone, q] of savedPose) bone.quaternion.copy(q);
        mixer.update(reduced ? 0 : dt);
        if (root.userData.seated) {
          model.traverse(b => {
            if (!b.isBone) return;
            const n = canonical(b.name);
            if (['LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm'].includes(n)) savedPose.set(b, b.quaternion.clone());
            if (n === 'LeftUpLeg' || n === 'RightUpLeg') b.rotateX(-1.25);
            if (n === 'LeftLeg' || n === 'RightLeg') b.rotateX(1.35);
            if (n === 'LeftArm') b.rotateZ(.32);
            if (n === 'RightArm') b.rotateZ(-.32);
            if (n === 'LeftForeArm' || n === 'RightForeArm') b.rotateX(-.45);
          });
        }
        footShadow.position.x = root.position.x; footShadow.position.y = root.position.y < -.3 ? root.position.y + .018 : .09; footShadow.position.z = root.position.z
      },
      idleStart(offset) { mixer.update(offset) }
    }
  }
  dynamic = true; const visitor = person(peopleStyles[0]); visitor.root.position.set(0, 0, 9.15); visitor.root.rotation.y = Math.PI; const receptionStaff = person(peopleStyles[1]); receptionStaff.root.position.set(-2.55, 0, 1.42); receptionStaff.idleStart(.4); const staff = person(peopleStyles[2]); staff.root.position.set(-8.2, 0, -6.3); staff.root.rotation.y = 1.1; staff.idleStart(1.2); const staff2 = person(peopleStyles[3]); staff2.root.position.set(5.35, 0, -2.5); staff2.root.rotation.y = -1; staff2.idleStart(2.3); const employees = [receptionStaff, staff, staff2]; const seated = []; for (const [i, [x, z]] of [[-6.7, -3.4], [-3.85, -6.8], [3.85, -3.4], [-14.4, -6.5], [-11.4, -3.3], [11.4, -6.5], [14.4, -3.3], [12.7, 3.4]].entries()) { const human = person(peopleStyles[4 + i], 'skin', .94 + (i % 3) * .04); human.root.position.set(x, -.45, i === 7 ? 2.25 : z + 1); human.root.rotation.y = i === 7 ? 0 : Math.PI; human.root.userData.seated = true; human.idleStart(i * .73); employees.push(human); seated.push(human) }
  const wanderers = []; for (const [i, points] of [[[-8.3, 5.3], [-8.3, -.6], [-5.8, -.6], [-5.8, 5.3]], [[2.3, 6.3], [4, 6.3], [4, 1.0], [2.3, 1.0]], [[-15.5, .2], [-10.5, .2], [-10.5, 6.4], [-15.5, 6.4]], [[10, -.2], [15.5, -.2], [15.5, 1.2], [10, 1.2]]].entries()) { const human = person(peopleStyles[12 + i]); human.root.position.set(points[0][0], 0, points[0][1]); human.idleStart(i * .65); employees.push(human); wanderers.push({ human, points, index: 1, distance: 0, pause: i * .8, speed: .62 + i * .065 }) }
  const outdoorStyles = [
    // 0: Female in cherry red windbreaker, indigo denim, white sneakers, golden ponytail
    { top: '#d62f3f', bottom: '#1c2536', inner: '#ffffff', shoes: '#f4f5f8', hair: '#c29957', skin: '#dba280', female: true, hairStyle: 1 },
    // 1: Male in sunny golden hoodie, charcoal joggers, dark brown boots
    { top: '#dba026', bottom: '#272b33', inner: '#dba026', shoes: '#442b1c', hair: '#2a1e17', skin: '#c98d64', female: false, beard: false },
    // 2: Female in vibrant turquoise jacket, white pants, sleek bob
    { top: '#18a0b5', bottom: '#f0ece4', inner: '#ffffff', shoes: '#f5f5f7', hair: '#1b1614', skin: '#d59a76', female: true, hairStyle: 2 },
    // 3: Male in forest emerald jacket, beige khakis, white sneakers, beard
    { top: '#276d47', bottom: '#9e896d', inner: '#ffffff', shoes: '#f4f5f8', hair: '#382419', skin: '#d69e7b', female: false, beard: true },
    // 4: Female in rich royal purple sweater, stone grey pants, topknot bun
    { top: '#803ca8', bottom: '#434954', inner: '#803ca8', shoes: '#1c1a1d', hair: '#702c1b', skin: '#dc9f7c', female: true, hairStyle: 3 }
  ];
  const outdoorWalkers = [];
  const outdoorPaths = [
    [[-13, 14.1], [13, 14.1]],
    [[-8, 11.6], [8, 11.6]],
    [[-19.1, -12], [-19.1, 12]],
    [[19.1, 12], [19.1, -12]],
    [[19.2, 14.5], [19.2, 23.5], [19.2, 14.5]]
  ];
  for (const [i, points] of outdoorPaths.entries()) {
    const human = person(outdoorStyles[i], 'skin', .96 + (i % 2) * .04);
    human.root.position.set(points[0][0], -.68, points[0][1]);
    human.idleStart(i * .91);
    outdoorWalkers.push({ human, points, index: 1, distance: 0, pause: i * .2, speed: .68 + i * .05 });
  }
  dynamic = false;
  // Merge immovable opaque architecture by material to reduce draw calls.
  const excluded = [visitor.root, ...employees.map(p => p.root), ...outdoorWalkers.map(p => p.human.root), ...movingCars.map(c => c.g), backWall, sideWall, eastSideWall, ...doors]; function excludedTree(o) { for (let p = o; p; p = p.parent)if (excluded.includes(p)) return true; return false } scene.updateMatrixWorld(true); staticObjects.length = 0; scene.traverse(o => { if (o.isMesh && !o.material.transparent && !excludedTree(o)) staticObjects.push(o) }); visitor.root.traverse(o => { if (o.isMesh) o.castShadow = false }); for (const p of outdoorWalkers) p.human.root.traverse(o => { if (o.isMesh) o.castShadow = false });
  const byMaterial = new Map(); for (const o of staticObjects) { o.updateMatrixWorld(true); const transformed = o.geometry.clone().applyMatrix4(o.matrixWorld); const geo = transformed.index ? transformed.toNonIndexed() : transformed; const key = o.material.uuid; if (!byMaterial.has(key)) byMaterial.set(key, { material: o.material, geos: [] }); byMaterial.get(key).geos.push(geo); o.removeFromParent() } for (const { material, geos } of byMaterial.values()) { const geo = mergeGeometries(geos, false); if (geo) { const o = new THREE.Mesh(geo, material); o.castShadow = true; o.receiveShadow = true; scene.add(o) } geos.forEach(g => g.dispose()) }
  const hotspots = []; for (const [id, label, pos] of [['reception', 'Reception', [-2.6, 1.6, 2.5]], ['payments', 'Payments', [-5.3, 1.5, -3.2]], ['business', 'Business systems', [5.0, 1.5, -3.2]], ['meeting', 'Meeting room', [.7, 1.5, -6.7]], ['operations', 'Operations', [-13, 1.4, -4]], ['lounge', 'The lounge', [-13, 1.3, 2.5]], ['cabin', 'Director', [13, 1.4, 3.5]]]) { const button = document.createElement('button'); button.className = 'hotspot'; button.textContent = label; button.setAttribute('aria-label', `Visit ${label}`); button.onclick = () => go(id); stage.appendChild(button); hotspots.push({ button, id, point: new THREE.Vector3(...pos) }) }
  let w, h, viewSize = 34, offsetX = 0, offsetY = 0;
  const camGoal = new THREE.Vector3(20, 19, 24), targetGoal = new THREE.Vector3(0, .3, 0); let viewGoal = viewSize;
  let path = [], currentRoom = '', destination = '', walkDistance = 0, pending = null, doorAmount = 0, velocity = 0, tourClock = 0, autoView = true, manualAngle = null, arrivalAge = 0;
  let navGeneration = 0, navState = 'idle', routeLength = 0, routeTravelled = 0, settleTime = 0, finalYaw = Math.PI, manualClock = false, simulationTime = 0;
  let cameraStart = null, arrivalDelivered = false; let freeCam = false, zoomFocus = null; const heldKeys = new Set(); const pointers = new Map(); let gesture = null; let cameraAction = null; const viewButtons = [...document.querySelectorAll('[data-view]')];
  function viewLabels() { if ($('#free-camera')) $('#free-camera').setAttribute('aria-pressed', String(freeCam)); viewButtons.forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.view === 'auto' ? autoView : b.dataset.view === 'front' ? manualAngle === .55 : manualAngle === 2.55)); b.disabled = navState === 'travelling' || navState === 'settling' }) }
  viewButtons.forEach(b => b.onclick = () => { freeCam = false; document.body.classList.remove('free-cam'); if (navState === 'travelling' || navState === 'settling') return; autoView = b.dataset.view === 'auto'; manualAngle = autoView ? null : b.dataset.view === 'front' ? .55 : 2.55; tourClock = 0; viewLabels() });
  function resizeProjection() {
    const aspect = w / h;
    const fovScale = aspect < 1.40 ? (1.40 / aspect) : 1.0;
    const currentView = viewSize * fovScale;
    camera.left = -currentView * aspect / 2;
    camera.right = currentView * aspect / 2;
    camera.top = currentView / 2;
    camera.bottom = -currentView / 2;
    camera.setViewOffset(w, h, offsetX * w, offsetY * h, w, h);
    camera.updateProjectionMatrix();
  }
  let qualityMode = 'auto', adaptiveRatio = Math.min(stage.clientWidth < 768 ? 1.5 : 1.6, devicePixelRatio || 1), frameSamples = []; function pixelRatio() { return qualityMode === 'auto' ? adaptiveRatio : Math.min(devicePixelRatio || 1, { high: 1.8, balanced: 1.25, performance: 1 }[qualityMode]); }
  function resize() { w = stage.clientWidth; h = stage.clientHeight; renderer.setPixelRatio(pixelRatio()); renderer.setSize(w, h); resizeProjection() } window.addEventListener('resize', resize); resize();
  function setActive(id, travelling = false) { document.querySelectorAll('[data-room]').forEach(b => b.setAttribute('aria-current', String(b.dataset.room === id))); const r = rooms[id]; $('#caption-tag').textContent = travelling ? 'On our way / ' + r.tag : r.tag; $('#caption-title').textContent = travelling ? 'Walking to ' + ({ reception: 'reception', payments: 'payments', business: 'business systems', meeting: 'the meeting room', operations: 'operations', lounge: 'the lounge', cabin: 'the director’s cabin' }[id]) + '.' : r.title; $('#caption-text').textContent = travelling ? 'Your destination opens after arrival.' : r.text }
  function hidePanelForNavigation() { ++cardGeneration; cardAnimation?.cancel(); overlayAnimation?.cancel(); wrap.classList.remove('open'); disposeStudio(); studio = null; }
  cancelNavigation = () => { if (navState !== 'travelling' && navState !== 'settling') return; ++navGeneration; path = []; pending = null; velocity = 0; navState = 'idle'; currentRoom = ''; arrivalDelivered = false; camGoal.copy(camera.position); targetGoal.copy(camTarget); viewGoal = viewSize; tourClock = 0; viewLabels(); };
  const ease = t => { t = THREE.MathUtils.clamp(t, 0, 1); return t * t * (3 - 2 * t) }, angleDelta = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  go = id => {
    if (!rooms[id]) return; recordRoute('#/office/' + id); freeCam = false; document.body.classList.remove('free-cam'); const r = rooms[id], endPoint = new THREE.Vector3(...r.position); if (currentRoom === id && navState === 'arrived' && visitor.root.position.distanceTo(endPoint) < .015) { panel(id, true); return }
    hidePanelForNavigation(); ++navGeneration; entered = true; document.body.classList.add('entered'); destination = id; currentRoom = ''; pending = id; navState = 'travelling'; arrivalDelivered = false; settleTime = 0; routeTravelled = 0; velocity = 0; tourClock = 0; arrivalAge = 0; manualAngle = null; autoView = true;
    cameraStart = { target: camTarget.clone(), theta: Math.atan2(camera.position.x - camTarget.x, camera.position.z - camTarget.z), radius: Math.hypot(camera.position.x - camTarget.x, camera.position.z - camTarget.z), height: camera.position.y, view: viewSize, ox: offsetX, oy: offsetY };
    const start = visitor.root.position.clone(); path = []; const add = (x, z) => { const p = new THREE.Vector3(x, 0, z), last = path.at(-1) || start; if (last.distanceTo(p) > .001) path.push(p) };
    // Leave each room through the clear centre aisle; cross behind the slatted partitions.
    if (Math.abs(start.x) > 9 && Math.abs(endPoint.x) > 9 && Math.sign(start.x) === Math.sign(endPoint.x)) { add(endPoint.x, endPoint.z); } else { if (start.z > 7.7) add(0, 6.5); if (Math.abs(start.x) > .03) add(0, Math.min(start.z, 4.3)); add(0, endPoint.z); add(endPoint.x, endPoint.z); }
    let previous = start; routeLength = 0; for (const p of path) { routeLength += previous.distanceTo(p); previous = p } routeLength = Math.max(routeLength, .001);
    camGoal.set(...r.camera); targetGoal.set(...r.target); viewGoal = 17; const face = new THREE.Vector3(...r.lookAt).sub(endPoint); finalYaw = Math.atan2(face.x, face.z); setActive(id, true); $('#hint').style.opacity = '0'; viewLabels();
    if (reduced || !path.length) { visitor.root.position.copy(endPoint); visitor.root.rotation.y = finalYaw; path = []; routeTravelled = routeLength; navState = 'settling'; velocity = 0; }
  };
  $('#enter').onclick = () => go('reception'); viewLabels(); let last = performance.now();
  function update(dt, now, draw = true) {
    const mobile = w < 768; arrivalAge += dt; simulationTime += dt; const modal = wrap.classList.contains('open');
    // Movement updates first. Camera and arrival checks use this same resulting position.
    let moving = navState === 'travelling' && path.length > 0;
    if (moving) {
      let remaining = dt; while (remaining > 0) {
        const stepDt = Math.min(remaining, 1 / 90); remaining -= stepDt; const point = path[0]; if (!point) break; const dir = point.clone().sub(visitor.root.position); dir.y = 0; const distance = dir.length();
        if (distance < .015) { visitor.root.position.copy(point); path.shift(); if (!path.length) { navState = 'settling'; velocity = 0; settleTime = 0; routeTravelled = routeLength; break } continue }
        const yaw = Math.atan2(dir.x, dir.z), difference = angleDelta(visitor.root.rotation.y, yaw); visitor.root.rotation.y += difference * (1 - Math.exp(-stepDt * 9)); const aligned = Math.max(0, 1 - Math.abs(difference) / 1.30), brake = Math.min(1, distance / (path.length === 1 ? .38 : .20)); const desired = 1.25 * aligned * brake; velocity = THREE.MathUtils.damp(velocity, desired, 9, stepDt); const step = Math.min(stepDt * velocity, distance); visitor.root.position.addScaledVector(dir, step / distance); routeTravelled += step; walkDistance += step;
      }
    }
    if (navState === 'settling') { visitor.root.position.set(...rooms[destination].position); velocity = 0; settleTime += dt; const d = angleDelta(visitor.root.rotation.y, finalYaw); visitor.root.rotation.y += reduced ? d : d * (1 - Math.exp(-dt * 9)); }
    moving = navState === 'travelling'; visitor.walk(walkDistance, moving && !reduced, dt, velocity); for (const employee of employees) if (!wanderers.some(w => w.human === employee)) employee.walk(0, false, dt); for (const w of wanderers) { if (reduced) { w.human.walk(0, false, dt); continue; } if (w.pause > 0) { w.pause -= dt; w.human.walk(0, false, dt); continue; } const point = w.points[w.index], dir = new THREE.Vector3(point[0], 0, point[1]).sub(w.human.root.position), distance = dir.length(); if (distance < .025) { w.index = (w.index + 1) % w.points.length; w.pause = 1.2 + (w.index % 3) * .7; w.human.walk(0, false, dt); } else { const yaw = Math.atan2(dir.x, dir.z); w.human.root.rotation.y += angleDelta(w.human.root.rotation.y, yaw) * (1 - Math.exp(-dt * 7)); const step = Math.min(distance, w.speed * dt); w.human.root.position.addScaledVector(dir, step / distance); w.distance += step; w.human.walk(w.distance, true, dt, w.speed); } }
    for (const car of movingCars) {
      if (reduced) continue;
      car.dist += car.speed * dt;
      const pose = getCircuitPose(car.circuit, car.dist);
      car.g.position.x = pose.x; car.g.position.z = pose.z; car.g.rotation.y = pose.yaw;
      for (const wheel of car.wheels) wheel.rotateY(car.speed * dt * 3.33);
    }
    for (const w of outdoorWalkers) {
      if (reduced) { w.human.walk(0, false, dt); continue; }
      if (w.pause > 0) { w.pause -= dt; w.human.walk(0, false, dt); continue; }
      const point = w.points[w.index], dir = new THREE.Vector3(point[0], 0, point[1]).sub(w.human.root.position);
      dir.y = 0; const distance = dir.length();
      if (distance < .03) {
        w.index = (w.index + 1) % w.points.length;
        w.pause = .25 + (w.index % 2) * .25;
        w.human.walk(0, false, dt);
      } else {
        const yaw = Math.atan2(dir.x, dir.z);
        w.human.root.rotation.y += angleDelta(w.human.root.rotation.y, yaw) * (1 - Math.exp(-dt * 7));
        const step = Math.min(distance, w.speed * dt);
        w.human.root.position.addScaledVector(dir, step / distance);
        w.distance += step;
        w.human.walk(w.distance, true, dt, w.speed);
      }
    }
    const travelling = navState === 'travelling' || navState === 'settling'; if (travelling) {
      const p = THREE.MathUtils.clamp(routeTravelled / routeLength, 0, 1), blend = ease(p), introBlend = ease(p / .20), endPoint = new THREE.Vector3(...rooms[destination].position), context = targetGoal.clone().sub(new THREE.Vector3(endPoint.x, 1, endPoint.z)); const anchor = new THREE.Vector3(visitor.root.position.x, 1, visitor.root.position.z).addScaledVector(context, blend); camTarget.copy(cameraStart.target).lerp(anchor, introBlend);
      const endTheta = Math.atan2(camGoal.x - targetGoal.x, camGoal.z - targetGoal.z), theta = cameraStart.theta + angleDelta(cameraStart.theta, endTheta) * blend, radius = THREE.MathUtils.lerp(cameraStart.radius, Math.hypot(camGoal.x - targetGoal.x, camGoal.z - targetGoal.z), blend); camera.position.set(camTarget.x + Math.sin(theta) * radius, THREE.MathUtils.lerp(cameraStart.height, camGoal.y, blend), camTarget.z + Math.cos(theta) * radius); viewSize = THREE.MathUtils.lerp(cameraStart.view, viewGoal, blend); offsetX = THREE.MathUtils.lerp(cameraStart.ox, 0, blend); offsetY = THREE.MathUtils.lerp(cameraStart.oy, mobile ? .02 : 0, blend);
    } else if (freeCam) {
      if (heldKeys.size) zoomFocus = null; const speed = viewSize * .45 * dt; const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0); const forward = new THREE.Vector3(-right.z, 0, right.x); const delta = new THREE.Vector3(); if (heldKeys.has('w') || heldKeys.has('arrowup')) delta.addScaledVector(forward, -speed); if (heldKeys.has('s') || heldKeys.has('arrowdown')) delta.addScaledVector(forward, speed); if (heldKeys.has('a') || heldKeys.has('arrowleft')) delta.addScaledVector(right, -speed); if (heldKeys.has('d') || heldKeys.has('arrowright')) delta.addScaledVector(right, speed); if (heldKeys.has('q')) delta.y -= speed; if (heldKeys.has('e')) delta.y += speed; camera.position.add(delta); camTarget.add(delta); const center = camTarget.clone(); camTarget.x = THREE.MathUtils.clamp(camTarget.x, -35, 35); camTarget.z = THREE.MathUtils.clamp(camTarget.z, -30, 28); camTarget.y = THREE.MathUtils.clamp(camTarget.y, 0, 8); camera.position.add(camTarget.clone().sub(center)); viewSize = THREE.MathUtils.damp(viewSize, viewGoal, 10, dt); offsetX = THREE.MathUtils.damp(offsetX, 0, 8, dt); offsetY = THREE.MathUtils.damp(offsetY, 0, 8, dt); camGoal.copy(camera.position); targetGoal.copy(camTarget);
    } else {
      const smooth = reduced ? 1 : 1 - Math.exp(-dt * 5); let theta = Math.atan2(camera.position.x - camTarget.x, camera.position.z - camTarget.z), radius = Math.hypot(camera.position.x - camTarget.x, camera.position.z - camTarget.z), base = Math.atan2(camGoal.x - targetGoal.x, camGoal.z - targetGoal.z), desired = manualAngle ?? base;
      // Auto orbit only runs after arrival and after the information panel closes.
      if (entered && autoView && !modal && navState === 'arrived' && !reduced && arrivalAge > 6) { tourClock += dt; desired = base + Math.sin(tourClock * .12) * .24; } else if (!entered && !reduced) { desired = base + Math.sin(now * .00012) * .025 }
      camTarget.lerp(targetGoal, smooth); theta += angleDelta(theta, desired) * smooth; radius = THREE.MathUtils.lerp(radius, Math.hypot(camGoal.x - targetGoal.x, camGoal.z - targetGoal.z), smooth); camera.position.set(camTarget.x + Math.sin(theta) * radius, THREE.MathUtils.lerp(camera.position.y, camGoal.y, smooth), camTarget.z + Math.cos(theta) * radius); viewSize = THREE.MathUtils.lerp(viewSize, viewGoal, smooth); offsetX = THREE.MathUtils.lerp(offsetX, entered ? 0 : mobile ? 0 : w < 1000 ? -.18 : -.13, smooth); offsetY = THREE.MathUtils.lerp(offsetY, mobile ? .02 : 0, smooth);
    }
    resizeProjection(); camera.lookAt(camTarget); camera.updateMatrixWorld();
    if (freeCam && zoomFocus) { const point = cursorPoint(zoomFocus.clientX, zoomFocus.clientY); if (point) { const delta = zoomFocus.point.clone().sub(point); camera.position.add(delta); camTarget.add(delta); camGoal.copy(camera.position); targetGoal.copy(camTarget); camera.lookAt(camTarget); camera.updateMatrixWorld(); } if (Math.abs(viewSize - viewGoal) < .0001) zoomFocus = null; }
    const doorGoal = entered ? 1 : 0; doorAmount += (doorGoal - doorAmount) * (reduced ? 1 : 1 - Math.exp(-dt * 4)); doors[0].position.x = -.64 - doorAmount * .95; doors[1].position.x = .64 + doorAmount * .95;
    const placedLabels = []; for (const hot of hotspots) { const p = hot.point.clone().project(camera), x = (p.x * .5 + .5) * w, y = (-p.y * .5 + .5) * h; let visible = !mobile && viewSize < 48 && entered && !travelling && x > 20 && x < w - 20 && y > 60 && y < h - 180 && !modal; hot.button.style.display = visible ? 'flex' : 'none'; hot.button.style.left = `${x}px`; hot.button.style.top = `${y}px`; hot.button.style.transform = 'translate(-50%,-50%)'; if (visible) { const r = { left: x - hot.button.offsetWidth / 2, right: x + hot.button.offsetWidth / 2, top: y - hot.button.offsetHeight / 2, bottom: y + hot.button.offsetHeight / 2 }; if (placedLabels.some(a => r.left < a.right + 8 && r.right > a.left - 8 && r.top < a.bottom + 8 && r.bottom > a.top - 8)) { hot.button.style.display = 'none'; } else placedLabels.push(r); } }
    if (draw && (!modal || travelling || Math.floor(now / 100) !== Math.floor((now - dt * 1000) / 100) || !window.__jodetxReady)) renderer.render(scene, camera); window.__jodetxReady = true;
    if (navState === 'settling' && pending && !arrivalDelivered) { const r = rooms[pending], distance = visitor.root.position.distanceTo(new THREE.Vector3(...r.position)), heading = Math.abs(angleDelta(visitor.root.rotation.y, finalYaw)), cameraError = camera.position.distanceTo(camGoal); if (distance < .015 && heading < .01 && visitor.walkWeight < .02 && cameraError < .005 && (reduced || settleTime > .4)) { const id = pending, generation = navGeneration; visitor.root.rotation.y = finalYaw; visitor.finishWalk(); pending = null; currentRoom = id; navState = 'arrived'; arrivalDelivered = true; arrivalAge = 0; setActive(id); viewLabels(); if (draw) renderer.render(scene, camera); if (generation === navGeneration) { window.dispatchEvent(new CustomEvent('jodetx:arrival', { detail: { id, generation, position: visitor.root.position.toArray(), distance, heading, cameraError } })); if (w >= 768) panel(id, true); } } }
  }

  function enableFree() { zoomFocus = null; hidePanelForNavigation(); cancelNavigation(); entered = true; document.body.classList.add('entered', 'free-cam'); freeCam = true; autoView = false; manualAngle = null; camGoal.copy(camera.position); targetGoal.copy(camTarget); viewGoal = viewSize; $('#caption-tag').textContent = 'YOUR PERSPECTIVE'; $('#caption-title').textContent = 'Explore the office.'; $('#caption-text').textContent = 'Drag to orbit · right-drag to pan · scroll to zoom'; viewLabels(); }
  function cursorPoint(clientX, clientY) { const rect = renderer.domElement.getBoundingClientRect(), ndc = new THREE.Vector2((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1); const ray = new THREE.Raycaster(); camera.updateMatrixWorld(); ray.setFromCamera(ndc, camera); const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), camTarget); return ray.ray.intersectPlane(plane, new THREE.Vector3()); }
  function zoom(factor, clientX, clientY) { if (!freeCam) enableFree(); if (Number.isFinite(clientX) && Number.isFinite(clientY)) { const point = cursorPoint(clientX, clientY); zoomFocus = point ? { point, clientX, clientY } : null; } else zoomFocus = null; viewGoal = THREE.MathUtils.clamp(viewGoal * factor, 5, 140); }
  function preset(kind) { enableFree(); camTarget.set(0, .3, -1); camera.position.set(kind === 'top' ? 0 : 30, kind === 'top' ? 48 : 28, kind === 'top' ? .02 : 36); viewSize = viewGoal = kind === 'neighbourhood' ? 62 : kind === 'top' ? 42 : 34; offsetX = offsetY = 0; resizeProjection(); camera.lookAt(camTarget); }
  $('#quality').onchange = e => { qualityMode = e.target.value; resize(); };
  $('#free-camera').onclick = () => { if (freeCam) { freeCam = false; document.body.classList.remove('free-cam'); camGoal.copy(camera.position); targetGoal.copy(camTarget); viewLabels(); } else enableFree(); }; $('#full-view').onclick = () => preset('full'); $('#top-view').onclick = () => preset('top'); $('#neighbourhood').onclick = () => preset('neighbourhood'); $('#camera-help').onclick = () => { $('#controls-help').hidden = !$('#controls-help').hidden; };
  const canvas = renderer.domElement; canvas.style.touchAction = 'none'; canvas.tabIndex = 0; canvas.setAttribute('aria-label', 'Interactive office. Drag to rotate; right-drag to pan; scroll or pinch to zoom. W A S D move in free camera; Q E change height.'); canvas.addEventListener('contextmenu', e => e.preventDefault());
  function orbit(dx, dy) { zoomFocus = null; const offset = camera.position.clone().sub(camTarget), spherical = new THREE.Spherical().setFromVector3(offset); spherical.theta -= dx * .006; spherical.phi = THREE.MathUtils.clamp(spherical.phi + dy * .006, .12, 1.40); camera.position.copy(camTarget).add(new THREE.Vector3().setFromSpherical(spherical)); camera.lookAt(camTarget); }
  function pan(dx, dy) { zoomFocus = null; const delta = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(-dx * viewSize / h); delta.addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1), dy * viewSize / h); camera.position.add(delta); camTarget.add(delta); }
  canvas.addEventListener('pointerdown', e => { if (!freeCam) enableFree(); canvas.focus(); canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pointers.size === 2) { const [a, b] = [...pointers.values()]; gesture = { distance: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; zoomFocus = null; } else gesture = null; cameraAction = e.button === 2 || e.shiftKey ? 'pan' : 'orbit'; }); canvas.addEventListener('pointermove', e => { if (!pointers.has(e.pointerId)) return; const old = pointers.get(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pointers.size === 2) { const [a, b] = [...pointers.values()], g = { distance: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; if (gesture) { pan(g.x - gesture.x, g.y - gesture.y); zoom(gesture.distance / Math.max(20, g.distance), g.x, g.y); } gesture = g; } else { gesture = null; const dx = e.clientX - old.x, dy = e.clientY - old.y; cameraAction === 'pan' ? pan(dx, dy) : orbit(dx, dy); } }); for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, e => { pointers.delete(e.pointerId); gesture = null; }); stage.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(THREE.MathUtils.clamp(e.deltaY, -150, 150) * .0018), e.clientX, e.clientY); }, { passive: false });
  document.addEventListener('keydown', e => { if (wrap.classList.contains('open') || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; const k = e.key.toLowerCase(); if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', '+', '=', '-', '0', 'f'].includes(k)) { e.preventDefault(); if (k === '+' || k === '=') return zoom(.88); if (k === '-') return zoom(1.14); if (k === '0') return preset('full'); if (k === 'f') return enableFree(); if (!freeCam) enableFree(); heldKeys.add(k); } }); document.addEventListener('keyup', e => heldKeys.delete(e.key.toLowerCase())); window.addEventListener('blur', () => { heldKeys.clear(); pointers.clear(); });

  function animate(now) { requestAnimationFrame(animate); if (document.hidden || document.body.classList.contains('graphics-unavailable')) { last = now; return; } const dt = Math.min((now - last) / 1000, .1); last = now; if (!manualClock) { if (qualityMode === 'auto' && !wrap.classList.contains('open')) { frameSamples.push(dt); if (frameSamples.length === 24) { const avg = frameSamples.reduce((a, b) => a + b, 0) / 24; frameSamples = []; if (avg > .042 && adaptiveRatio > .8) { adaptiveRatio = Math.max(.8, adaptiveRatio - .2); resize(); } } } update(dt, now) } }
  renderer.render(scene, camera); renderer.shadowMap.autoUpdate = false; $('#loading').classList.add('done'); requestAnimationFrame(animate);
  window.__jodetx = { go, panel, close, renderer, scene, camera, visitor, employees, wanderers, pedestrians: outdoorWalkers, cars: movingCars, free: enableFree, preset, zoom, worldAtCursor: cursorPoint, cameraState: () => ({ freeCam, qualityMode, pixelRatio: renderer.getPixelRatio(), viewSize, viewGoal, target: camTarget.toArray() }), view: id => document.querySelector(`[data-view="${id}"]`).click(), navigation: () => ({ state: navState, destination, currentRoom, pending, generation: navGeneration, progress: Math.min(1, routeTravelled / routeLength || 0), position: visitor.root.position.toArray(), target: destination ? rooms[destination].position : null, walkWeight: visitor.walkWeight, camera: camera.position.toArray(), cameraGoal: camGoal.toArray(), cameraError: camera.position.distanceTo(camGoal), settleTime, headingError: Math.abs(angleDelta(visitor.root.rotation.y, finalYaw)) }), setManualClock: enabled => { manualClock = enabled; last = performance.now() }, advanceForTest: dt => update(Math.min(dt, .1), simulationTime * 1000, false) };
  renderer.domElement.addEventListener('webglcontextrestored', () => location.reload()); renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); $('#fallback').style.display = 'block'; document.body.classList.add('graphics-unavailable'); $('#intro').style.display = 'none'; $('#toolbar').style.display = 'none' });
}
