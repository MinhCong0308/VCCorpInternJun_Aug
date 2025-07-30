module.exports = {
    extractCoverImage: (content) => {
        const imgRegex = /<img[^>]+src="([^">]+)"/;
        const match = content?.match(imgRegex);
        return match ? match[1] : null;
    }
};

