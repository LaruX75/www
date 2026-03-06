module.exports = {
    layout: "page.njk",
    tags: "politics",
    lang: "fi",
    permalink: function (data) {
        const d = data.page.date;
        if (!d) return `/${data.page.fileSlug}/`;

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return `/${y}/${m}/${day}/${data.page.fileSlug}/`;
    }
};
