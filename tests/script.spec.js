/* global test, expect, assert, apps, filterAppsByQuery, setUrlParam, getUrlParam */

function clickTab(name){
  const el = document.querySelector(`.tab[data-tab="${name}"]`);
  if(!el) throw new Error(`Tab not found: ${name}`);
  el.click();
}

function resetQuery(){
  const params = new URLSearchParams(window.location.search);
  const keys = Array.from(params.keys());
  keys.forEach(k => params.delete(k));
  const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
  history.replaceState({}, '', newUrl);
}

test('filterAppsByQuery("") returns all apps', () => {
  const res = filterAppsByQuery('');
  expect(res.length).toBe(apps.length);
});

test('filterAppsByQuery basic name search finds Flappy Bird', () => {
  const res = filterAppsByQuery('flappy');
  const hasFlappy = res.some(a => a.id === 'flappy-bird' || /flappy bird/i.test(a.title));
  assert(hasFlappy, 'Expected result set to include Flappy Bird');
});

test('filterAppsByQuery developer:"Disney" narrows to Disney apps', () => {
  const res = filterAppsByQuery('developer:"Disney"');
  assert(res.length > 0, 'Expected some Disney apps');
  assert(res.every(a => /disney/i.test(a.developer)), 'All apps should have developer containing "Disney"');
  assert(res.some(a => /JellyCar/i.test(a.title)), 'Should include a JellyCar title');
});

test('filterAppsByQuery category:"Games" returns only Games', () => {
  const res = filterAppsByQuery('category:"Games"');
  assert(res.length > 0, 'Expected some Games apps');
  assert(res.every(a => Array.isArray(a.categories) && a.categories.some(c => /games?/i.test(c))), 'All apps must include Games category');
});

test('filterAppsByQuery combined: category:"Games" disney', () => {
  const res = filterAppsByQuery('category:"Games" disney');
  assert(res.length > 0, 'Expected some Disney games');
  assert(res.every(a => /disney/i.test(a.developer) && a.categories.includes('Games')), 'Each app should be a Disney game');
});

test('setUrlParam/getUrlParam add and remove params', () => {
  resetQuery();
  setUrlParam('query','flappy');
  expect(getUrlParam('query')).toBe('flappy');
  setUrlParam('page','2');
  expect(getUrlParam('page')).toBe('2');
  setUrlParam('page',''); // remove
  expect(getUrlParam('page')).toBe(null);
});

test('Search tab uses query=flappy from URL, page=1 clears the page param', () => {
  resetQuery();
  // Preload URL with query and page=1
  setUrlParam('query', 'flappy');
  setUrlParam('page', '1');
  expect(getUrlParam('page')).toBe('1');
  clickTab('search');

  // Input value should mirror query param
  const input = document.getElementById('searchInput');
  expect(input.value).toBe('flappy');

  // Page param should be cleared when page === 1
  expect(getUrlParam('page')).toBe(null);

  // Search results should be visible
  const sr = document.getElementById('searchResults');
  assert(sr.classList.contains('active'), 'searchResults should be active');
  assert(sr.children.length > 0, 'Expected some rendered search results');
});

test('Search tab respects page=2 and retains it', () => {
  resetQuery();
  setUrlParam('query','flappy');
  setUrlParam('page','2');
  clickTab('search');

  expect(getUrlParam('page')).toBe('2');

  // Pagination control current page should show 2
  const current = document.querySelector('.pagination-page.current');
  assert(current, 'Expected a current page element');
  expect(current.textContent.trim()).toBe('2');
});

test('Search tab falls back to input value when query param is absent', () => {
  resetQuery();
  const input = document.getElementById('searchInput');
  input.value = 'jelly';
  clickTab('search');
  // ensure results include JellyCar
  const names = Array.from(document.querySelectorAll('#searchResults .card-name')).map(n => n.textContent.toLowerCase());
  const hasJelly = names.some(n => n.includes('jellycar'));
  assert(hasJelly, 'Expected JellyCar item in rendered results');
});

test('Invalid page (e.g., -3) falls back to page 1 and clears page param', () => {
  resetQuery();
  setUrlParam('query','flappy');
  setUrlParam('page','-3');
  clickTab('search');
  // Should normalize to page 1 and clear the param
  expect(getUrlParam('page')).toBe(null);
  const current = document.querySelector('.pagination-page.current');
  assert(current, 'Expected a current page element');
  expect(current.textContent.trim()).toBe('1');
});

test('Clicking View Details opens modal and sets app param', () => {
  resetQuery();
  setUrlParam('query','flappy');
  clickTab('search');

  const button = document.querySelector('#searchResults .card-button');
  assert(button, 'Expected at least one View Details button in results');

  const appId = button.getAttribute('data-app-id');
  button.click();

  const activeModal = document.querySelector('.modal-overlay.active');
  assert(activeModal, 'Expected a modal to be active after clicking View Details');
  expect(getUrlParam('app')).toBe(appId);
});

test('Categories tab with category param calls renderAppsForCategory', () => {
  resetQuery();
  setUrlParam('category', 'Games');
  let calledWith = null;
  const original = window.renderAppsForCategory;
  window.renderAppsForCategory = function(cat){ calledWith = cat; return original.call(this, cat); };
  clickTab('categories');
  expect(calledWith).toBe('Games');
  // Clean up
  window.renderAppsForCategory = original;
});

test('Categories tab without category param calls renderCategoryList', () => {
  resetQuery();
  let called = false;
  const original = window.renderCategoryList;
  window.renderCategoryList = function(){ called = true; return original.call(this); };
  clickTab('categories');
  assert(called, 'Expected renderCategoryList to be invoked');
  // Clean up
  window.renderCategoryList = original;
});