// ==========================================================
// filmfinder.js - ONE JavaScript file for index.html and results.html
// Data: The Big Film Database API  (https://thebigfilmdatabase.merinorus.com/docs)
// Pattern from class: application state -> render function -> DOM
// ==========================================================


// ---------- 1. SETTINGS ----------
const API_BASE = "https://thebigfilmdatabase.merinorus.com";

// The API does not allow other websites to read it (no CORS), so we try a direct
// request first, then two public proxies. Edit this list if a proxy stops working.
const PROXIES = [
    "",
    "https://api.allorigins.win/raw?url=",
    "https://api.codetabs.com/v1/proxy?quest="
];

// Common film speeds (ISO). Used to read the speed from a film name like "Portra 400".
const ISO_VALUES = [25, 50, 64, 80, 100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1600, 3200];

// ==========================================================
// >>> ADD YOUR OWN FILM IMAGES HERE <<<
// Put the pictures in the folder "images" (next to index.html).
// File name = film name in lowercase, spaces and symbols become "-", ending in .jpg
//   Film "Kodak Portra 400"  ->  images/kodak-portra-400.jpg
// If the file exists, the site shows it. If not, it uses the picture from the database.
// Set USE_LOCAL_IMAGES to false to switch this off.
// ==========================================================
const USE_LOCAL_IMAGES = true;
const IMAGE_FOLDER = "images/";
const IMAGE_EXTENSION = ".jpg";


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

// Go to another page (a function, so it is easy to test)
function goTo(url) {
    window.location.href = url;
}

// Request JSON from any API (weather, sample photos)
async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }
    return await response.json();
}

// Request JSON from the film database. Direct first, then each proxy.
// Answers are saved in sessionStorage so the same search is instant the 2nd time
// (the API only allows 30 requests every 30 seconds).
async function fetchApi(path, useCache) {
    const cacheName = `api:${path}`;
    if (useCache) {
        const cached = sessionStorage.getItem(cacheName);
        if (cached !== null) {
            return JSON.parse(cached);
        }
    }

    const url = API_BASE + path;
    let lastError = new Error("no attempt");

    for (const proxy of PROXIES) {
        const fullUrl = proxy === "" ? url : proxy + encodeURIComponent(url);
        try {
            const response = await fetch(fullUrl);
            if (response.status === 429) {
                throw new Error("too many requests, please wait 30 seconds");
            }
            if (!response.ok) {
                throw new Error(`status ${response.status}`);
            }
            const data = await response.json();
            if (data.data === undefined) {
                throw new Error("unexpected answer");
            }
            if (useCache) {
                try {
                    sessionStorage.setItem(cacheName, JSON.stringify(data));
                } catch (error) {
                    // storage full: skip caching
                }
            }
            return data;
        } catch (error) {
            lastError = error;   // try the next proxy
        }
    }
    throw new Error(`could not load the film database (${lastError.message})`);
}

// Turn one film from the API into a simple object we control
function normalizeFilm(raw) {
    return {
        id: raw.url_name,
        name: raw.name,
        info: raw.og_film_or_information || "",
        reliability: raw.reliability || 0,
        manufacturer: raw.manufacturer || "",
        country: raw.country || "",
        beginYear: raw.begin_year || "",
        endYear: raw.end_year || "",
        distributor: raw.distributor || "",
        availability: raw.availability === undefined || raw.availability === null ? 1 : raw.availability,
        dxExtract: raw.dx_extract || "",
        dxFull: raw.dx_full || "",
        image: raw.picture || ""
    };
}

// DX extract 1533 -> DX number "95-13" (same rule as the database)
function getDxNumber(dxExtract) {
    const number = parseInt(dxExtract, 10);
    if (isNaN(number) || number < 16 || number > 2047) {
        return "";
    }
    return `${Math.floor(number / 16)}-${number % 16}`;
}

// The database uses 0 = discontinued, 1 = unknown, 2 or 3 = on the market
function isAvailable(film) {
    return film.availability >= 2;
}

function getStatusText(film) {
    if (film.availability >= 2) {
        return "on the market";
    }
    if (film.availability === 0) {
        return "discontinued";
    }
    return "unknown";
}

// A rounded label: filled = on the market, outlined = not available
function makeStatusBadge(film) {
    const badge = document.createElement("span");
    badge.classList.add("status");
    if (isAvailable(film)) {
        badge.classList.add("status-on");
    }
    badge.textContent = getStatusText(film);
    return badge;
}

// First common ISO number found in the film name: "Kodak Portra 400 new" -> 400
function getIsoNumber(film) {
    const numbers = film.name.match(/\d+/g) || [];
    for (const text of numbers) {
        if (ISO_VALUES.includes(parseInt(text, 10))) {
            return parseInt(text, 10);
        }
    }
    return 0;
}

function isBlackAndWhite(film) {
    return /b&w|black|\bbw|hp5|tri-x|t-max|tmax|delta|fp4|apx|acros|neopan|pan f|xp2|fomapan/i.test(`${film.name} ${film.info}`);
}

// Lab process, guessed from the film name / emulsion text
function getProcess(film) {
    const text = `${film.name} ${film.info}`.toLowerCase();

    if (/slide|reversal|velvia|provia|ektachrome|e-6/.test(text)) {
        return "E-6";
    }
    if (/ecn|motion picture|vision3/.test(text)) {
        return "ECN-2";
    }
    if (isBlackAndWhite(film)) {
        return "Black & white";
    }
    return "C-41";
}

// Remember a film so the detail view does not need to ask the API again
function saveCurrentFilm(film) {
    sessionStorage.setItem("currentFilm", JSON.stringify(film));
}

function openFilmPage(film) {
    saveCurrentFilm(film);
    goTo(`results.html?film=${encodeURIComponent(film.id)}`);
}

// Film name -> local image path: "Kodak Portra 400" -> "images/kodak-portra-400.jpg"
function getLocalImage(film) {
    const slug = film.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return IMAGE_FOLDER + slug + IMAGE_EXTENSION;
}

// Make an <img> for a film: your own image first, then the database picture,
// then onFail() is called (for example to show a placeholder)
function makeFilmImage(film, className, altText, onFail) {
    const image = document.createElement("img");
    image.classList.add(className);
    image.alt = altText;

    let triedDatabase = false;
    if (USE_LOCAL_IMAGES) {
        image.src = getLocalImage(film);
    } else {
        triedDatabase = true;
        image.src = film.image;
    }

    // Event: the image failed to load -> try the next source
    image.addEventListener("error", () => {
        if (!triedDatabase && film.image !== "") {
            triedDatabase = true;
            image.src = film.image;
        } else {
            onFail();
        }
    });
    return image;
}

// Create a rounded button-style link
function makeLink(text, url, isPrimary) {
    const link = document.createElement("a");
    link.classList.add("button");
    if (!isPrimary) {
        link.classList.add("button-outline");
    }
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = text;
    return link;
}


// ==========================================================
// 4. HOME PAGE (index.html): search form + Today's film
// ==========================================================
function initHomePage() {
    const searchForm = document.getElementById("search-form");
    const searchType = document.getElementById("search-type");
    const searchInput = document.getElementById("search-input");
    const randomButton = document.getElementById("random-button");
    const weatherText = document.getElementById("weather-text");
    const weatherTip = document.getElementById("weather-tip");
    const message = document.getElementById("message");

    // Application state: today's weather ideas (null until the weather is loaded)
    let weatherIdeas = null;

    function showMessage(text, isError) {
        message.textContent = text;
        message.classList.toggle("error", isError);
    }

    // ----- Search -----
    // Event: submit the search form -> go to results.html
    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const type = searchType.value;
        const text = searchInput.value.trim();

        if (text === "") {
            showMessage("Please type something to search.", true);
            return;
        }

        if (type === "dx") {
            const digits = text.replace(/\D/g, "");
            const isDxNumber = /^\d{1,3}\s*-\s*\d{1,2}$/.test(text);
            if (!isDxNumber && digits.length !== 4 && digits.length !== 6) {
                showMessage("Type a 6-digit DX code, a 4-digit extract, or a DX number like 87-7.", true);
                return;
            }
        }

        goTo(`results.html?type=${type}&q=${encodeURIComponent(text)}`);
    });

    // Event: typing in the search box clears an old error
    searchInput.addEventListener("input", () => {
        if (message.classList.contains("error")) {
            showMessage("", false);
        }
    });

    // Event: changing the search type updates the placeholder
    searchType.addEventListener("change", () => {
        switch (searchType.value) {
            case "dx":
                searchInput.placeholder = "e.g. 013994";
                break;
            case "manufacturer":
                searchInput.placeholder = "e.g. Kodak";
                break;
            default:
                searchInput.placeholder = "e.g. Kodak Portra 400";
        }
    });

    // Event: press "/" anywhere to jump to the search box
    document.addEventListener("keydown", (event) => {
        if (event.key === "/" && document.activeElement !== searchInput) {
            event.preventDefault();
            searchInput.focus();
        }
    });

    // ----- Weather -----

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
                return { label: "Sunny", minIso: 25, maxIso: 200, blackAndWhite: false, tip: "Plenty of light: a slow film (ISO 25-200) gives fine grain." };
            case "cloudy":
                return { label: "Cloudy", minIso: 200, maxIso: 400, blackAndWhite: false, tip: "Soft light: a medium film (ISO 200-400) is a safe choice." };
            case "fog":
                return { label: "Foggy", minIso: 100, maxIso: 800, blackAndWhite: true, tip: "Moody light: black & white film (ISO 100-800) suits fog." };
            case "rain":
                return { label: "Rainy", minIso: 400, maxIso: 800, blackAndWhite: false, tip: "Dark and wet: a faster film (ISO 400-800) helps." };
            case "snow":
                return { label: "Snowy", minIso: 100, maxIso: 200, blackAndWhite: false, tip: "Bright snow: a slow film (ISO 100-200) avoids over-exposure." };
            case "storm":
                return { label: "Stormy", minIso: 400, maxIso: 3200, blackAndWhite: false, tip: "Very dark sky: use a fast film (ISO 400-3200)." };
            default:
                return { label: "Night", minIso: 800, maxIso: 3200, blackAndWhite: false, tip: "Low light: use a fast film (ISO 800-3200)." };
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

    // Load today's weather and show it inside the "Today's film" box
    async function showWeather() {
        try {
            const place = await getLocation();
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current=temperature_2m,weather_code,is_day`;
            const data = await fetchJson(url);

            weatherIdeas = getIdeas(getWeatherGroup(data.current.weather_code, data.current.is_day));

            weatherText.replaceChildren();
            const tag = document.createElement("span");
            tag.classList.add("tag");
            tag.textContent = weatherIdeas.label;
            weatherText.append(tag, ` ${data.current.temperature_2m}°C at ${place.name}`);
            weatherTip.textContent = weatherIdeas.tip;
        } catch (error) {
            weatherText.textContent = "Could not load today's weather.";
            weatherTip.textContent = "The random button will pick any film that is on the market.";
        }
    }

    // ----- Random film (only films that are on the market) -----

    // Films already suggested to this user (so we never repeat)
    function getSeenList() {
        return JSON.parse(localStorage.getItem("seenFilms") || "[]");
    }

    // Does this film fit today's weather? (true for every film if the weather is unknown)
    function fitsWeather(film) {
        if (weatherIdeas === null) {
            return true;
        }
        const iso = getIsoNumber(film);
        const fitsIso = iso >= weatherIdeas.minIso && iso <= weatherIdeas.maxIso;
        const fitsColour = weatherIdeas.blackAndWhite ? isBlackAndWhite(film) : true;
        return fitsIso && fitsColour;
    }

    // Event: click the random button
    randomButton.addEventListener("click", async () => {
        randomButton.disabled = true;
        showMessage("Looking for an available film...", false);

        try {
            if (weatherIdeas === null) {
                await showWeather();
            }

            const seen = getSeenList();
            const pool = [];      // available films, not seen yet
            let fitting = [];     // the ones that also fit the weather

            // Ask for random films (up to 3 times) until one fits the weather
            for (let attempt = 0; attempt < 3 && fitting.length === 0; attempt++) {
                const data = await fetchApi("/api/random?limit=101", false);
                for (const raw of data.data) {
                    const film = normalizeFilm(raw);
                    const isNew = !seen.includes(film.id) && !pool.some((item) => item.id === film.id);
                    if (isAvailable(film) && isNew) {
                        pool.push(film);
                    }
                }
                fitting = pool.filter(fitsWeather);
            }

            if (pool.length === 0) {
                showMessage("No new available film found. Press the button again.", true);
                return;
            }

            const choices = fitting.length > 0 ? fitting : pool;
            const picked = choices[Math.floor(Math.random() * choices.length)];

            seen.push(picked.id);
            localStorage.setItem("seenFilms", JSON.stringify(seen));

            // The results page shows this note at the top
            let note = "Today's film: on the market";
            if (weatherIdeas !== null) {
                note += fitting.length > 0
                    ? ` and chosen for ${weatherIdeas.label.toLowerCase()} weather.`
                    : `. No available film matched ${weatherIdeas.label.toLowerCase()} weather exactly, so this is a random one.`;
            }
            sessionStorage.setItem("pickNote", note);

            openFilmPage(picked);
        } catch (error) {
            showMessage(`Something went wrong: ${error.message}.`, true);
        } finally {
            randomButton.disabled = false;
        }
    });

    // Event: when the page is ready, load the weather
    window.addEventListener("load", showWeather);
}


// ==========================================================
// 5. RESULTS PAGE (results.html): list view + detail view
// ==========================================================
function initResultsPage() {
    const params = new URLSearchParams(window.location.search);
    const filmId = params.get("film");
    const searchType = params.get("type") || "name";
    const searchText = params.get("q") || "";

    const message = document.getElementById("message");
    const listView = document.getElementById("list-view");
    const detailView = document.getElementById("detail");

    function showError(text) {
        message.textContent = text;
        message.classList.add("error");
    }

    // ---------- VIEW 1: list of results ----------

    // Build the API address for the chosen search type
    function buildSearchPath(type, text) {
        const encoded = encodeURIComponent(text);

        if (type === "manufacturer") {
            return `/api/search?manufacturer=${encoded}&limit=100`;
        }
        if (type === "dx") {
            const digits = text.replace(/\D/g, "");
            if (/^\d{1,3}\s*-\s*\d{1,2}$/.test(text)) {
                return `/api/search?dx_number=${encoded}&limit=100`;
            }
            if (digits.length === 6) {
                return `/api/search?dx_full=${digits}&limit=100`;
            }
            if (digits.length === 4) {
                return `/api/search?dx_extract=${digits}&limit=100`;
            }
            return "";
        }
        return `/api/search?name=${encoded}&limit=100`;
    }

    // Write one "Label: value" line (skipped when there is no value)
    function addLine(parent, label, value) {
        if (value === "") {
            return null;
        }
        const line = document.createElement("p");
        line.classList.add("line");

        const strong = document.createElement("strong");
        strong.textContent = `${label}: `;
        line.append(strong, value);
        parent.appendChild(line);
        return line;
    }

    // Render function: state (films) -> list of cards
    function renderFilmList(films) {
        const list = document.getElementById("film-list");
        list.replaceChildren();

        for (const film of films) {
            const card = document.createElement("article");
            card.classList.add("result-card");

            // Top: featured package image (your own file first, then the database picture)
            const imageBox = document.createElement("div");
            imageBox.classList.add("result-image");

            const image = makeFilmImage(film, "pack-img", film.name, () => imageBox.remove());
            image.loading = "lazy";
            imageBox.appendChild(image);
            card.appendChild(imageBox);

            // Text under the image
            const textBox = document.createElement("div");
            textBox.classList.add("result-text");

            const title = document.createElement("h3");
            const link = document.createElement("a");
            link.href = `results.html?film=${encodeURIComponent(film.id)}`;
            link.textContent = film.name;
            link.addEventListener("click", () => saveCurrentFilm(film));   // event: open details
            title.appendChild(link);
            textBox.appendChild(title);

            const certitude = film.reliability > 0 ? ` (certitude ${film.reliability}/4)` : "";
            addLine(textBox, "Information / Suspected emulsion", film.info === "" ? "" : film.info + certitude);
            addLine(textBox, "DX number", getDxNumber(film.dxExtract));
            addLine(textBox, "DX extract", film.dxExtract);
            addLine(textBox, "DX full code", film.dxFull);
            addLine(textBox, "Manufacturer", film.manufacturer);
            addLine(textBox, "Origin", film.country);
            addLine(textBox, "Beginning year", film.beginYear);
            addLine(textBox, "End year", film.endYear);
            addLine(textBox, "Distributor", film.distributor);

            const availability = addLine(textBox, "Availability", "x");
            availability.lastChild.remove();          // remove the placeholder "x"
            availability.appendChild(makeStatusBadge(film));

            card.appendChild(textBox);

            list.appendChild(card);
        }
    }

    async function showListPage() {
        const path = buildSearchPath(searchType, searchText);
        if (searchText === "" || path === "") {
            showError("Nothing to search. Go back and type a film name, a manufacturer or a DX code.");
            return;
        }

        sessionStorage.setItem("lastSearch", window.location.search);   // for the "Back" button
        document.title = `Results for ${searchText} - Film Finder`;

        try {
            const data = await fetchApi(path, true);
            const films = data.data.map(normalizeFilm);

            let label = `“${searchText}”`;
            if (searchType === "dx") {
                label = `DX code: ${searchText}`;
            } else if (searchType === "manufacturer") {
                label = `manufacturer: ${searchText}`;
            }

            document.getElementById("result-title").textContent = `Results for ${label}.`;
            document.getElementById("result-count").textContent = films.length === 0
                ? "Found 0 films."
                : `Found ${films.length} films. Showing 1–${films.length}.`;

            renderFilmList(films);
            if (films.length === 0) {
                message.textContent = "No results found. Try one or two words only.";
            } else {
                message.classList.add("hidden");
            }
            listView.classList.remove("hidden");
        } catch (error) {
            showError(`Something went wrong: ${error.message}.`);
        }
    }

    // ---------- VIEW 2: details of one film ----------

    function addInfoRow(list, label, value) {
        const row = document.createElement("div");
        row.classList.add("info-row");

        const term = document.createElement("dt");
        term.textContent = label;

        const description = document.createElement("dd");
        description.textContent = value || "Not listed";

        row.append(term, description);
        list.appendChild(row);
        return description;
    }

    function showShopLinks(film) {
        const query = encodeURIComponent(`${film.name} film`);
        document.getElementById("price-note").textContent = isAvailable(film)
            ? "On the market. The database has no prices, so check live prices here:"
            : "Not on the market. The database has no prices, so look for old stock here:";

        document.getElementById("shop-links").append(
            makeLink("Google Shopping", `https://www.google.com/search?tbm=shop&q=${query}`, true)
        );
    }

    // Ask Wikimedia Commons for photos that match a search text
    async function findPhotos(search) {
        const query = encodeURIComponent(search);
        const url = "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
            `&gsrsearch=${query}&gsrnamespace=6&gsrlimit=8&prop=imageinfo` +
            "&iiprop=url&iiurlwidth=400&format=json&origin=*";

        const data = await fetchJson(url);
        const pages = data.query ? Object.values(data.query.pages) : [];
        const photos = [];

        for (const page of pages) {
            const info = page.imageinfo ? page.imageinfo[0] : null;
            if (info && /\.(jpe?g|png)$/i.test(page.title)) {
                photos.push({ title: page.title, image: info.thumburl, source: info.descriptionurl });
            }
        }
        return photos;
    }

    // Sample photos: any photo is fine, each one has a small source line under it
    async function showPhotos(film) {
        const note = document.getElementById("gallery-note");
        const gallery = document.getElementById("gallery");

        try {
            let photos = await findPhotos(film.name);
            let isGeneral = false;

            // Nothing found for this film: show general analog film photos instead
            if (photos.length === 0) {
                photos = await findPhotos("35mm film photograph");
                isGeneral = true;
            }

            for (const photo of photos) {
                const figure = document.createElement("figure");

                const image = document.createElement("img");
                image.src = photo.image;
                image.alt = `Sample photo: ${photo.title}`;
                image.loading = "lazy";

                // Small source line
                const caption = document.createElement("figcaption");
                const source = document.createElement("a");
                source.href = photo.source;
                source.target = "_blank";
                source.rel = "noopener";
                source.textContent = "Source: Wikimedia Commons";
                caption.appendChild(source);

                figure.append(image, caption);
                gallery.appendChild(figure);
            }

            if (photos.length === 0) {
                note.textContent = "No sample photos found.";
            } else if (isGeneral) {
                note.textContent = "No photos found for this exact film, so these are general analog film photos.";
            } else {
                note.textContent = "Sample photos found for this film name.";
            }
        } catch (error) {
            note.textContent = "Could not load sample photos.";
        }
    }

    function showLabs(film) {
        const process = getProcess(film);
        document.getElementById("lab-note").textContent =
            `This film needs ${process} processing. Ask the lab if they develop it before you send it in.`;

        document.getElementById("lab-links").append(
            makeLink("Find your nearest lab", "https://www.google.com/maps/search/film+developing+lab+near+me", true)
        );
    }

    // Render function for the detail view
    function renderDetail(film) {
        document.title = `${film.name} - Film Finder`;
        document.getElementById("film-title").textContent = film.name;

        // "Back" button goes to the last search
        const lastSearch = sessionStorage.getItem("lastSearch");
        if (lastSearch !== null) {
            document.getElementById("back-link").href = `results.html${lastSearch}`;
        }

        // Note from the "Today's film" button
        const pickNote = sessionStorage.getItem("pickNote");
        if (pickNote !== null) {
            const noteBox = document.getElementById("pick-note");
            noteBox.textContent = pickNote;
            noteBox.classList.remove("hidden");
            sessionStorage.removeItem("pickNote");
        }

        // Package image (your own file first, then the database picture, then a placeholder)
        const imageBox = document.getElementById("image-box");
        const showPlaceholder = () => {
            const placeholder = document.createElement("div");
            placeholder.classList.add("no-image");
            placeholder.textContent = "No package picture for this film yet.";
            imageBox.replaceChildren(placeholder);
        };
        imageBox.appendChild(makeFilmImage(film, "package-img", `Package of ${film.name}`, showPlaceholder));

        // Info list
        const list = document.getElementById("info-list");
        const years = (film.beginYear || film.endYear)
            ? `${film.beginYear || "?"} - ${film.endYear || "present"}`
            : "";
        let subtitle = film.manufacturer;
        if (years !== "") {
            subtitle = subtitle === "" ? years : `${subtitle} | ${years}`;
        }
        document.getElementById("film-subtitle").textContent = subtitle;

        const certitude = film.reliability > 0 ? ` (certitude ${film.reliability}/4)` : "";
        const hasDx = film.dxExtract !== "" || film.dxFull !== "";

        addInfoRow(list, "Manufacturer", film.manufacturer);
        addInfoRow(list, "Emulsion / chemistry", film.info === "" ? "" : film.info + certitude);
        addInfoRow(list, "Film format", hasDx ? "35mm (135, DX coded)" : "");
        addInfoRow(list, "Exposures", "Not listed. 35mm rolls are usually sold as 12, 24 or 36.");
        addInfoRow(list, "Lab process", getProcess(film));
        addInfoRow(list, "DX number", getDxNumber(film.dxExtract));
        addInfoRow(list, "DX extract", film.dxExtract);
        addInfoRow(list, "DX full code", film.dxFull);
        addInfoRow(list, "Origin", film.country);
        addInfoRow(list, "Distributor", film.distributor);
        addInfoRow(list, "Years produced", years);

        const availability = addInfoRow(list, "Availability", "");
        availability.replaceChildren(makeStatusBadge(film));

        showShopLinks(film);
        showPhotos(film);
        showLabs(film);

        message.classList.add("hidden");
        detailView.classList.remove("hidden");
    }

    async function showDetailPage() {
        // First try the film saved by the previous page
        const saved = sessionStorage.getItem("currentFilm");
        if (saved !== null) {
            const film = JSON.parse(saved);
            if (film.id === filmId) {
                renderDetail(film);
                return;
            }
        }

        // Otherwise ask the API
        try {
            const data = await fetchApi(`/api/film/${encodeURIComponent(filmId)}`, true);
            renderDetail(normalizeFilm(data.data));
        } catch (error) {
            showError("Could not load this film. Go back and search again.");
        }
    }

    // Event: when the page is ready, show the right view
    window.addEventListener("load", () => {
        if (filmId !== null) {
            showDetailPage();
        } else {
            showListPage();
        }
    });
}


// ---------- 6. START THE RIGHT PAGE ----------
if (document.getElementById("search-form") !== null) {
    initHomePage();
}
if (document.getElementById("film-list") !== null) {
    initResultsPage();
}