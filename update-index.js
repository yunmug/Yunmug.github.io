// Run after adding new entries to articles/manifest.json
// Usage: node update-index.js

var fs = require('fs');
var path = require('path');

var manifest = JSON.parse(fs.readFileSync('articles/manifest.json', 'utf8'));
var html = fs.readFileSync('index.html', 'utf8');

var sorted = manifest.slice().sort(function (a, b) {
  return new Date(b.date) - new Date(a.date);
});

// Find renderedCount in index.html
var countMatch = html.match(/var renderedCount = (\d+);/);
if (!countMatch) {
  console.error('ERROR: var renderedCount not found in index.html');
  process.exit(1);
}
var renderedCount = parseInt(countMatch[0].match(/\d+/)[0], 10);

if (sorted.length <= renderedCount) {
  console.log('No new articles. renderedCount=' + renderedCount + ', manifest has ' + sorted.length);
  process.exit(0);
}

var newArticles = sorted.slice(renderedCount);
console.log('Adding ' + newArticles.length + ' new card(s)...');

// Build card HTML for new articles
var cardsHtml = newArticles.map(function (a) {
  return [
    '      <a class="card" href="' + a.path + '">',
    '        <time>' + a.date + '</time>',
    '        <h3>' + a.title + '</h3>',
    '        <p>' + a.excerpt + '</p>',
    a.tag ? '        <span class="tag">' + a.tag + '</span>' : '',
    '      </a>'
  ].filter(Boolean).join('\n');
}).join('\n');

// Insert cards before <!-- cards end -->, with a leading newline for separation
html = html.replace('<!-- cards end -->', '\n' + cardsHtml + '\n      <!-- cards end -->');

// Remove empty-state if this is the first bake (renderedCount was 0)
if (renderedCount === 0) {
  html = html.replace(
    /      <div class="empty-state">\s*<div class="icon">.*?<\/div>\s*<p>.*?<\/p>\s*<\/div>/,
    ''
  );
}

// Update renderedCount
html = html.replace(/var renderedCount = \d+;/, 'var renderedCount = ' + sorted.length + ';');

fs.writeFileSync('index.html', html);
console.log('Done. renderedCount updated from ' + renderedCount + ' to ' + sorted.length);
