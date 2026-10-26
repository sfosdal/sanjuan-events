// The city — every fact that makes this calendar San Juan's rather than
// another town's, in one place (2026-10-14: a sister of lqa-events, built the
// way Cancún was — the second city read from a ticketer rather than
// Ticketmaster). The browser (filter.js, app.js) and the build (scripts/*.mjs)
// both read it; nothing else names a venue or a team. The shared files
// (app.js, filter.js, styles.css bar its --v-* hues, scripts/*.mjs bar
// fetch-events.mjs and sources.mjs) are lqa-events' own, byte for byte — see
// README "Sister sites".
//
// San Juan: pop. 340,000 in the city, two million in the metro, the capital
// of Puerto Rico. Its ticketed rooms are the Coliseo de Puerto Rico ("El
// Choli", the island's arena, in Hato Rey), the Coca-Cola Music Hall in the
// Distrito T-Mobile beside the Convention Center, the Centro de Bellas Artes
// Luis A. Ferré in Santurce, the Convention Center itself, Vivo Beach Club on
// the Isla Verde shore in Carolina, the Hotel Rumbao's ballroom, and the two
// grounds — the Estadio Hiram Bithorn (winter-league baseball) and the
// Coliseo Roberto Clemente (BSN basketball). Ticketmaster carries almost
// nothing here (one bowl game a year): the ticketer is Ticketera, read room by
// room through scripts/feeds.mjs. Caguas, half an hour south, is the second
// group. Clocks are Atlantic Standard all year (no daylight time).
//
// Loaded before filter.js (a plain script, so the tests can share it): it
// sets globalThis.LQACity (the name is the shared code's, not the city's).
(function (global) {
  'use strict';

  // The home teams, matched on the event title whatever the venue. Order =
  // the Teams strip, left to right. Per team:
  //   re        the title match
  //   venue     the home building, as VENUES spells it; schedule = the club's
  //             own schedule page
  //   sport     keys the strip icon (app.js SPORT_ICONS), the game clock,
  //             the leader categories
  //   colors    [primary, accent] — the season calendar's home cells and
  //             card frames
  //   season    where the season comes from (schedules.mjs): MLB's stats API
  //             serves the Liga de Béisbol Profesional Roberto Clemente
  //             (sportId 17, league 133) as it does the minors
  //   form      the record and standing: statsapi standings by league id
  //   inject    the club's home games enter the listing from the league's
  //             schedule (Ticketera lists the ballpark game by game only once
  //             the season is on; the de-dupe keeps the ticket listing when
  //             both are there), linking to the ticketer's sports page
  //   club      the club's full name; wiki the article; opens when the
  //             season usually starts
  // The season runs early November to late December, the playoffs into
  // January, the champion on to the Serie del Caribe in February. Both clubs
  // play at the Hiram Bithorn (the Cangrejeros since 2022, back from the
  // Clemente); the BSN's Cangrejeros (basketball, March to June at the
  // Clemente) share the name but publish no readable schedule yet.
  var TEAMS = [
    // Cangrejeros de Santurce — 2025-26 champions, on to the 2026 Serie del Caribe
    { slug: 'cangrejeros', label: 'Cangrejeros', name: 'Cangrejeros de Santurce', abbr: 'SAN', re: /\bcangrejeros\b/i, sport: 'baseball', venue: 'Estadio Hiram Bithorn', colors: ['#0b3d91', '#f5b400'],
      season: { kind: 'mlb', id: 685, sportId: 17 }, form: { kind: 'milb', id: 685, league: 133, leagueName: 'Liga Roberto Clemente' },
      inject: { url: 'https://www.ticketera.com/events/category/deportes' }, // game tickets sell on Ticketera's sports page as each series goes on sale
      logo: 'https://www.mlbstatic.com/team-logos/685.svg', schedule: 'https://ligapr.com/',
      club: 'Cangrejeros de Santurce', opens: 'November', wiki: { title: 'Cangrejeros de Santurce (baseball)', club: true } },
    // Senadores de San Juan — the capital's own club, revived 2023, also at the Bithorn
    { slug: 'senadores', label: 'Senadores', name: 'Senadores de San Juan', abbr: 'SJU', re: /\bsenadores\b/i, sport: 'baseball', venue: 'Estadio Hiram Bithorn', colors: ['#b3001b', '#1c1c1c'],
      season: { kind: 'mlb', id: 4087, sportId: 17 }, form: { kind: 'milb', id: 4087, league: 133, leagueName: 'Liga Roberto Clemente' },
      inject: { url: 'https://senadoresdesanjuan.com/' },
      logo: 'https://www.mlbstatic.com/team-logos/4087.svg', schedule: 'https://senadoresdesanjuan.com/',
      club: 'Senadores de San Juan', opens: 'November', wiki: { title: 'Senadores de San Juan', club: true } },
  ];

  // The venues. Keys are the display names the feeds are folded to. Per venue:
  //   area     'town' = Caguas, half an hour south (the panel's second
  //            group); unmarked = the San Juan metro — Hato Rey, Santurce,
  //            Miramar, Isla Verde alike
  //   capacity the Capacity rows' thresholds (the share-code 'cap' bits)
  //   type     the default event type when the feed names none
  //   cssVar   the hue in styles.css (light and dark values live there);
  //            color is the light one for the places that read it directly
  //   url      the room's own page (the sheet's venue link)
  //   icon     the favicon, through Google's cache
  //   alias    the spellings the ticketer uses for it, folded to this name
  //            ("CBA Santurce" is the Bellas Artes)
  // No `tm` blocks: Ticketmaster has one event a year on the island. The
  // listings come from the Ticketera FEEDS below (each room's own page) and
  // fold onto these rows by alias; a room with no row of its own lands in
  // 'Elsewhere in San Juan'.
  var VENUES = {
    'Coliseo de Puerto Rico': { // "El Choli", the island's arena in Hato Rey, 18,500 — every big tour, Miss Universe, Monster Jam
      geo: [18.42782, -66.06134],
      capacity: 18500,
      type: 'concert',
      cssVar: '--v-choli',
      color: '#2e5a9e',
      url: 'https://coliseodepuertorico.com/',
      icon: 'https://www.google.com/s2/favicons?domain=coliseodepuertorico.com&sz=128',
      alias: /coliseo de puerto rico|\bcholi\b/i,
    },
    'Coca-Cola Music Hall': { // the 5,000-capacity hall in the Distrito T-Mobile (2021) — the mid-size tours, comedy
      geo: [18.45543, -66.09275],
      capacity: 5000,
      type: 'concert',
      cssVar: '--v-ccmh',
      color: '#9e2e3e',
      url: 'https://www.cocacolamusichall.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.cocacolamusichall.com&sz=128',
      alias: /coca.?cola music hall/i,
    },
    'Centro de Bellas Artes': { // the Luis A. Ferré Performing Arts Center in Santurce — the 1,883-seat Sala de Festivales, the symphony, the plays; Ticketera calls it "CBA Santurce"
      geo: [18.44712, -66.06832],
      capacity: 1883,
      type: 'arts',
      cssVar: '--v-cba',
      color: '#6a2e9e',
      url: 'https://cba.pr.gov/',
      icon: 'https://www.google.com/s2/favicons?domain=cba.pr.gov&sz=128',
      alias: /cba santurce|centro de bellas artes(?! de caguas)|luis a\.? ferr/i,
    },
    'Puerto Rico Convention Center': { // the Caribbean's largest, in Miramar — expos, fairs, the Christmas park
      geo: [18.45332, -66.09258],
      capacity: 10000,
      type: 'community',
      cssVar: '--v-prcc',
      color: '#2e8f9e',
      url: 'https://www.prconvention.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.prconvention.com&sz=128',
      alias: /convention center|centro de convenciones/i,
    },
    'Vivo Beach Club': { // the beach club on the Isla Verde shore in Carolina, about 5,000 on the sand — salsa nights, DJs, the bazaars
      geo: [18.44695, -66.00053],
      capacity: 5000,
      type: 'concert',
      cssVar: '--v-vivo',
      color: '#2e9e8b',
      url: 'https://vivobeachclub.com/',
      icon: 'https://www.google.com/s2/favicons?domain=vivobeachclub.com&sz=128',
      alias: /vivo beach/i,
    },
    'Hotel Rumbao': { // the Tribute Portfolio hotel at the foot of Old San Juan — its ballroom's concerts and shows, and the Comedy Lab (Ticketera lists the comedy room under its own name, on the hotel's page)
      geo: [18.46417, -66.11227],
      capacity: 800,
      type: 'concert',
      cssVar: '--v-rumbao',
      color: '#9e6b2e',
      url: 'https://www.hotelrumbaosanjuan.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.hotelrumbaosanjuan.com&sz=128',
      alias: /rumbao|comedy lab/i,
    },
    'Estadio Hiram Bithorn': { // the 18,000-seat ballpark in Hato Rey, across from the Choli — the Cangrejeros' and Senadores' winter-league home
      geo: [18.41684, -66.0735],
      capacity: 18000,
      type: 'sports',
      cssVar: '--v-bithorn',
      color: '#c2521f',
      url: 'https://ligapr.com/',
      icon: 'https://www.google.com/s2/favicons?domain=ligapr.com&sz=128',
      alias: /hiram bithorn/i,
    },
    'Coliseo Roberto Clemente': { // the 1973 arena beside the Bithorn, about 9,500 — BSN basketball, boxing, the odd concert
      geo: [18.41593, -66.07545],
      capacity: 9500,
      type: 'sports',
      cssVar: '--v-clemente',
      color: '#2e9e4a',
      url: 'https://bsnpr.com/',
      icon: 'https://www.google.com/s2/favicons?domain=bsnpr.com&sz=128',
      alias: /roberto clemente/i,
    },
    'Elsewhere in San Juan': { // every room the ticketer names that has no row of its own folds here — one row, not one per room (the Everett pattern, Steve 2026-10-10)
      geo: [18.466, -66.106],
      type: 'concert',
      cssVar: '--v-else',
      color: '#7c8a96',
    },
    'Bellas Artes de Caguas': { // the Centro de Bellas Artes de Caguas, about 1,000 seats — the same plays and comedies a week after Santurce
      geo: [18.23617, -66.03711],
      area: 'town',
      capacity: 1000,
      type: 'arts',
      cssVar: '--v-cbac',
      color: '#9e2e7a',
      url: 'https://www.bellasartescaguas.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.bellasartescaguas.com&sz=128',
      alias: /bellas artes de caguas/i,
    },
    'Moneró Café Teatro': { // a café-theatre in Caguas, about 300 — stand-up, trova, the small plays
      geo: [18.44403, -66.06669],
      area: 'town',
      capacity: 300,
      type: 'arts',
      cssVar: '--v-monero',
      color: '#8a7a2e',
      url: 'https://www.ticketera.com/events/venue/monero-cafe-teatro-bar',
      icon: 'https://www.google.com/s2/favicons?domain=www.ticketera.com&sz=128',
      alias: /moner[oó]/i,
    },
  };

  // City-wide feeds (scripts/feeds.mjs `feeds`): Ticketera, read room by room
  // (each room's own listing page) plus its sports page for the two grounds.
  // Each listing keeps the room the ticketer names and folds onto a row above
  // by alias, or into 'Elsewhere in San Juan'. The pages come through
  // scripts/cffi-fetch.py (Ticketera's edge refuses plain clients).
  var FEEDS = [
    { kind: 'ticketera', label: 'Ticketera', url: 'https://www.ticketera.com',
      pages: ['/events/venue/coliseo-de-puerto-rico', '/events/venue/coca-cola-music-hall', '/events/venue/cba-santurce', '/events/venue/puerto-rico-convention-center', '/events/venue/vivo-beach-club', '/events/venue/hotel-rumbao-san-juan', '/events/venue/bellas-artes-de-caguas', '/events/venue/monero-cafe-teatro-bar'],
      drop: /\babonados?\b|\bpre-?venta\b/i }, // season-ticket packages and pre-sale notices, not events
    { kind: 'ticketera', label: 'Ticketera (sports)', url: 'https://www.ticketera.com', pages: ['/events/category/deportes'],
      rooms: /hiram bithorn|roberto clemente/i, drop: /\babonados?\b/i }, // the island-wide sports page, kept to the two San Juan grounds
  ];

  // The filter panel's starting state: every room on, nothing off.
  var DEFAULT_ON = ['Coliseo de Puerto Rico', 'Coca-Cola Music Hall', 'Centro de Bellas Artes', 'Puerto Rico Convention Center', 'Vivo Beach Club', 'Hotel Rumbao', 'Estadio Hiram Bithorn', 'Coliseo Roberto Clemente', 'Elsewhere in San Juan', 'Bellas Artes de Caguas', 'Moneró Café Teatro'];
  var DEFAULT_OFF = [];
  var PREFS_KNOWN_FROM = null; // no default-off venue yet, so nothing for saved prefs to be told about

  // The event types (the panel's Event Type rows; badges.mjs assigns them).
  var TYPES = [
    { key: 'concert', label: 'Concerts', title: 'Live music — the Choli, the Music Hall, the beach club' },
    { key: 'sports', label: 'Sports', title: 'Winter-league baseball, BSN basketball, boxing' },
    { key: 'arts', label: 'Arts & Theater', title: 'Plays, comedy, ballet, the symphony at the Bellas Artes' },
    { key: 'community', label: 'Community', title: 'Expos, fairs, family days at the Convention Center' },
  ];
  var MOVIE_VENUE = null; // no cinema listed

  // Share codes (?f=CODE): REGISTRY is every filterable key in a fixed
  // order and a code is a bitmask over it, so the list is APPEND-ONLY —
  // adding an entry adds a bit and every existing code keeps meaning what
  // it meant; removing or reordering one changes every link out there.
  // 21 slots from the first build (2026-10-14): five base-36 digits.
  var CODE_LENGTH = 5;
  var REGISTRY = [
    ['venue', 'Coliseo de Puerto Rico'], ['venue', 'Coca-Cola Music Hall'], ['venue', 'Centro de Bellas Artes'], ['venue', 'Puerto Rico Convention Center'], ['venue', 'Vivo Beach Club'], ['venue', 'Hotel Rumbao'], ['venue', 'Estadio Hiram Bithorn'], ['venue', 'Coliseo Roberto Clemente'], ['venue', 'Elsewhere in San Juan'], ['venue', 'Bellas Artes de Caguas'], ['venue', 'Moneró Café Teatro'],
    ['badge', 'concert'], ['badge', 'sports'], ['badge', 'arts'], ['badge', 'community'],
    ['team', 'cangrejeros'], ['team', 'senadores'],
    ['cap', 'stadium'], ['cap', 'arena'], ['cap', 'hall'], ['cap', 'room'],
  ];

  var WORDS = {
    teamCity: 'San Juan', // the board drops it from the clubs' names (neither club's label carries it, so nothing changes here)
    presetDefault: 'Every room — San Juan and Caguas — every team and type',
    presetNeighborhood: 'San Juan only — the Choli, the Music Hall, the Bellas Artes, the Convention Center, the beach club and the two grounds',
    presetBig: 'Only the places that hold 2,000 or more — the Choli, the Music Hall, the Convention Center, the beach club and the two grounds',
    phrases: { all: 'Showing everything.', none: 'Showing nothing yet — open Filter and pick some venues.', neighborhood: 'Showing San Juan only.', big: 'Showing the big rooms only — the Choli, the Music Hall, the Convention Center, the beach club and the two grounds.' },
  };

  // Puerto Rico's public holidays (app.js holidaysFor reads this instead of
  // its US list): the federal days the island keeps plus its own — Three
  // Kings Day, Hostos, Emancipation Day, de Diego, the Constitution, Barbosa,
  // Discovery Day — and Nochebuena, which the whole island keeps. Good Friday
  // moves with Easter and is left out.
  function nthWeekday(y, month, weekday, n) { var d = new Date(y, month, 1); while (d.getDay() !== weekday) d.setDate(d.getDate() + 1); d.setDate(d.getDate() + (n - 1) * 7); return d; }
  function lastMonday(y, month) { var d = new Date(y, month + 1, 0); while (d.getDay() !== 1) d.setDate(d.getDate() - 1); return d; }
  var HOLIDAYS = function (y) {
    return [
      [new Date(y, 0, 1), 'Año Nuevo'],
      [new Date(y, 0, 6), 'Día de Reyes'],
      [nthWeekday(y, 0, 1, 2), 'Natalicio de Eugenio María de Hostos'],
      [nthWeekday(y, 0, 1, 3), 'Martin Luther King Jr. Day'],
      [nthWeekday(y, 1, 1, 3), 'Presidents’ Day'],
      [new Date(y, 2, 22), 'Día de la Abolición de la Esclavitud'],
      [nthWeekday(y, 3, 1, 3), 'Natalicio de José de Diego'],
      [lastMonday(y, 4), 'Memorial Day'],
      [new Date(y, 5, 19), 'Juneteenth'],
      [new Date(y, 6, 4), 'Independence Day'],
      [new Date(y, 6, 25), 'Día de la Constitución'],
      [new Date(y, 6, 27), 'Natalicio de José Celso Barbosa'],
      [nthWeekday(y, 8, 1, 1), 'Labor Day'],
      [nthWeekday(y, 9, 1, 2), 'Día de la Raza'],
      [new Date(y, 10, 11), 'Veterans Day'],
      [new Date(y, 10, 19), 'Descubrimiento de Puerto Rico'],
      [nthWeekday(y, 10, 4, 4), 'Thanksgiving'],
      [new Date(y, 11, 24), 'Nochebuena'],
      [new Date(y, 11, 25), 'Navidad'],
    ];
  };

  global.LQACity = {
    key: 'sanjuan',
    name: 'San Juan',
    site: 'https://sanjuan.here.events/', // a city-wide site is <city>.here.events (Steve, 2026-10-11); not wired yet — on "deploy"
    userAgent: 'Mozilla/5.0 (compatible; sanjuan-events/1.0; +https://sanjuan.here.events/)',
    tz: 'America/Puerto_Rico', tzName: 'Atlantic Standard Time (UTC−4, no daylight saving)', // the city's time zone: the ICS feed's TZID, the game clocks, the poster's footer; Puerto Rico keeps no daylight time
    state: 'Puerto Rico', stateOutline: null, // no state drawing (the masthead's state strip went away 2026-10-13)
    ics: { name: 'San Juan Events', short: 'San Juan Events', teams: 'San Juan home teams — every season', prodid: '-//here.events//sanjuan-events//EN', uidDomain: 'fosdal.net', // the UID domain the whole family issues (the shared ics test pins it)
      desc: 'Upcoming events around San Juan\\, Puerto Rico — the Choli\\, the Coca-Cola Music Hall\\, the Bellas Artes\\, the Convention Center\\, the beach club\\, the two grounds and Caguas\\, with the Cangrejeros\' and Senadores\' winter seasons' },
    teams: TEAMS,
    map: { // the Map view (local-map.js; the ground drawn once by scripts/build-local-map.mjs from OpenStreetMap, committed as site/local-map.json) — every city gets one, Steve, 2026-10-26
      kind: 'urban',
      bbox: [18.202, -66.151, 18.5, -65.962], // south, west, north, east — every room, with a margin
      home: [18.403, -66.14, 18.479, -65.973], // the view at first: the city's own rooms; the fit button shows the whole frame
      roads: ['motorway', 'trunk', 'primary'],
      tolerance: 0.6,
      labels: [
        { name: 'San Juan', lat: 18.466, lon: -66.106, anchor: 'middle' },
        { name: 'Río Piedras', lat: 18.39742, lon: -66.05011, anchor: 'middle' },
        { name: 'Caguas', lat: 18.21294, lon: -66.05588, anchor: 'middle' },
      ],
    },
    distanceUnit: 'km', // the mileage signs on the map read kilometres here
    venues: VENUES,
    feeds: FEEDS,
    defaultOn: DEFAULT_ON,
    defaultOff: DEFAULT_OFF,
    prefsKnownFrom: PREFS_KNOWN_FROM,
    types: TYPES,
    movieVenue: MOVIE_VENUE,
    groundsVenue: 'Elsewhere in San Juan', // a venue with no row of its own folds here (aliases are tried first)
    holidays: HOLIDAYS,
    codeLength: CODE_LENGTH,
    registry: REGISTRY,
    words: WORDS,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
