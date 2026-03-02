import { fuzzyMatch, formatUrl, getProgramFromUrl } from "./helpers.js";

let createWebringList = (matchedSiteIndices, hasSearchTerm = false) => {
  const webringList = document.getElementById("webring-list");
  webringList.innerHTML = "";

  let firstHighlightedItem = null;

  window.webringData.sites.forEach((site, index) => {
    const displayUrl = formatUrl(site.website);

    const listItem = document.createElement("div");
    listItem.className = "grid grid-cols-12 sm:grid-cols-6 gap-2 sm:gap-4";
    const isSearchItem = hasSearchTerm && matchedSiteIndices.includes(index);
    if (isSearchItem) {
      listItem.className += " bg-mustard-500";
    }

    if (firstHighlightedItem === null && isSearchItem) {
      firstHighlightedItem = listItem;
    }

    const name = document.createElement("span");
    name.className = "col-span-5 sm:col-span-2 font-monospace truncate";
    name.textContent = site.name;
    if (isSearchItem) {
      name.className += " text-mustard-100"
    }

    const year = document.createElement("span");
    year.className = "col-span-2 sm:col-span-1 text-right font-monospace";
    year.textContent = site.year;
    if (isSearchItem) {
      year.className += " text-mustard-100"
    }

    const link = document.createElement("a");
    link.href = site.website;
    link.className =
      "col-span-4 sm:col-span-2 font-monospace underline truncate";
    link.textContent = displayUrl;
    if (isSearchItem) {
      link.className += " text-mustard-100"
    } else {
      link.className += " text-info-grey"
    }

    const spacer = document.createElement("span");
    spacer.className = "col-span-1 sm:col-span-1";

    listItem.appendChild(name);
    listItem.appendChild(year);
    listItem.appendChild(spacer);
    listItem.appendChild(link);
    webringList.appendChild(listItem);
  });

  // Only scroll if there's a highlighted item
  if (firstHighlightedItem) {
    setTimeout(() => {
      firstHighlightedItem.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }
};
function filterWebring(searchTerm) {
  const searchLower = searchTerm.toLowerCase().trim();
  const hasSearchTerm = searchLower.length > 0;
  const matchedSiteIndices = [];
  window.webringData.sites.forEach((site, index) => {
    if (!hasSearchTerm) {
      matchedSiteIndices.push(index);
      return;
    }
    const nameMatch = site.name && site.name.toLowerCase().includes(searchLower);
    const websiteMatch = site.website && fuzzyMatch(site.website.toLowerCase(), searchLower);
    const yearMatch = site.year != null && site.year.toString().includes(searchLower);
    if (nameMatch || websiteMatch || yearMatch) {
      matchedSiteIndices.push(index);
    }
  });
  createWebringList(matchedSiteIndices, hasSearchTerm);
}
let navigateWebring = () => {
  const fragment = window.location.hash.slice(1); // #your-site-here?nav=
  if (!fragment.includes("?")) return;

  const [currentSite, query] = fragment.split("?");
  const params = new URLSearchParams(query);
  const nav = params.get("nav");
  const navTrimmed = nav ? nav.replace(/\/+$/, "").trim() : "";
  if (!nav || !["next", "prev"].includes(navTrimmed)) return;

  const match = window.webringData.sites.filter((site) =>
    fuzzyMatch(currentSite, site.website)
  );
  if (match.length === 0) return;
  if (match.length > 1) {
    throw new Error(
      `Cannot calculate navigation state because mutiple URLs matched ${currentSite}`
    );
  }

  const currIndex = window.webringData.sites.findIndex((site) =>
    fuzzyMatch(currentSite, site.website)
  );
  const increment = navTrimmed === "next" ? 1 : -1;
  let newIndex = (currIndex + increment) % window.webringData.sites.length;
  if (newIndex < 0) newIndex = window.webringData.sites.length - 1;
  if (!window.webringData.sites[newIndex]) return;

  document.body.innerHTML = `
  <main class="p-6 min-h-[100vh] w-[100vw] text-black-900">
    <p class="font-latinMonoCondOblique">redirecting...</p>
  </main>
  `;
  window.__webringNavigating = true;
  window.location.replace(window.webringData.sites[newIndex].website);
};

function init() {
  if (window.location.hash.includes("?nav=")) {
    navigateWebring();
  }
  const searchInput = document.getElementById("search");

  const program = getProgramFromUrl();
  const title = document.getElementById("webring-title");
  if (title) {
    title.textContent = `QUEENSU-WEBRING/${program.toUpperCase()}`;
  }
  const logo = document.getElementById("webring-logo");
  if (logo) {
    logo.src = `./assets/icons/${program}/icon-white.png`;
    // logo.setAttribute("data-model", `./assets/model/${program}_webring_logo.gltf`);
  }

  const info = document.getElementById("webring-info");
  if (info) {
    const count = window.webringData.sites.length;
    if (count === 0) {
      info.textContent = `This webring has no members yet. Be the first to join!`;
    } else {
      info.textContent = `This webring consists of ${count} member${count !== 1 ? 's' : ''}. It was last updated on January 29, 2026.`;
    }
  }

  createWebringList(window.webringData.sites.map((_, i) => i));

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filterWebring(e.target.value);
    });
  }

  window.addEventListener("hashchange", navigateWebring);
}

// Run immediately if DOM is ready, otherwise wait for it
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
