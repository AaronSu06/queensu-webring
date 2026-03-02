// remove protocol, www, trailing slashes and www. from a url
const formatUrl = (url) => {
    return url
      .replace(/^https?:\/\/(www\.)?/, "")
      .replace(/\/$/, "")
      .replace(/^www\./, "");
};

const RING_PROGRAMS = new Set(["cs", "eng", "bcom", "other"]);

const getProgramFromUrl = () => {
    const pathSegment = window.location.pathname
      .replace(/\/+$/, "")
      .split("/")
      .pop()
      .toLowerCase();
    if (RING_PROGRAMS.has(pathSegment)) {
      return pathSegment;
    }

    const queryProgram = new URLSearchParams(window.location.search)
      .get("ring")
      ?.toLowerCase();
    if (queryProgram && RING_PROGRAMS.has(queryProgram)) {
      return queryProgram;
    }

    const hashSegment = window.location.hash
      .replace(/^#/, "")
      .split("?")[0]
      .toLowerCase();
    if (RING_PROGRAMS.has(hashSegment)) {
      return hashSegment;
    }

    return "cs";
};

// search for website urls within tolerance of protocol, subdomain and trailing slashes
const fuzzyMatch = (searchTerm, target) => {
    const searchTermFormatted = formatUrl(searchTerm);
    const targetFormatted = formatUrl(target);
    return searchTermFormatted.includes(targetFormatted) || targetFormatted.includes(searchTermFormatted);
};

export { fuzzyMatch, formatUrl, getProgramFromUrl };
