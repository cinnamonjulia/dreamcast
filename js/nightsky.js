/* ============================================================
   DREAMCAST — real night sky
   The actual constellations over San Francisco at 11:11 PM on
   whatever day you open the page. Bright-star catalog (J2000),
   spherical trig, no libraries.
   1. Fills the #sky-bg backdrop (#constellations SVG).
   2. Powers The Sky: a full-screen view where every star and
      constellation can be hovered by name.
   Panorama: facing south — east on the left, west on the right.
   ============================================================ */
(function () {
  'use strict';

  var LAT = 37.7749, LON = -122.4194;      // San Francisco
  var W = 1440, H = 900;
  var NS = 'http://www.w3.org/2000/svg';

  var CONS=[{"n":"Ursa Major","s":[["Dubhe",11.062,61.75,1.8],["Merak",11.031,56.38,2.4],["Phecda",11.897,53.69,2.4],["Megrez",12.257,57.03,3.3],["Alioth",12.9,55.96,1.8],["Mizar",13.399,54.93,2.2],["Alkaid",13.792,49.31,1.9]],"l":[[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]]},{"n":"Ursa Minor","s":[["Polaris",2.53,89.264,2.0],["Yildun",17.537,86.58,4.4],["Epsilon Ursae Minoris",16.766,82.03,4.2],["Zeta Ursae Minoris",15.735,77.79,4.3],["Eta Ursae Minoris",16.291,75.75,5.0],["Kochab",14.845,74.16,2.1],["Pherkad",15.345,71.83,3.0]],"l":[[0,1],[1,2],[2,3],[3,5],[5,6],[6,4],[4,3]]},{"n":"Cassiopeia","s":[["Caph",0.153,59.15,2.3],["Schedar",0.675,56.54,2.2],["Gamma Cassiopeiae",0.945,60.72,2.4],["Ruchbah",1.43,60.24,2.7],["Segin",1.906,63.67,3.4]],"l":[[0,1],[1,2],[2,3],[3,4]]},{"n":"Cepheus","s":[["Alderamin",21.31,62.59,2.5],["Alfirk",21.478,70.56,3.2],["Errai",23.655,77.63,3.2],["Zeta Cephei",22.181,58.2,3.4],["Iota Cephei",22.828,66.2,3.5]],"l":[[0,1],[1,2],[2,4],[4,3],[3,0],[1,4]]},{"n":"Draco","s":[["Eltanin",17.943,51.49,2.2],["Rastaban",17.507,52.3,2.8],["Nu Draconis",17.533,55.18,4.9],["Xi Draconis",17.892,56.87,3.7],["Delta Draconis",19.21,67.66,3.1],["Zeta Draconis",17.147,65.71,3.2],["Eta Draconis",16.4,61.51,2.7],["Theta Draconis",16.031,58.56,4.0],["Iota Draconis",15.415,58.97,3.3],["Thuban",14.073,64.37,3.7],["Kappa Draconis",12.558,69.79,3.9],["Lambda Draconis",11.523,69.33,3.8]],"l":[[11,10],[10,9],[9,8],[8,7],[7,6],[6,5],[5,4],[4,3],[3,2],[2,1],[1,0],[0,3]]},{"n":"Lyra","s":[["Vega",18.616,38.78,0.0],["Epsilon Lyrae",18.739,39.67,4.6],["Zeta Lyrae",18.746,37.6,4.3],["Sheliak",18.835,33.36,3.5],["Sulafat",18.982,32.69,3.2],["Delta Lyrae",18.908,36.9,4.3]],"l":[[0,1],[0,2],[2,3],[3,4],[4,5],[5,2]]},{"n":"Cygnus","s":[["Deneb",20.69,45.28,1.3],["Sadr",20.371,40.26,2.2],["Gienah",20.771,33.97,2.5],["Delta Cygni",19.749,45.13,2.9],["Albireo",19.512,27.96,3.1],["Iota Cygni",19.496,51.73,3.8],["Kappa Cygni",19.285,53.37,3.8]],"l":[[0,1],[1,4],[1,2],[1,3],[3,5],[5,6]]},{"n":"Aquila","s":[["Altair",19.846,8.87,0.8],["Tarazed",19.771,10.61,2.7],["Alshain",19.922,6.41,3.7],["Zeta Aquilae",19.09,13.86,3.0],["Delta Aquilae",19.425,3.11,3.4],["Theta Aquilae",20.188,-0.82,3.2],["Lambda Aquilae",19.103,-4.88,3.4],["Eta Aquilae",19.874,1.01,3.9]],"l":[[3,1],[1,0],[0,2],[0,4],[4,6],[4,7],[7,5]]},{"n":"Delphinus","s":[["Sualocin",20.661,15.91,3.8],["Rotanev",20.626,14.6,3.6],["Gamma Delphini",20.777,16.12,4.3],["Delta Delphini",20.724,15.07,4.4],["Epsilon Delphini",20.553,11.3,4.0]],"l":[[0,2],[2,3],[3,1],[1,0],[1,4]]},{"n":"Sagitta","s":[["Gamma Sagittae",19.979,19.49,3.5],["Delta Sagittae",19.789,18.53,3.8],["Alpha Sagittae",19.668,18.01,4.4],["Beta Sagittae",19.684,17.48,4.4]],"l":[[0,1],[1,2],[1,3]]},{"n":"Hercules","s":[["Epsilon Herculis",17.005,30.93,3.9],["Zeta Herculis",16.688,31.6,2.8],["Eta Herculis",16.715,38.92,3.5],["Pi Herculis",17.251,36.81,3.2],["Kornephoros",16.504,21.49,2.8],["Delta Herculis",17.251,24.84,3.1],["Rasalgethi",17.244,14.39,3.1],["Theta Herculis",17.938,37.25,3.9],["Iota Herculis",17.657,46.01,3.8]],"l":[[2,1],[1,0],[0,3],[3,2],[1,4],[0,5],[5,6],[3,7],[7,8]]},{"n":"Corona Borealis","s":[["Alphecca",15.578,26.71,2.2],["Beta Coronae Borealis",15.464,29.11,3.7],["Gamma Coronae Borealis",15.713,26.3,3.8],["Delta Coronae Borealis",15.826,26.07,4.6],["Epsilon Coronae Borealis",15.959,26.88,4.1],["Theta Coronae Borealis",15.549,31.36,4.1]],"l":[[5,1],[1,0],[0,2],[2,3],[3,4]]},{"n":"Boötes","s":[["Arcturus",14.261,19.18,-0.05],["Izar",14.749,27.07,2.4],["Gamma Boötis",14.535,38.31,3.0],["Delta Boötis",15.258,33.31,3.5],["Beta Boötis",15.032,40.39,3.5],["Rho Boötis",14.53,30.37,3.6],["Muphrid",13.911,18.4,2.7],["Zeta Boötis",14.686,13.73,3.8]],"l":[[0,1],[1,3],[3,4],[4,2],[2,5],[5,0],[0,6],[0,7]]},{"n":"Scorpius","s":[["Antares",16.49,-26.43,1.0],["Graffias",16.091,-19.81,2.6],["Dschubba",16.006,-22.62,2.3],["Pi Scorpii",15.981,-26.11,2.9],["Sigma Scorpii",16.353,-25.59,2.9],["Tau Scorpii",16.598,-28.21,2.8],["Epsilon Scorpii",16.836,-34.29,2.3],["Mu Scorpii",16.864,-38.05,3.0],["Zeta Scorpii",16.909,-42.36,3.6],["Eta Scorpii",17.202,-43.24,3.3],["Sargas",17.622,-43.0,1.9],["Iota Scorpii",17.793,-40.13,3.0],["Kappa Scorpii",17.708,-39.03,2.4],["Shaula",17.56,-37.1,1.6],["Lesath",17.513,-37.3,2.7]],"l":[[1,2],[2,3],[2,4],[4,0],[0,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14]]},{"n":"Sagittarius","s":[["Kaus Australis",18.403,-34.38,1.8],["Kaus Media",18.35,-29.83,2.7],["Kaus Borealis",18.466,-25.42,2.8],["Phi Sagittarii",18.762,-26.99,3.2],["Nunki",18.921,-26.3,2.0],["Tau Sagittarii",19.117,-27.67,3.3],["Ascella",19.043,-29.88,2.6],["Alnasl",18.096,-30.42,3.0]],"l":[[7,1],[1,0],[0,6],[6,3],[3,2],[2,1],[3,4],[4,5],[5,6]]},{"n":"Ophiuchus","s":[["Rasalhague",17.582,12.56,2.1],["Cebalrai",17.724,4.57,2.8],["Kappa Ophiuchi",16.961,9.38,3.2],["Yed Prior",16.239,-3.69,2.7],["Yed Posterior",16.305,-4.69,3.2],["Zeta Ophiuchi",16.619,-10.57,2.6],["Sabik",17.173,-15.72,2.4],["Nu Ophiuchi",17.983,-9.77,3.3]],"l":[[0,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,1],[1,0]]},{"n":"Serpens","s":[["Unukalhai",15.738,6.43,2.6],["Beta Serpentis",15.769,15.42,3.7],["Delta Serpentis",15.58,10.54,3.8]],"l":[[1,2],[2,0]]},{"n":"Libra","s":[["Zubenelgenubi",14.848,-16.04,2.8],["Zubeneschamali",15.283,-9.38,2.6],["Gamma Librae",15.592,-14.79,3.9],["Sigma Librae",15.068,-25.28,3.3]],"l":[[0,1],[1,2],[2,0],[0,3]]},{"n":"Capricornus","s":[["Algedi",20.301,-12.54,3.6],["Dabih",20.35,-14.78,3.1],["Theta Capricorni",21.098,-17.23,4.1],["Deneb Algedi",21.784,-16.13,2.9],["Nashira",21.668,-16.66,3.7],["Zeta Capricorni",21.444,-22.41,3.7],["Omega Capricorni",20.864,-26.92,4.1],["Psi Capricorni",20.768,-25.27,4.1]],"l":[[0,1],[1,7],[7,6],[6,5],[5,4],[4,3],[3,2],[2,0]]},{"n":"Pegasus","s":[["Enif",21.736,9.88,2.4],["Theta Pegasi",22.17,6.2,3.5],["Homam",22.691,10.83,3.4],["Markab",23.079,15.21,2.5],["Scheat",23.063,28.08,2.4],["Algenib",0.221,15.18,2.8],["Alpheratz",0.14,29.09,2.1,1]],"l":[[3,4],[4,6],[6,5],[5,3],[3,2],[2,1],[1,0]]},{"n":"Andromeda","s":[["Alpheratz",0.14,29.09,2.1],["Delta Andromedae",0.656,30.86,3.3],["Mirach",1.162,35.62,2.1],["Almach",2.065,42.33,2.3]],"l":[[0,1],[1,2],[2,3]]},{"n":"Perseus","s":[["Mirfak",3.405,49.86,1.8],["Algol",3.136,40.96,2.1],["Gamma Persei",3.08,53.51,2.9],["Delta Persei",3.715,47.79,3.0],["Epsilon Persei",3.964,40.01,2.9]],"l":[[0,1],[2,0],[0,3],[3,4],[4,1]]},{"n":"Aquarius","s":[["Sadalmelik",22.096,-0.32,3.0],["Sadalsuud",21.526,-5.57,2.9]],"l":[[0,1]]},{"n":"Virgo","s":[["Spica",13.42,-11.16,1.0],["Porrima",12.694,-1.45,2.7],["Vindemiatrix",13.036,10.96,2.8],["Delta Virginis",12.927,3.4,3.4],["Beta Virginis",11.845,1.76,3.6],["Eta Virginis",12.332,-0.67,3.9]],"l":[[4,5],[5,1],[1,3],[3,2],[1,0]]},{"n":"Auriga","s":[["Capella",5.278,46.0,0.1],["Menkalinan",6.0,44.95,1.9],["Theta Aurigae",5.995,37.21,2.6],["Iota Aurigae",4.95,33.17,2.7],["Epsilon Aurigae",5.033,43.82,3.0],["Elnath",5.438,28.61,1.7,1]],"l":[[0,1],[1,2],[2,5],[5,3],[3,4],[4,0]]},{"n":"Piscis Austrinus","s":[["Fomalhaut",22.961,-29.62,1.2]],"l":[]},{"n":"Orion","s":[["Betelgeuse",5.919,7.41,0.5],["Rigel",5.242,-8.2,0.1],["Bellatrix",5.418,6.35,1.6],["Saiph",5.796,-9.67,2.1],["Alnitak",5.679,-1.94,1.7],["Alnilam",5.604,-1.2,1.7],["Mintaka",5.533,-0.3,2.2],["Meissa",5.585,9.93,3.4]],"l":[[0,2],[2,6],[6,5],[5,4],[4,3],[3,1],[1,6],[4,0],[0,7],[7,2]]},{"n":"Taurus","s":[["Aldebaran",4.599,16.51,0.9],["Elnath",5.438,28.61,1.7],["Zeta Tauri",5.628,21.14,3.0],["Gamma Tauri",4.33,15.63,3.6],["Ain",4.477,19.18,3.5],["Theta² Tauri",4.478,15.87,3.4],["Lambda Tauri",4.011,12.49,3.5],["Alcyone",3.791,24.11,2.9]],"l":[[6,3],[3,4],[4,1],[3,5],[5,0],[0,2]]},{"n":"Gemini","s":[["Pollux",7.755,28.03,1.1],["Castor",7.577,31.89,1.6],["Alhena",6.629,16.4,1.9],["Mu Geminorum",6.383,22.51,2.9],["Epsilon Geminorum",6.732,25.13,3.0],["Eta Geminorum",6.248,22.5,3.3],["Wasat",7.335,21.98,3.5]],"l":[[1,4],[4,3],[3,5],[0,6],[6,2]]},{"n":"Canis Major","s":[["Sirius",6.752,-16.72,-1.46],["Mirzam",6.378,-17.96,2.0],["Adhara",6.977,-28.97,1.5],["Wezen",7.14,-26.39,1.8],["Aludra",7.401,-29.3,2.4]],"l":[[1,0],[0,3],[3,2],[3,4]]},{"n":"Canis Minor","s":[["Procyon",7.655,5.22,0.3],["Gomeisa",7.453,8.29,2.9]],"l":[[0,1]]},{"n":"Leo","s":[["Regulus",10.14,11.97,1.4],["Eta Leonis",10.122,16.76,3.5],["Algieba",10.333,19.84,2.6],["Zeta Leonis",10.278,23.42,3.4],["Mu Leonis",9.879,26.01,3.9],["Epsilon Leonis",9.764,23.77,3.0],["Denebola",11.818,14.57,2.1],["Zosma",11.235,20.52,2.6],["Theta Leonis",11.237,15.43,3.3]],"l":[[0,1],[1,2],[2,3],[3,4],[4,5],[6,7],[7,8],[8,6],[8,0],[2,7]]},{"n":"Corvus","s":[["Gienah",12.263,-17.54,2.6],["Epsilon Corvi",12.169,-22.62,3.0],["Algorab",12.498,-16.52,2.9],["Beta Corvi",12.573,-23.4,2.6]],"l":[[0,2],[2,3],[3,1],[1,0]]},{"n":"Hydra","s":[["Alphard",9.46,-8.66,2.0],["Zeta Hydrae",8.923,5.95,3.1],["Epsilon Hydrae",8.78,6.42,3.4],["Delta Hydrae",8.628,5.7,4.1]],"l":[[3,2],[2,1],[1,0]]},{"n":"Aries","s":[["Hamal",2.12,23.46,2.0],["Sheratan",1.911,20.81,2.6],["Mesarthim",1.884,19.29,3.9]],"l":[[0,1],[1,2]]},{"n":"Lepus","s":[["Arneb",5.545,-17.82,2.6],["Nihal",5.471,-20.76,2.8]],"l":[[0,1]]},{"n":"Eridanus","s":[["Cursa",5.131,-5.09,2.8]],"l":[]},{"n":"Cetus","s":[["Diphda",0.726,-17.99,2.0],["Menkar",3.038,4.09,2.5]],"l":[]},{"n":"Canes Venatici","s":[["Cor Caroli",12.934,38.32,2.9]],"l":[]}];
  // tonight at 11:11 PM (viewer's clock, Dreamcast's home sky)
  var now = new Date();
  var t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 11, 0);
  var JD = t.getTime() / 86400000 + 2440587.5;
  var d = JD - 2451545.0;
  var GMST = ((280.46061837 + 360.98564736629 * d) % 360 + 360) % 360;
  var LST = ((GMST + LON) % 360 + 360) % 360;

  var D2R = Math.PI / 180;

  function altaz(raH, dec) {
    var ha = (((LST - raH * 15) % 360 + 360) % 360) * D2R;
    var la = LAT * D2R, de = dec * D2R;
    var sAlt = Math.sin(la) * Math.sin(de) + Math.cos(la) * Math.cos(de) * Math.cos(ha);
    sAlt = Math.max(-1, Math.min(1, sAlt));
    var alt = Math.asin(sAlt) / D2R;
    var azS = Math.atan2(Math.sin(ha),
      Math.cos(ha) * Math.sin(la) - Math.tan(de) * Math.cos(la)) / D2R;
    return [alt, ((azS + 180) % 360 + 360) % 360];
  }

  function makeProject(yTop, yHor) {
    return function (alt, az) {
      return [(((az - 180) / 360) + 0.5) * W,
              yTop + (90 - alt) / 90 * (yHor - yTop)];
    };
  }

  function rFor(m) { return m <= 0.2 ? 3.4 : m <= 1.2 ? 2.8 : m <= 2.2 ? 2.2 : m <= 3.2 ? 1.6 : m <= 4.2 ? 1.2 : 0.9; }
  function oFor(m) { return m <= 0.2 ? .98 : m <= 1.2 ? .95 : m <= 2.2 ? .88 : m <= 3.2 ? .72 : m <= 4.2 ? .55 : .45; }

  function computePositions(project) {
    return CONS.map(function (con) {
      return con.s.map(function (s) {
        var aa = altaz(s[1], s[2]);
        var xy = project(aa[0], aa[1]);
        return { name: s[0], alt: aa[0], x: xy[0], y: xy[1], mag: s[3], anchor: !!s[4] };
      });
    });
  }

  function segsFor(a, b) {
    var x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y;
    if (Math.abs(x1 - x2) > W / 2) {          // heal the panorama seam
      if (x1 < x2) x1 += W; else x2 += W;
      return [[x1, y1, x2, y2], [x1 - W, y1, x2 - W, y2]];
    }
    return [[x1, y1, x2, y2]];
  }

  function pathD(con, pts) {
    var parts = [];
    con.l.forEach(function (ln) {
      var a = pts[ln[0]], b = pts[ln[1]];
      if (a.alt < -3 && b.alt < -3) return;
      segsFor(a, b).forEach(function (s) {
        parts.push('M' + s[0].toFixed(0) + ' ' + s[1].toFixed(0) +
                   'L' + s[2].toFixed(0) + ' ' + s[3].toFixed(0));
      });
    });
    return parts.join(' ');
  }

  function starDots(p) {
    var dots = [[p.x, p.y]];
    if (p.x < 60) dots.push([p.x + W, p.y]);
    if (p.x > W - 60) dots.push([p.x - W, p.y]);
    return dots;
  }

  /* ---------------- backdrop: flat, non-interactive ---------------- */

  function drawBackdrop() {
    var svg = document.getElementById('constellations');
    if (!svg) return;
    var project = makeProject(22, 660);
    var all = computePositions(project);
    var dParts = [];
    CONS.forEach(function (con, ci) {
      var dd = pathD(con, all[ci]);
      if (dd) dParts.push(dd);
    });
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('class', 'cline');
    path.setAttribute('d', dParts.join(' '));
    svg.appendChild(path);

    var tw = 0;
    all.forEach(function (pts) {
      pts.forEach(function (p) {
        if (p.anchor || p.alt < -1) return;
        var twinkles = p.mag <= 2.2;
        if (twinkles) tw++;
        starDots(p).forEach(function (xy) {
          var c = document.createElementNS(NS, 'circle');
          c.setAttribute('class', twinkles ? 'st tw' : 'st');
          c.setAttribute('cx', xy[0].toFixed(0));
          c.setAttribute('cy', xy[1].toFixed(0));
          c.setAttribute('r', rFor(p.mag));
          c.setAttribute('fill-opacity', oFor(p.mag));
          if (twinkles) c.style.animationDelay = '-' + ((tw * 0.73) % 4).toFixed(2) + 's';
          svg.appendChild(c);
        });
      });
    });
  }

  /* ---------------- The Sky: interactive overlay ---------------- */

  var built = false;

  function buildOverlay() {
    if (built) return;
    built = true;
    var svg = document.getElementById('skyview-svg');
    var tip = document.getElementById('skyview-tip');
    if (!svg || !tip) return;
    var project = makeProject(46, 866);
    var all = computePositions(project);

    function showTip(html, ev) {
      tip.innerHTML = html;
      tip.hidden = false;
      moveTip(ev);
    }
    function moveTip(ev) {
      var pad = 14;
      var x = ev.clientX + pad, y = ev.clientY + pad;
      if (x + tip.offsetWidth > window.innerWidth - 8) x = ev.clientX - tip.offsetWidth - pad;
      if (y + tip.offsetHeight > window.innerHeight - 8) y = ev.clientY - tip.offsetHeight - pad;
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
    }

    CONS.forEach(function (con, ci) {
      var pts = all[ci];
      if (!pts.some(function (p) { return p.alt > -1; })) return;
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'cgrp');

      var dd = pathD(con, pts);
      if (dd) {
        var hitPath = document.createElementNS(NS, 'path');
        hitPath.setAttribute('class', 'chit');
        hitPath.setAttribute('d', dd);
        g.appendChild(hitPath);
        var path = document.createElementNS(NS, 'path');
        path.setAttribute('class', 'cline2');
        path.setAttribute('d', dd);
        g.appendChild(path);
      }

      var vis = pts.filter(function (p) { return !p.anchor && p.alt >= -1; });
      vis.forEach(function (p) {
        starDots(p).forEach(function (xy) {
          var c = document.createElementNS(NS, 'circle');
          c.setAttribute('class', 'st');
          c.setAttribute('cx', xy[0].toFixed(1));
          c.setAttribute('cy', xy[1].toFixed(1));
          c.setAttribute('r', rFor(p.mag) * 1.5);
          c.setAttribute('fill-opacity', oFor(p.mag));
          g.appendChild(c);
        });
      });
      // hit circles: faintest first, so famous bright stars win overlaps
      vis.slice().sort(function (a, b) { return b.mag - a.mag; }).forEach(function (p) {
        starDots(p).forEach(function (xy) {
          var hit = document.createElementNS(NS, 'circle');
          hit.setAttribute('class', 'hit');
          hit.setAttribute('cx', xy[0].toFixed(1));
          hit.setAttribute('cy', xy[1].toFixed(1));
          hit.setAttribute('r', p.mag <= 1.2 ? 14 : 10);
          hit.setAttribute('data-star', p.name);
          g.appendChild(hit);
        });
      });

      g.addEventListener('mouseenter', function () { g.classList.add('hot'); });
      g.addEventListener('mouseleave', function () { g.classList.remove('hot'); tip.hidden = true; });
      g.addEventListener('mousemove', function (ev) {
        var star = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-star');
        if (star) {
          showTip(star + '<span class="tip-sub">' + con.n + '</span>', ev);
        } else {
          showTip(con.n, ev);
        }
      });
      svg.appendChild(g);
    });
  }

  function openSky() {
    buildOverlay();
    var v = document.getElementById('skyview');
    if (v) v.hidden = false;
  }
  function closeSky() {
    var v = document.getElementById('skyview');
    if (v) v.hidden = true;
    var tip = document.getElementById('skyview-tip');
    if (tip) tip.hidden = true;
  }

  function init() {
    drawBackdrop();
    var open = document.getElementById('sky-dock');
    var close = document.getElementById('skyview-close');
    if (open) open.addEventListener('click', openSky);
    if (close) close.addEventListener('click', closeSky);
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeSky();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
