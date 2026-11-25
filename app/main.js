// Router and control wiring for Japan in Numbers.
//
//   #/                overview
//   #/population      population (range buttons: 5y / 10y / since 2000)
//   #/economy         economy (GDP toggle: total / per person)
//   #/work            work
//   #/prices          prices
//   #/society         society
//   #/regions         regions (search + sortable prefecture table)
//   #/indicators      A–Z indicator index (search)
//   #/about           about
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import {
  pageAbout,
  pageEconomy,
  pageIndicators,
  pageMissing,
  pageOverview,
  pagePopulation,
  pagePrices,
  pageRegions,
  pageSociety,
  pageWork,
  siteNav,
} from './views.js';

const app = document.getElementById('app');
const navSlot = document.getElementById('nav');
const titleSlot = document.querySelector('title');

// Per-page control state, kept while the visitor stays on the page.
const state = {
  population: { range: '10y' },
  economy: { gdpMode: 'total' },
  regions: { query: '', sortKey: 'population', sortDir: 'desc' },
  indicators: { query: '' },
};

const TITLES = {
  '#/': 'Japan in Numbers — Japan, measured',
  '#/population': 'Population | Japan in Numbers',
  '#/economy': 'Economy | Japan in Numbers',
  '#/work': 'Work | Japan in Numbers',
  '#/prices': 'Prices | Japan in Numbers',
  '#/society': 'Society | Japan in Numbers',
  '#/regions': 'Regions | Japan in Numbers',
  '#/indicators': 'Indicators A–Z | Japan in Numbers',
  '#/about': 'About | Japan in Numbers',
};

function currentRoute() {
  const hash = location.hash || '#/';
  return TITLES[hash] ? hash : '#/missing';
}

function render() {
  window.__shotReady = false;
  const route = currentRoute();
  navSlot.innerHTML = siteNav(route);
  titleSlot.textContent = TITLES[route] || 'Japan in Numbers';
  if (route === '#/') app.innerHTML = pageOverview();
  else if (route === '#/population') app.innerHTML = pagePopulation(state.population);
  else if (route === '#/economy') app.innerHTML = pageEconomy(state.economy);
  else if (route === '#/work') app.innerHTML = pageWork();
  else if (route === '#/prices') app.innerHTML = pagePrices();
  else if (route === '#/society') app.innerHTML = pageSociety();
  else if (route === '#/regions') app.innerHTML = pageRegions(state.regions);
  else if (route === '#/indicators') app.innerHTML = pageIndicators(state.indicators);
  else if (route === '#/about') app.innerHTML = pageAbout();
  else app.innerHTML = pageMissing();
  wire(route);
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

function wire(route) {
  // Population range buttons re-render the chart for the chosen span.
  app.querySelectorAll('[data-range]').forEach((button) => {
    button.addEventListener('click', () => {
      state.population.range = button.getAttribute('data-range');
      render();
    });
  });
  // Economy GDP measure toggle re-renders the GDP chart.
  app.querySelectorAll('[data-gdp]').forEach((button) => {
    button.addEventListener('click', () => {
      state.economy.gdpMode = button.getAttribute('data-gdp');
      render();
    });
  });
  // Regions: sort by clicking a column heading; a second click flips direction.
  app.querySelectorAll('[data-sort]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.getAttribute('data-sort');
      if (state.regions.sortKey === key) {
        state.regions.sortDir = state.regions.sortDir === 'desc' ? 'asc' : 'desc';
      } else {
        state.regions.sortKey = key;
        state.regions.sortDir = key === 'name' ? 'asc' : 'desc';
      }
      render();
    });
  });
  // Regions + indicators: live search filters the table as you type.
  const prefSearch = document.getElementById('pref-search');
  if (prefSearch) {
    prefSearch.addEventListener('input', () => {
      state.regions.query = prefSearch.value;
      const caret = prefSearch.selectionStart;
      render();
      const again = document.getElementById('pref-search');
      if (again) {
        again.focus();
        again.setSelectionRange(caret, caret);
      }
    });
  }
  const indSearch = document.getElementById('ind-search');
  if (indSearch) {
    indSearch.addEventListener('input', () => {
      state.indicators.query = indSearch.value;
      const caret = indSearch.selectionStart;
      render();
      const again = document.getElementById('ind-search');
      if (again) {
        again.focus();
        again.setSelectionRange(caret, caret);
      }
    });
  }
}

window.addEventListener('hashchange', render);
render();
