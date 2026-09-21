/**
 * Shared chord-diagram component — draws a standard vertical guitar chord
 * box (like the charts on JustinGuitar/Ultimate Guitar), as an inline SVG.
 *
 * Orientation: strings run left(6th/low E) -> right(1st/high e), nut at top,
 * frets going down. This is the universal convention for chord charts —
 * distinct from the "1-6 弦 as table rows" convention used for markdown
 * fretboard-map TABLES elsewhere in this project (see ../CLAUDE.md); the two
 * don't need to match because they're different media (diagram vs. table).
 *
 * Usage:
 *   <div class="chord-diagram" id="chord-E"></div>
 *   <script src="../assets/chord-diagram.js"></script>
 *   <script>
 *     renderChordDiagram(document.getElementById('chord-E'), {
 *       name: 'E',
 *       baseFret: 1,                     // fret number of the top line (1 = nut)
 *       frets:  [0, 2, 2, 1, 0, 0],       // low E -> high e; 'x' = muted
 *       fingers:[null,2,3,1,null,null],   // optional finger numbers, same order
 *       barre: null                      // or {fret: 1, from: 0, to: 5, finger: 1}
 *     });
 *   </script>
 */
function renderChordDiagram(container, spec) {
  var frets = spec.frets;
  var fingers = spec.fingers || [null, null, null, null, null, null];
  var baseFret = spec.baseFret || 1;
  var numFretRows = spec.fretRows || 4;

  var W = 160, H = 190;
  var left = 24, right = 140;
  var stringX = [];
  for (var s = 0; s < 6; s++) stringX.push(left + (right - left) * s / 5);

  var nutY = 34;
  var fretSpacing = 30;
  var lastFretY = nutY + numFretRows * fretSpacing;

  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:180px" xmlns="http://www.w3.org/2000/svg" font-family="Helvetica Neue, Arial, sans-serif">';

  if (spec.name) {
    svg += '<text x="' + (W / 2) + '" y="16" text-anchor="middle" font-size="15" font-weight="700" fill="var(--ink, #2b2723)">' + spec.name + '</text>';
  }

  // open/mute markers above the nut
  for (var i = 0; i < 6; i++) {
    var val = frets[i];
    var label = val === 'x' || val === 'X' ? '×' : (val === 0 ? 'O' : '');
    if (label) {
      svg += '<text x="' + stringX[i] + '" y="' + (nutY - 8) + '" text-anchor="middle" font-size="12" fill="#5c564d">' + label + '</text>';
    }
  }

  // string lines
  for (var i2 = 0; i2 < 6; i2++) {
    svg += '<line x1="' + stringX[i2] + '" y1="' + nutY + '" x2="' + stringX[i2] + '" y2="' + lastFretY + '" stroke="#2b2723" stroke-width="1.3"/>';
  }

  // fret lines (top line thick = nut, only when baseFret is 1)
  for (var f = 0; f <= numFretRows; f++) {
    var y = nutY + f * fretSpacing;
    var isNut = (f === 0 && baseFret === 1);
    svg += '<line x1="' + stringX[0] + '" y1="' + y + '" x2="' + stringX[5] + '" y2="' + y + '" stroke="#2b2723" stroke-width="' + (isNut ? 4 : 1.1) + '"/>';
  }

  // base-fret label when not starting at the nut
  if (baseFret > 1) {
    svg += '<text x="' + (stringX[0] - 14) + '" y="' + (nutY + fretSpacing / 2 + 4) + '" text-anchor="end" font-size="12" fill="#5c564d">' + baseFret + 'fr</text>';
  }

  // barre
  if (spec.barre) {
    var b = spec.barre;
    var by = nutY + (b.fret - 0.5) * fretSpacing;
    svg += '<line x1="' + stringX[b.from] + '" y1="' + by + '" x2="' + stringX[b.to] + '" y2="' + by + '" stroke="var(--accent, #8a5a3b)" stroke-width="12" stroke-linecap="round" opacity="0.85"/>';
  }

  // finger dots
  for (var i3 = 0; i3 < 6; i3++) {
    var v = frets[i3];
    if (v === 'x' || v === 0 || v == null) continue;
    var relFret = v - baseFret + 1; // 1-indexed row within the visible window
    if (relFret < 1 || relFret > numFretRows) continue;
    var cy = nutY + (relFret - 0.5) * fretSpacing;
    svg += '<circle cx="' + stringX[i3] + '" cy="' + cy + '" r="9" fill="var(--accent, #8a5a3b)"/>';
    if (fingers[i3]) {
      svg += '<text x="' + stringX[i3] + '" y="' + (cy + 4) + '" text-anchor="middle" font-size="11" fill="#faf6ee" font-weight="700">' + fingers[i3] + '</text>';
    }
  }

  svg += '</svg>';
  container.innerHTML = svg;
  container.classList.add('chord-diagram');
}
