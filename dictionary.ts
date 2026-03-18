/*
 * Copyright (c) 2016 José F. Maldonado
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import BinarySearch from 'binarysearch';
import Levenshtein from 'damerau-levenshtein';

const Collator = new Intl.Collator(undefined, { sensitivity: 'accent' });

const SuggestRadius = 1000;

export interface CheckAndSuggestResult {
    misspelled: boolean;
    suggestions: string[];
}

export default class Dictionary {
    wordlist: string[];
    private regexs: RegExp[];

    constructor(wordlist: string[]) {
        this.wordlist = [];
        this.regexs = [];
        this.setWordlist(wordlist);
    }

    getLength(): number {
        return this.wordlist != null ? this.wordlist.length : 0;
    }

    setWordlist(wordlist: string[]): void {
        if (wordlist != null && Array.isArray(wordlist)) this.wordlist = wordlist;
    }

    spellCheck(word: string): boolean {
        for (const regex of this.regexs) {
            if (regex.test(word)) return true;
        }

        const res = BinarySearch(
            this.wordlist,
            word.toLowerCase(),
            Collator.compare
        );
        return res >= 0;
    }

    isMisspelled(word: string): boolean {
        return !this.spellCheck(word);
    }

    getSuggestions(word: string, limit: number = 5, maxDistance: number = 2): string[] {
        let suggestions: string[] = [];
        if (word != null && word.length > 0) {
            word = word.toLowerCase();
            if (limit <= 0) limit = 5;
            if (maxDistance <= 0) maxDistance = 2;
            if (maxDistance >= word.length) maxDistance = word.length - 1;

            const closest = BinarySearch.closest(this.wordlist, word, Collator.compare);

            const res: string[][] = [];
            for (let i = 0; i <= maxDistance; i++) res.push([]);

            for (let i = 0; i < SuggestRadius; i++) {
                const k = closest + (i % 2 !== 0 ? (i + 1) / 2 : -i / 2);
                if (k >= 0 && k < this.wordlist.length) {
                    const dist = Levenshtein(word, this.wordlist[k].toLowerCase()).steps;
                    if (dist <= maxDistance) res[dist].push(this.wordlist[k]);
                }
            }

            for (let d = 0; d <= maxDistance && suggestions.length < limit; d++) {
                const remaining = limit - suggestions.length;
                suggestions = suggestions.concat(
                    res[d].length > remaining ? res[d].slice(0, remaining) : res[d]
                );
            }
        }
        return suggestions;
    }

    checkAndSuggest(word: string, limit: number = 5, maxDistance?: number): CheckAndSuggestResult {
        const suggestions = this.getSuggestions(word, limit + 1, maxDistance);

        const res: CheckAndSuggestResult = { misspelled: true, suggestions: [] };
        res.misspelled = suggestions.length === 0 || suggestions[0].toLowerCase() !== word.toLowerCase();
        res.suggestions = suggestions;
        if (res.misspelled && suggestions.length > limit) res.suggestions = suggestions.slice(0, limit);
        if (!res.misspelled) res.suggestions = suggestions.slice(1);

        if (res.misspelled) {
            for (const regex of this.regexs) {
                if (regex.test(word)) res.misspelled = false;
            }
        }

        return res;
    }

    addRegex(regex: RegExp): void {
        this.regexs.push(regex);
    }

    clearRegexs(): void {
        this.regexs = [];
    }
}
