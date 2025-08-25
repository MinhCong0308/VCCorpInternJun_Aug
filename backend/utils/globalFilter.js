const leo = require('leo-profanity');

class GlobalFilterManager {
    constructor() {
        this.initialized = false;
        this.customBadWords = [];
    }

    initialize() {
        try {
            console.log('Initializing global bad words filter...');
            
            // Load the default dictionary
            leo.loadDictionary();
            
            // Add custom bad words if needed
            this.customBadWords = [
                'spam', 'scam', 'fraud', 'fake', 'cheat',
                'inappropriate', 'harassment', 'abuse'
            ];
            
            leo.add(this.customBadWords);
            // print the dictionary of leo
            let defaultDictionary = leo.getDictionary();
            // convert to set for better lookup performance
            this.defaultBadWordsSet = new Set(defaultDictionary);
            this.initialized = true;
            console.log(`Global filter initialized with built-in + ${this.customBadWords.length} custom bad words`);
        } catch (error) {
            console.error('Error initializing global filter:', error);
            throw new Error('Failed to initialize global bad words filter');
        }
    }

    hasBadWords(text) {
        if (!this.initialized) {
            throw new Error('Global filter not initialized');
        }
        return leo.check(text);
    }

    cleanText(text) {
        if (!this.initialized) {
            throw new Error('Global filter not initialized');
        }
        return leo.clean(text);
    }

    countBadWords(text) {
        if (!this.initialized) {
            throw new Error('Global filter not initialized');
        }
        console.log("Text is being checked: ", text);
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        let badWordCount = 0;

        words.forEach((word) => {
            if (this.defaultBadWordsSet.has(word)) {
                console.log(`Found bad word: ${word}`);
                badWordCount++;
            }
        });
        console.log(`Counted ${badWordCount} bad words in text`);
        return badWordCount;
    }

    getBadWordsDetails(text) {
        if (!this.initialized) {
            throw new Error('Global filter not initialized');
        }
        
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const badWords = [];
        const badWordPositions = [];
        
        words.forEach((word, index) => {
            if (leo.check(word)) {
                badWords.push(word);
                badWordPositions.push(index);
            }
        });
        
        return {
            count: badWords.length,
            words: badWords,
            uniqueWords: [...new Set(badWords)],
            positions: badWordPositions
        };
    }

    analyzeContent(content) {
        if (!this.initialized) {
            throw new Error('Global filter not initialized');
        }
        
        const hasProfanity = leo.check(content);
        const cleanedContent = leo.clean(content);
        const badWordCount = this.countBadWords(content);
        const badWordsDetails = this.getBadWordsDetails(content);
        
        return {
            isClean: !hasProfanity,
            hasBadWords: hasProfanity,
            badWordCount: badWordCount,
            badWordsFound: badWordsDetails.uniqueWords,
            originalContent: content,
            cleanedContent: cleanedContent,
            containsProfanity: hasProfanity,
            details: badWordsDetails
        };
    }

    addBadWords(newBadWords) {
        leo.add(newBadWords);
        this.customBadWords.push(...newBadWords);
        console.log(`Added ${newBadWords.length} new bad words to global filter`);
    }

    removeWords(wordsToRemove) {
        leo.remove(wordsToRemove);
        console.log(`Removed ${wordsToRemove.length} words from bad words filter`);
    }
}

const globalFilter = new GlobalFilterManager();

module.exports = globalFilter;