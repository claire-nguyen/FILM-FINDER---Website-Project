
//  1. API SETTINGS 
const API_BASE = "https://thebigfilmdatabase.merinorus.com";

const API_PATHS = {
    byName: (text) => `/api/films?name=${encodeURIComponent(text)}`,
    byManufacturer: (text) => `/api/films?manufacturer=${encodeURIComponent(text)}`,
    byDx: (code) => `/api/films?dx_full=${encodeURIComponent(code)}`,
    detail: (id) => `/api/films/${encodeURIComponent(id)}`
};


//  2. LIGHT / DARK MODE TOGGLE (both pages)
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


//  3. HELPER FUNCTIONS (both pages) 

// Request data from an API and return it as a JavaScript object
async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }
    return await response.json();
}

// The API may return an array, or an object that contains an array
function getList(data) {
    if (Array.isArray(data)) {
        return data;
    }
    for (const key of ["results", "items", "films", "data"]) {
        if (Array.isArray(data[key])) {
            return data[key];
        }
    }
    return [];
}

// Return the first field that has a value (API field names may differ)
function getField(obj, names) {
    for (const name of names) {
        const value = obj[name];
        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }
    return "";
}

// Turn one API film into a simple object we control
function normalizeFilm(raw) {
    let image = getField(raw, ["image", "image_url", "img", "picture", "box_image", "photo"]);
    if (image !== "" && !image.startsWith("http")) {
        image = API_BASE + (image.startsWith("/") ? "" : "/") + image;
    }

    return {
        id: getField(raw, ["slug", "id", "film_id", "uid"]),
        name: getField(raw, ["name", "title", "model", "film_name"]),
        manufacturer: getField(raw, ["manufacturer", "brand", "make", "distributor"]),
        emulsion: getField(raw, ["emulsion", "suspected_emulsion", "chemistry", "information", "info"]),
        format: getField(raw, ["format", "film_format"]),
        exposures: getField(raw, ["exposures", "exposure", "nb_exposures"]),
        availability: getField(raw, ["availability", "available", "status"]),
        dx: getField(raw, ["dx_full", "dx_code", "dx", "dx_extract"]),
        beginYear: getField(raw, ["begin_year", "beginning_year", "start_year"]),
        endYear: getField(raw, ["end_year", "ending_year"]),
        image: image
    };
}

// Save the chosen film, then go to the result page
function openResultPage(film) {
    sessionStorage.setItem("currentFilm", JSON.stringify(film));
    window.location.href = `result.html?id=${encodeURIComponent(film.id || film.name)}`;
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

    // Render function: state -> user interface
    function renderFilms() {
        // Step 1: clear the old cards
        resultsBox.replaceChildren();

        // Step 2: loop through the state
        for (const film of films) {
            // Step 3: create elements
            const card = document.createElement("article");
            card.classList.add("film-card");
            card.setAttribute("tabindex", "0");

            const title = document.createElement("h3");
            title.textContent = film.name || "Untitled film";

            const maker = document.createElement("p");
            maker.classList.add("card-maker");
            maker.textContent = film.manufacturer || "Unknown manufacturer";

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

    // ----- Search -----
    // Event: submit the search form
    searchForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const type = searchType.value;
        const text = searchInput.value.trim();
        let path = "";

        if (text === "") {
            showMessage("Please type something to search.", true);
            return;
        }

        if (type === "dx") {
            const digits = text.replace(/\D/g, "");   // keep digits only
            if (digits.length !== 6) {
                showMessage("A DX code must have exactly 6 digits.", true);
                return;
            }
            path = API_PATHS.byDx(digits);
        } else if (type === "manufacturer") {
            path = API_PATHS.byManufacturer(text);
        } else {
            path = API_PATHS.byName(text);
        }

        showMessage("Searching...", false);

        try {
            const data = await fetchJson(API_BASE + path);
            films = getList(data).map(normalizeFilm);
            renderFilms();

            if (films.length === 0) {
                showMessage("No films found. Try fewer words.", false);
            } else {
                showMessage(`Found ${films.length} film(s). Click one to see details.`, false);
            }
        } catch (error) {
            films = [];
            renderFilms();
            showMessage(`Could not reach the film database (${error.message}). Check API_PATHS in app.js.`, true);
        }
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

    // Each weather group suggests search keywords (mostly film speed / style)
    function getIdeas(group) {
        switch (group) {
            case "clear":
                return { label: "Sunny", keywords: ["100", "200", "Ektar", "Velvia"] };
            case "cloudy":
                return { label: "Cloudy", keywords: ["400", "Portra", "Superia"] };
            case "fog":
                return { label: "Foggy", keywords: ["HP5", "Tri-X", "400"] };
            case "rain":
                return { label: "Rainy", keywords: ["800", "Portra 800", "Cinestill"] };
            case "snow":
                return { label: "Snowy", keywords: ["200", "Ektar", "Pro Image"] };
            case "storm":
                return { label: "Stormy", keywords: ["800", "3200", "T-Max"] };
            default:
                return { label: "Night", keywords: ["800", "1600", "3200", "Cinestill"] };
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

            // Collect candidate films from every keyword
            let pool = [];
            for (const keyword of ideas.keywords) {
                try {
                    const data = await fetchJson(API_BASE + API_PATHS.byName(keyword));
                    pool = pool.concat(getList(data).map(normalizeFilm));
                } catch (error) {
                    // skip a keyword that fails and try the next one
                }
            }

            // Prefer films that are not discontinued
            let candidates = pool.filter((film) => {
                return film.name !== "" && !String(film.availability).toLowerCase().includes("discontinued");
            });
            if (candidates.length === 0) {
                candidates = pool.filter((film) => film.name !== "");
            }
            if (candidates.length === 0) {
                showMessage("No films returned by the API. Check API_PATHS in app.js.", true);
                return;
            }

            // Remove films this user has already seen, so each press is different
            let seen = getSeenList();
            let fresh = candidates.filter((film) => !seen.includes(film.id || film.name));
            if (fresh.length === 0) {
                seen = [];            // everything was seen: start a new round
                fresh = candidates;
            }

            const picked = fresh[Math.floor(Math.random() * fresh.length)];
            seen.push(picked.id || picked.name);
            localStorage.setItem("seenFilms", JSON.stringify(seen));

            showMessage(`Today's pick: ${picked.name}`, false);
            openResultPage(picked);
        } catch (error) {
            showMessage(`Something went wrong (${error.message}).`, true);
        } finally {
            randomButton.disabled = false;
        }
    });
}


// ==========================================================
// 5. RESULT PAGE (result.html)
// ==========================================================
function initResultPage() {
    const params = new URLSearchParams(window.location.search);
    const filmId = params.get("id");

    const message = document.getElementById("message");
    const detail = document.getElementById("detail");

    // Guess the lab process from the film name / emulsion text
    function guessProcess(film) {
        const text = `${film.name} ${film.emulsion}`.toLowerCase();

        if (/e-?6|slide|reversal|velvia|provia|ektachrome/.test(text)) {
            return "E-6 (slide film)";
        }
        if (/ecn|motion picture|vision3|500t|250d|50d/.test(text)) {
            return "ECN-2 (motion picture film)";
        }
        if (/b&w|bw|black|hp5|tri-x|t-max|tmax|delta|fp4|apx|acros|neopan|pan f|xp2/.test(text)) {
            return "Black & white";
        }
        return "C-41 (colour negative)";
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
        const query = encodeURIComponent(`${film.name} film`);
        document.getElementById("price-note").textContent =
            "This database does not list prices, so check live prices and stock at these shops:";

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
        const query = encodeURIComponent(film.name);

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
        const process = guessProcess(film);
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
        document.getElementById("film-title").textContent = film.name;

        // Package image
        const imageBox = document.getElementById("image-box");
        const showPlaceholder = () => {
            const placeholder = document.createElement("div");
            placeholder.classList.add("no-image");
            placeholder.textContent = "No package image available for this film";
            imageBox.replaceChildren(placeholder);
        };

        if (film.image !== "") {
            const image = document.createElement("img");
            image.classList.add("package-img");
            image.src = film.image;
            image.alt = `Package of ${film.name}`;
            image.addEventListener("error", showPlaceholder);   // event: image failed to load
            imageBox.appendChild(image);
        } else {
            showPlaceholder();
        }

        // Info list
        const list = document.getElementById("info-list");
        const years = (film.beginYear || film.endYear)
            ? `${film.beginYear || "?"} - ${film.endYear || "present"}`
            : "";

        addInfoRow(list, "Manufacturer", film.manufacturer);
        addInfoRow(list, "Emulsion / chemistry", film.emulsion);
        addInfoRow(list, "Lab process", guessProcess(film));
        addInfoRow(list, "Film format", film.format || "35mm (135)");
        addInfoRow(list, "Exposures", String(film.exposures));
        addInfoRow(list, "DX code", String(film.dx));
        addInfoRow(list, "Years produced", years);

        const availability = addInfoRow(list, "Availability", "");
        if (film.availability !== "") {
            const badge = document.createElement("span");
            badge.classList.add("badge");
            badge.textContent = String(film.availability);
            availability.replaceChildren(badge);
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
            if (String(film.id || film.name) === filmId) {
                renderDetail(film);
                return;
            }
        }

        // Otherwise ask the API again
        try {
            const data = await fetchJson(API_BASE + API_PATHS.detail(filmId));
            renderDetail(normalizeFilm(data));
        } catch (error) {
            message.textContent = "Could not load this film. Go back and search again.";
            message.classList.add("error");
        }
    }

    // Event: run when the page has finished loading
    window.addEventListener("load", loadFilm);
}


//  6. START THE RIGHT PAGE 
if (document.getElementById("search-form") !== null) {
    initHomePage();
}
if (document.getElementById("detail") !== null) {
    initResultPage();
}