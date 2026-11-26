// ---------- 1. DATA SOURCE SETTINGS ----------
const FILM_PAGE = "https://www.filmrescue.com/film-database/film-types/";

// Film Rescue is a normal website, not an API, so a browser on another website
// is usually blocked (CORS). We try a direct request first, then public proxies.
const PROXIES = [
    "",
    "https://api.allorigins.win/raw?url=",
    "https://api.codetabs.com/v1/proxy?quest="
];

// Brands listed on the Film Rescue index page
const BRANDS = [
    "1 Hour Photo", "3-Rings", "3M", "ADOX", "AGFA", "AGFA PHOTO", "Albinar", "America's Choice", "American Mercantile",
    "Anfang", "Ansco", "Ansco GAF", "Arbor", "Argenti", "Arista", "Asa", "Astral", "Astrum", "Atomic-X", "Azomureș",
    "Barbie", "Bargain Harolds", "Baycrest", "BCG", "Bergger", "Beua", "Black's", "Bluefire", "Bonusprint", "Boots",
    "BOOTS", "Border Free", "Brooks", "Cachet", "Camera Club of America", "Can Power", "Cappelli-Ferrania",
    "Carrete Foto Color", "CatLABS", "Certified", "Cinecolor", "Cinestill", "Cinestyle", "Clarkcolor", "Co-op",
    "Colorama xr Disc Film", "Colour Care", "CVS", "Dan-Di", "Dekopan", "Direct Film", "Dixon's", "Doublefilm", "Dover",
    "Ducati", "Dufay", "Dynachrome", "Dynapan", "Eastman", "Econo", "Efke", "ERA", "Eterna", "expert", "Family Dollar",
    "Famous Brand", "Ferrani", "Ferrania", "Fiji", "Film from Italy", "Film Washi", "FNAC", "Focal", "Foma", "Forte",
    "Foto Fair", "Foto King", "Foto Source", "Fotocenter", "FOTOIMPEX", "Fotolabo Club", "Fotomat", "FOTON", "Fotron",
    "Fox Photo", "Fred's", "FUDA", "Fuji", "GAF", "Gaytime", "Gevaert", "Gigabit", "Gold Circle", "Grants", "Gratispool",
    "Guardian", "H&W", "Hillvale", "Hinomoto", "Holga", "HomeBest", "ificolor", "ILFOcolor", "Ilford", "Image",
    "Image Link", "Images", "ImageTech", "Imago", "Imation", "International", "Iszatt", "Japan (?)", "Japan Camera",
    "Japan Camera Hunter", "JEROME", "Jessop", "Kamero", "Kentmere", "Kid Camera", "Kiku", "Kim Labs", "King Size",
    "King Size Film", "Kirkland", "Kits", "Kmart", "KMart", "Kmart Focal", "Kodak", "KODAK", "KodaK", "Kolor 92",
    "Koncolor", "Konica", "KONO!", "Kosmo", "Kryptar", "Kwik Foto", "Lamagraphy", "Legacy", "Life", "Lifecolor",
    "Limocolor", "Lloyd's", "Lofoto", "Lomography", "Long's", "Lucky", "Lucky Color", "Lumiere", "Maco", "Macophot",
    "Made in Belgium", "Made in Belgum", "Made in England", "Made in EU", "Made in France", "Made in Germany",
    "Made in Italy", "Made in Japan", "Made in USA", "Made in West Germany", "Mail-a-Film", "Master Choice", "MC",
    "Micro 16", "Minicord", "Minolta", "Minolts", "Minori", "Minox", "Mitsubishi", "Moto Photo", "MSI", "Mycro Film",
    "Mystic Color", "Negra", "No Name", "No name", "OINice", "Oriental", "ORWO", "Osco", "Owax", "P.C.", "Panchro",
    "Panchromatic", "Pathmark", "Peoples", "Perry", "Perutz", "PHAR-MOR", "Photoworks", "Pictoriographica",
    "Picture Par", "Plenachrome", "Polaroid", "Polypan", "Porst", "Porta", "Prinz", "Pro Max", "Quality", "Rapid Film",
    "Rave", "Regency", "Replace-a-Film", "Rera", "Retropan", "Revolog", "Revue", "RGB", "Rite Aid", "Ritz", "Rollei",
    "Safeway", "Sainsbury's", "Sakura", "Santa", "Schleussner", "Scot Foto", "Sears", "Seattle Film Works", "Selo",
    "Shanghai", "Sharp", "Shell", "Signature", "Silberra", "Snap Shops", "Snappy's 110", "Solaris", "Sooter's",
    "Spectra", "SPUR", "SS", "Street Candy", "Super 16", "Super G", "Super Lumichrome", "Supersnaps", "SuperX",
    "Supretone", "Svema", "Tacma", "Target (3M)", "Tasma", "Technicolor", "Telecolor", "Tesco", "Thrifty", "Topcrest",
    "Towers Bonimart", "Traid", "TriFCA", "Triple Print", "True Color", "True Print", "Tudor", "Tynar", "Type-D",
    "Ultra-Color", "Ultrachrome", "Ultracolor", "Ultrafine", "Ultrapan", "Underwood", "Universal", "Univex", "Unknown",
    "Valca", "Viking", "Walgreens", "Warszawskie Zaklady Fototechniczne (WZF)", "Western Family", "Western Photo",
    "Whittaker", "Woolco", "Woolco/Woolcrest", "Woolco/Woolworths", "Yodica", "York", "Zellers"
];

// Brands searched when the user does not type a brand (kept short so it loads fast)
const POPULAR_BRANDS = ["Kodak", "Fuji", "Ilford", "Cinestill", "Lomography", "Rollei", "Kentmere", "Foma"];


// ---------- 2. LIGHT / DARK MODE TOGGLE (both pages) ----------
const themeButton = document.getElementById("theme-button");

function applyTheme(theme) {
    if (theme === "light") {
        document.body.classList.add("light");
        themeButton.textContent = "Dark mode";
    } else {
        document.body.classList.remove("light");
        themeButton.textContent = "Light mode";
    }
}

// Event: click the theme button
themeButton.addEventListener("click", () => {
    const newTheme = document.body.classList.contains("light") ? "dark" : "light";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
});

applyTheme(localStorage.getItem("theme") || "dark");


// ---------- 3. HELPER FUNCTIONS (both pages) ----------

// Request JSON from an API (used for weather and sample photos)
async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }
    return await response.json();
}

// Request a web page as text. Try direct first, then each proxy.
async function fetchText(url) {
    let lastError = new Error("no attempt");
    for (const proxy of PROXIES) {
        const fullUrl = proxy === "" ? url : proxy + encodeURIComponent(url);
        try {
            const response = await fetch(fullUrl);
            if (!response.ok) {
                throw new Error(`status ${response.status}`);
            }
            const text = await response.text();
            if (!text.includes("<table")) {
                throw new Error("no table in the response");
            }
            return text;
        } catch (error) {
            lastError = error;   // try the next proxy
        }
    }
    throw new Error(`could not load the film database (${lastError.message})`);
}

// "Black's" -> "Blacks" : the format Film Rescue uses in its table_filter links
function toKey(brand) {
    return brand.replace(/[^A-Za-z0-9]/g, "");
}

// Turn one table row (array of cell texts) into a film object.
// The Film Rescue columns are not always in the same place, so we look for patterns.
function parseRow(cells) {
    const get = (index) => (cells[index] !== undefined ? cells[index] : "");

    // ISO / ASA
    let iso = get(2);
    if (/^\d/.test(iso)) {
        iso = `ISO ${iso}`;
    }

    // Colour type is in column 4 or 5
    const colour = [get(4), get(5)].find((c) => /colou?r|black|b&w|slide|reversal|infrared/i.test(c)) || "";

    // DX code (column 4, only if it contains digits)
    const dx = /\d/.test(get(4)) && !/colou?r|b&w/i.test(get(4)) ? get(4) : "";

    // Dates are in columns 6-8
    const date = [get(6), get(7), get(8)].find((c) => /\d{4}/.test(c) && c.length <= 30) || "";

    // Country is in columns 6-9
    const country = [get(6), get(7), get(8), get(9)].find((c) => /^[A-Za-z .]{2,25}$/.test(c) && c !== "") || "";

    // Lab process such as C-41, E-6, ECN-2
    const processMatch = cells.slice(4).join(" | ").match(/\b(C-?41|E-?6|ECN-?2|E-?4|E-?3|E-?2|E-?1|C-?22|K-?14)\b/i);
    const process = processMatch ? processMatch[1].toUpperCase().replace(/^([A-Z]+)-?(\d+)$/, "$1-$2") : "";

    // First web link in the row = manufacturer data sheet
    const dataSheet = cells.slice(10).find((c) => c.startsWith("http")) || "";

    // Longer text cells are notes
    const notes = cells.slice(8).filter((c) => c.length > 12 && !c.startsWith("http")).join(" ");

    return {
        id: `${cells[0]}|${cells[1]}`,
        brand: cells[0],
        name: cells[1],
        iso: iso,
        formats: get(3),
        colour: colour,
        dx: dx,
        country: country,
        date: date,
        process: process,
        notes: notes,
        dataSheet: dataSheet
    };
}

// The table repeats some films. Merge rows with the same brand + name.
function mergeDuplicates(films) {
    const merged = new Map();
    for (const film of films) {
        const key = `${film.brand}|${film.name}`.toLowerCase();
        if (!merged.has(key)) {
            merged.set(key, film);
        } else {
            const existing = merged.get(key);
            for (const field of Object.keys(film)) {
                if (existing[field] === "" && film[field] !== "") {
                    existing[field] = film[field];
                }
            }
        }
    }
    return Array.from(merged.values());
}

// Read every <tr> of the page. DOMParser builds a document without running its scripts.
function parseFilmTable(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const films = [];

    for (const row of doc.querySelectorAll("table tr")) {
        const cells = Array.from(row.querySelectorAll("td")).map((td) => {
            const link = td.querySelector("a");
            return link ? link.href : td.textContent.trim();
        });
        if (cells.length >= 2 && cells[1] !== "") {
            films.push(parseRow(cells));
        }
    }
    return mergeDuplicates(films);
}

// Load all films of one brand (saved in sessionStorage so the 2nd search is instant)
async function loadBrand(brand) {
    const key = toKey(brand);
    const cacheName = `brand:${key}`;

    const cached = sessionStorage.getItem(cacheName);
    if (cached !== null) {
        return JSON.parse(cached);
    }

    const html = await fetchText(`${FILM_PAGE}?table_filter=${key}`);
    const films = parseFilmTable(html).filter((film) => toKey(film.brand).toLowerCase() === key.toLowerCase());

    try {
        sessionStorage.setItem(cacheName, JSON.stringify(films));
    } catch (error) {
        // storage full: just skip caching
    }
    return films;
}

// Load several brands one after another. onProgress shows a message.
async function loadBrands(brands, onProgress) {
    let films = [];
    let failed = 0;
    for (let i = 0; i < brands.length; i++) {
        onProgress(`Loading ${brands[i]} (${i + 1}/${brands.length})...`);
        try {
            films = films.concat(await loadBrand(brands[i]));
        } catch (error) {
            failed++;
        }
    }
    if (failed === brands.length) {
        throw new Error("could not load the film database. Check PROXIES in filmfinder.js");
    }
    return films;
}

// First number in the ISO text: "ISO 6-25" -> 6
function getIsoNumber(film) {
    const match = String(film.iso).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
}

function isBlackAndWhite(film) {
    return /black|b&w|\bbw/i.test(`${film.colour} ${film.name}`);
}

// Production status guessed from the date column
function getStatus(film) {
    const date = film.date.toLowerCase();
    if (date.includes("re-released") || /\d{4}\s*-\s*$/.test(date)) {
        return "Possibly still made";
    }
    if (/\d{4}\s*-\s*\??\d{4}/.test(date) || /^\??\s*-\s*\d{4}/.test(date)) {
        return "Discontinued";
    }
    return "Unknown";
}

// Save the chosen film, then go to the result page
function openResultPage(film) {
    sessionStorage.setItem("currentFilm", JSON.stringify(film));
    window.location.href = `results.html?id=${encodeURIComponent(film.id)}`;
}

// Create a rounded button-style link
function makeLink(text, url, isPrimary) {
    const link = document.createElement("a");
    link.classList.add("btn");
    if (!isPrimary) {
        link.classList.add("btn-outline");
    }
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = text;
    return link;
}


// ==========================================================
// 4. HOME PAGE (index.html)
// ==========================================================
function initHomePage() {
    const searchForm = document.getElementById("search-form");
    const searchType = document.getElementById("search-type");
    const searchInput = document.getElementById("search-input");
    const brandList = document.getElementById("brand-list");
    const randomButton = document.getElementById("random-btn");
    const weatherText = document.getElementById("weather-text");
    const message = document.getElementById("message");
    const resultsBox = document.getElementById("results");

    // Application state: the films currently shown
    let films = [];

    function showMessage(text, isError) {
        message.textContent = text;
        message.classList.toggle("error", isError);
    }

    // Brand suggestions for the manufacturer search (no duplicates in different case)
    const seenBrands = [];
    for (const brand of BRANDS) {
        if (!seenBrands.includes(brand.toLowerCase())) {
            seenBrands.push(brand.toLowerCase());
            const option = document.createElement("option");
            option.value = brand;
            brandList.appendChild(option);
        }
    }

    // Render function: state -> user interface
    function renderFilms() {
        // Step 1: clear the old cards
        resultsBox.replaceChildren();

        // Step 2: loop through the state (show at most 60 cards)
        for (const film of films.slice(0, 60)) {
            // Step 3: create elements
            const card = document.createElement("article");
            card.classList.add("film-card");
            card.setAttribute("tabindex", "0");

            const title = document.createElement("h3");
            title.textContent = film.name;

            const maker = document.createElement("p");
            maker.classList.add("card-maker");
            maker.textContent = film.iso !== "" ? `${film.brand} · ${film.iso}` : film.brand;

            card.append(title, maker);

            // Step 4: events for each card
            card.addEventListener("click", () => openResultPage(film));
            card.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    openResultPage(film);
                }
            });
            card.addEventListener("pointerenter", () => card.classList.add("highlight"));
            card.addEventListener("pointerleave", () => card.classList.remove("highlight"));

            // Step 5: insert into the page
            resultsBox.appendChild(card);
        }
    }

    // Find which brands are mentioned in the search text
    function findBrandsInText(textLower) {
        const padded = ` ${textLower} `;
        return BRANDS.filter((brand) => padded.includes(` ${brand.toLowerCase()} `));
    }

    // ----- Search -----
    // Event: submit the search form
    searchForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const type = searchType.value;
        const text = searchInput.value.trim();

        if (text === "") {
            showMessage("Please type something to search.", true);
            return;
        }

        try {
            let found = [];

            if (type === "dx") {
                const digits = text.replace(/\D/g, "");
                if (digits.length < 4) {
                    showMessage("Type at least 4 digits of the DX code.", true);
                    return;
                }
                const all = await loadBrands(POPULAR_BRANDS, (t) => showMessage(t, false));
                found = all.filter((film) => film.dx.replace(/\D/g, "").includes(digits));

            } else if (type === "manufacturer") {
                const textLower = text.toLowerCase();
                let brands = BRANDS.filter((brand) => brand.toLowerCase() === textLower);
                if (brands.length === 0) {
                    brands = BRANDS.filter((brand) => brand.toLowerCase().includes(textLower));
                }
                if (brands.length === 0) {
                    showMessage("No manufacturer found. Pick one from the suggestions.", true);
                    return;
                }
                if (brands.length > 6) {
                    showMessage("Too many manufacturers match. Please be more specific.", true);
                    return;
                }
                found = await loadBrands(brands, (t) => showMessage(t, false));

            } else {
                // Film name: remove any brand words, then match the rest against film names
                const textLower = text.toLowerCase();
                const brands = findBrandsInText(textLower);
                let rest = ` ${textLower} `;
                for (const brand of brands) {
                    rest = rest.replace(` ${brand.toLowerCase()} `, " ");
                }
                const words = rest.trim().split(/\s+/).filter((word) => word !== "");

                const all = await loadBrands(brands.length > 0 ? brands : POPULAR_BRANDS, (t) => showMessage(t, false));
                found = all.filter((film) => words.every((word) => film.name.toLowerCase().includes(word)));
            }

            films = found;
            renderFilms();

            if (films.length === 0) {
                const extra = type === "dx" ? " Only a few films in this database have a DX code." : " Try fewer words.";
                showMessage(`No films found.${extra}`, false);
            } else if (films.length > 60) {
                showMessage(`Found ${films.length} films. Showing the first 60. Add a film name to narrow it down.`, false);
            } else {
                showMessage(`Found ${films.length} film(s). Click one to see details.`, false);
            }
        } catch (error) {
            films = [];
            renderFilms();
            showMessage(`Something went wrong: ${error.message}.`, true);
        }
    });

    // Event: typing in the search box clears an old error
    searchInput.addEventListener("input", () => {
        if (message.classList.contains("error")) {
            showMessage("", false);
        }
    });

    // Event: changing the search type updates the placeholder and suggestions
    searchType.addEventListener("change", () => {
        switch (searchType.value) {
            case "dx":
                searchInput.placeholder = "e.g. 013994";
                searchInput.removeAttribute("list");
                break;
            case "manufacturer":
                searchInput.placeholder = "e.g. Kodak";
                searchInput.setAttribute("list", "brand-list");
                break;
            default:
                searchInput.placeholder = "e.g. Kodak Portra 400";
                searchInput.removeAttribute("list");
        }
    });

    // Event: press "/" anywhere to jump to the search box
    document.addEventListener("keydown", (event) => {
        if (event.key === "/" && document.activeElement !== searchInput) {
            event.preventDefault();
            searchInput.focus();
        }
    });

    // ----- Random film from today's weather -----

    // Turn a weather code (Open-Meteo) into a simple group
    function getWeatherGroup(code, isDay) {
        if (isDay === 0) return "night";
        if (code <= 1) return "clear";
        if (code <= 3) return "cloudy";
        if (code <= 48) return "fog";
        if (code <= 67) return "rain";
        if (code <= 77) return "snow";
        if (code <= 82) return "rain";
        if (code <= 86) return "snow";
        return "storm";
    }

    // Each weather group prefers a film speed range (ISO)
    function getIdeas(group) {
        switch (group) {
            case "clear":
                return { label: "Sunny", minIso: 25, maxIso: 200, blackAndWhite: false };
            case "cloudy":
                return { label: "Cloudy", minIso: 200, maxIso: 400, blackAndWhite: false };
            case "fog":
                return { label: "Foggy", minIso: 100, maxIso: 800, blackAndWhite: true };
            case "rain":
                return { label: "Rainy", minIso: 400, maxIso: 800, blackAndWhite: false };
            case "snow":
                return { label: "Snowy", minIso: 100, maxIso: 200, blackAndWhite: false };
            case "storm":
                return { label: "Stormy", minIso: 400, maxIso: 3200, blackAndWhite: false };
            default:
                return { label: "Night", minIso: 800, maxIso: 3200, blackAndWhite: false };
        }
    }

    // Ask for the user's location (fallback: Toronto)
    function getLocation() {
        return new Promise((resolve) => {
            const toronto = { lat: 43.65, lon: -79.38, name: "Toronto" };
            if (!navigator.geolocation) {
                resolve(toronto);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    name: "your location"
                }),
                () => resolve(toronto)
            );
        });
    }

    async function getWeather() {
        const place = await getLocation();
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current=temperature_2m,weather_code,is_day`;
        const data = await fetchJson(url);
        return {
            placeName: place.name,
            temperature: data.current.temperature_2m,
            code: data.current.weather_code,
            isDay: data.current.is_day
        };
    }

    // Films already suggested to this user (so we never repeat)
    function getSeenList() {
        return JSON.parse(localStorage.getItem("seenFilms") || "[]");
    }

    // Event: click the random button
    randomButton.addEventListener("click", async () => {
        randomButton.disabled = true;
        showMessage("Checking the weather...", false);

        try {
            const weather = await getWeather();
            const ideas = getIdeas(getWeatherGroup(weather.code, weather.isDay));

            // Show the weather summary
            weatherText.replaceChildren();
            const tag = document.createElement("span");
            tag.classList.add("tag");
            tag.textContent = ideas.label;
            weatherText.append(tag, ` ${weather.temperature}°C at ${weather.placeName}`);

            // Load films, then keep the ones that fit the weather
            const all = await loadBrands(POPULAR_BRANDS, (t) => showMessage(t, false));

            let candidates = all.filter((film) => {
                const iso = getIsoNumber(film);
                const fitsIso = iso >= ideas.minIso && iso <= ideas.maxIso;
                const fitsColour = ideas.blackAndWhite ? isBlackAndWhite(film) : true;
                return fitsIso && fitsColour && getStatus(film) !== "Discontinued";
            });
            if (candidates.length === 0) {
                candidates = all.filter((film) => getIsoNumber(film) > 0);   // relax the rules
            }
            if (candidates.length === 0) {
                showMessage("No films with an ISO value were found.", true);
                return;
            }

            // Remove films this user has already seen, so each press is different
            let seen = getSeenList();
            let fresh = candidates.filter((film) => !seen.includes(film.id));
            if (fresh.length === 0) {
                seen = [];            // everything was seen: start a new round
                fresh = candidates;
            }

            const picked = fresh[Math.floor(Math.random() * fresh.length)];
            seen.push(picked.id);
            localStorage.setItem("seenFilms", JSON.stringify(seen));

            showMessage(`Today's pick: ${picked.brand} ${picked.name}`, false);
            openResultPage(picked);
        } catch (error) {
            showMessage(`Something went wrong: ${error.message}.`, true);
        } finally {
            randomButton.disabled = false;
        }
    });
}


// ==========================================================
// 5. RESULT PAGE (results.html)
// ==========================================================
function initResultPage() {
    const params = new URLSearchParams(window.location.search);
    const filmId = params.get("id") || "";

    const message = document.getElementById("message");
    const detail = document.getElementById("detail");

    // Lab process: use the database value, otherwise guess from the text
    function getProcess(film) {
        if (film.process !== "") {
            return film.process;
        }
        const text = `${film.name} ${film.colour} ${film.notes}`.toLowerCase();

        if (/slide|reversal|velvia|provia|ektachrome/.test(text)) {
            return "E-6";
        }
        if (/ecn|motion picture|vision3/.test(text)) {
            return "ECN-2";
        }
        if (/black|b&w|\bbw|hp5|tri-x|t-max|tmax|delta|fp4|apx|acros|neopan|pan f|xp2/.test(text)) {
            return "Black & white";
        }
        return "C-41";
    }

    function addInfoRow(list, label, value) {
        const row = document.createElement("div");
        row.classList.add("info-row");

        const term = document.createElement("dt");
        term.textContent = label;

        const description = document.createElement("dd");
        description.textContent = value || "No data";

        row.append(term, description);
        list.appendChild(row);
        return description;
    }

    function showShopLinks(film) {
        const query = encodeURIComponent(`${film.brand} ${film.name} film`);
        document.getElementById("price-note").textContent =
            "This database does not list prices or stock, so check live prices at these shops:";

        const box = document.getElementById("shop-links");
        box.append(
            makeLink("B&H Photo", `https://www.bhphotovideo.com/c/search?q=${query}`, true),
            makeLink("eBay", `https://www.ebay.com/sch/i.html?_nkw=${query}`, false),
            makeLink("Amazon", `https://www.amazon.com/s?k=${query}`, false),
            makeLink("Google Shopping", `https://www.google.com/search?tbm=shop&q=${query}`, false)
        );
    }

    // Sample photos come from Wikimedia Commons (every photo links to its source)
    async function showPhotos(film) {
        const note = document.getElementById("gallery-note");
        const gallery = document.getElementById("gallery");
        const query = encodeURIComponent(`${film.brand} ${film.name}`);

        // Backup links are always shown
        document.getElementById("photo-links").append(
            makeLink("More on Flickr", `https://www.flickr.com/search/?text=${query}%20film`, true),
            makeLink("More on r/analog", `https://www.reddit.com/r/analog/search/?q=${query}&restrict_sr=1`, false)
        );

        const url = "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
            `&gsrsearch=${query}&gsrnamespace=6&gsrlimit=8&prop=imageinfo` +
            "&iiprop=url&iiurlwidth=400&format=json&origin=*";

        try {
            const data = await fetchJson(url);
            const pages = data.query ? Object.values(data.query.pages) : [];
            let count = 0;

            for (const page of pages) {
                const info = page.imageinfo ? page.imageinfo[0] : null;
                if (!info || !/\.(jpe?g|png)$/i.test(page.title)) {
                    continue;
                }

                const figure = document.createElement("figure");

                const imageLink = document.createElement("a");
                imageLink.href = info.descriptionurl;
                imageLink.target = "_blank";
                imageLink.rel = "noopener";

                const image = document.createElement("img");
                image.src = info.thumburl;
                image.alt = `Sample photo: ${page.title}`;
                image.loading = "lazy";
                imageLink.appendChild(image);

                const caption = document.createElement("figcaption");
                const source = document.createElement("a");
                source.href = info.descriptionurl;
                source.target = "_blank";
                source.rel = "noopener";
                source.textContent = "Source: Wikimedia Commons";
                caption.appendChild(source);

                figure.append(imageLink, caption);
                gallery.appendChild(figure);
                count++;
            }

            note.textContent = count > 0
                ? "Photos from Wikimedia Commons. Click a photo to see its author and license."
                : "No sample photos found on Wikimedia Commons. Try the links below.";
        } catch (error) {
            note.textContent = "Could not load sample photos. Try the links below.";
        }
    }

    function showLabs(film) {
        const process = getProcess(film);
        document.getElementById("lab-note").textContent =
            `This film needs ${process} processing. Ask the lab if they develop it before you send it in.`;

        const box = document.getElementById("lab-links");
        box.append(
            makeLink("Downtown Camera", "https://findmyfilmlab.com/location/downtown-camera/", true),
            makeLink("Find another lab", "https://findmyfilmlab.com/", false),
            makeLink("Search on Google Maps",
                `https://www.google.com/maps/search/film+developing+lab+${encodeURIComponent(process.split(" ")[0])}`, false)
        );
    }

    // Render function for the whole page
    function renderDetail(film) {
        document.title = `${film.name} - Film Finder`;
        document.getElementById("film-title").textContent = `${film.brand} ${film.name}`;

        // Film Rescue has no package images, so show a placeholder and a search link
        const imageBox = document.getElementById("image-box");
        const placeholder = document.createElement("div");
        placeholder.classList.add("no-image");
        placeholder.textContent = "This database has no package photo for this film.";

        const packageQuery = encodeURIComponent(`${film.brand} ${film.name} film box`);
        const packageLink = makeLink("Find package photos", `https://www.google.com/search?tbm=isch&q=${packageQuery}`, true);
        imageBox.append(placeholder, packageLink);

        // Info list
        const list = document.getElementById("info-list");
        addInfoRow(list, "Manufacturer", film.brand);
        addInfoRow(list, "Film", film.name);
        addInfoRow(list, "ISO / ASA", film.iso);
        addInfoRow(list, "Film format", film.formats);
        addInfoRow(list, "Type / emulsion", film.colour);
        addInfoRow(list, "Lab process", getProcess(film));
        addInfoRow(list, "DX code", film.dx);
        addInfoRow(list, "Country", film.country);
        addInfoRow(list, "Years produced", film.date);

        const availability = addInfoRow(list, "Availability", "");
        const badge = document.createElement("span");
        badge.classList.add("badge");
        badge.textContent = getStatus(film);
        availability.replaceChildren(badge);

        addInfoRow(list, "Notes", film.notes);

        const sheet = addInfoRow(list, "Data sheet", "");
        if (film.dataSheet !== "") {
            sheet.replaceChildren(makeLink("Open data sheet", film.dataSheet, false));
        } else {
            sheet.textContent = "No data sheet listed";
        }

        showShopLinks(film);
        showPhotos(film);
        showLabs(film);

        message.classList.add("hidden");
        detail.classList.remove("hidden");
    }

    async function loadFilm() {
        // First try the film saved by the previous page
        const saved = sessionStorage.getItem("currentFilm");
        if (saved !== null) {
            const film = JSON.parse(saved);
            if (film.id === filmId) {
                renderDetail(film);
                return;
            }
        }

        // Otherwise load the brand again and look for the film (id = "brand|name")
        try {
            const brand = filmId.split("|")[0];
            const films = await loadBrand(brand);
            const film = films.find((item) => item.id === filmId);
            if (film === undefined) {
                throw new Error("film not found");
            }
            renderDetail(film);
        } catch (error) {
            message.textContent = "Could not load this film. Go back and search again.";
            message.classList.add("error");
        }
    }

    // Event: run when the page has finished loading
    window.addEventListener("load", loadFilm);
}


// ---------- 6. START THE RIGHT PAGE ----------
if (document.getElementById("search-form") !== null) {
    initHomePage();
}
if (document.getElementById("detail") !== null) {
    initResultPage();
}