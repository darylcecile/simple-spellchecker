/*
 * Copyright (c) 2016 José F. Maldonado
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, it, expect, beforeEach, beforeAll } from 'bun:test';
import SpellChecker from './index.ts';
import fs from 'fs';
import path from 'path';

describe("Module methods", () => {
    beforeEach(() => {
        const dicPath = path.join(import.meta.dirname, "dict", "en-US.dic");
        if (fs.existsSync(dicPath)) {
            fs.unlinkSync(dicPath);
        }
    });

    it("getDictionary()", async () => {
        const asyncDict = await SpellChecker.getDictionary("en-US");
        expect(asyncDict).not.toBeNull();
    });

    it("getDictionarySync()", () => {
        const syncDict = SpellChecker.getDictionarySync("en-US");
        expect(syncDict).not.toBeNull();
    });
});


describe("Dictionary methods", () => {
    let dictionary: Awaited<ReturnType<typeof SpellChecker.getDictionary>>;

    beforeAll(async () => {
        dictionary = await SpellChecker.getDictionary("en-US");
    });

    describe("spellCheck()", () => {
        it("should return true for 'December'", () => {
            expect(dictionary.spellCheck('December')).toBe(true);
        });
        it("should return true for 'december'", () => {
            expect(dictionary.spellCheck('december')).toBe(true);
        });
        it("should return true for 'house'", () => {
            expect(dictionary.spellCheck('house')).toBe(true);
        });
        it("should return true for 'a'", () => {
            expect(dictionary.spellCheck('a')).toBe(true);
        });
        it("should return true for 'zymurgy'", () => {
            expect(dictionary.spellCheck('zymurgy')).toBe(true);
        });
        it("should return true for \"Zorro's\"", () => {
            expect(dictionary.spellCheck("Zorro's")).toBe(true);
        });
        it("should return false for 'housec'", () => {
            expect(dictionary.spellCheck('housec')).toBe(false);
        });
        it("should return false for 'decembe'", () => {
            expect(dictionary.spellCheck('decembe')).toBe(false);
        });
    });

    describe("isMisspelled()", () => {
        it("should return false for 'December'", () => {
            expect(dictionary.isMisspelled('December')).toBe(false);
        });
        it("should return false for 'december'", () => {
            expect(dictionary.isMisspelled('december')).toBe(false);
        });
        it("should return false for 'house'", () => {
            expect(dictionary.isMisspelled('house')).toBe(false);
        });
        it("should return false for 'a'", () => {
            expect(dictionary.isMisspelled('a')).toBe(false);
        });
        it("should return false for 'zymurgy'", () => {
            expect(dictionary.isMisspelled('zymurgy')).toBe(false);
        });
        it("should return false for \"Zorro's\"", () => {
            expect(dictionary.isMisspelled("Zorro's")).toBe(false);
        });
        it("should return true for 'housec'", () => {
            expect(dictionary.isMisspelled('housec')).toBe(true);
        });
        it("should return true for 'decembe'", () => {
            expect(dictionary.isMisspelled('decembe')).toBe(true);
        });
    });

    describe("getSuggestions()", () => {
        it("should get suggestions for 'house'", () => {
            expect(dictionary.getSuggestions('house').length).toBeGreaterThan(0);
        });
        it("should get suggestions for 'housec'", () => {
            expect(dictionary.getSuggestions('housec').length).toBeGreaterThan(0);
        });
    });

    describe("checkAndSuggest()", () => {
        it("should return true and get suggestions for 'house'", () => {
            const res = dictionary.checkAndSuggest('house');
            expect(res.misspelled).toBe(false);
            expect(res.suggestions.length).toBeGreaterThan(0);
        });
        it("should return false and get suggestions for 'housec'", () => {
            const res = dictionary.checkAndSuggest('housec');
            expect(res.misspelled).toBe(true);
            expect(res.suggestions.length).toBeGreaterThan(0);
        });
    });

    describe("addRegex() and clearRegexs()", () => {
        it("should validate numbers", () => {
            expect(dictionary.spellCheck('1234')).toBe(false);
            expect(dictionary.spellCheck('1234.45')).toBe(false);
            dictionary.addRegex(/^-?\d*\.?\d*$/);
            expect(dictionary.spellCheck('1234')).toBe(true);
            expect(dictionary.spellCheck('1234.45')).toBe(true);
            dictionary.clearRegexs();
        });
        it("should validate emails", () => {
            expect(dictionary.spellCheck('john@doe.com')).toBe(false);
            expect(dictionary.spellCheck('jane@doe.net')).toBe(false);
            expect(dictionary.spellCheck('jane@joe')).toBe(false);
            dictionary.addRegex(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
            expect(dictionary.spellCheck('john@doe.com')).toBe(true);
            expect(dictionary.spellCheck('jane@doe.net')).toBe(true);
            expect(dictionary.spellCheck('jane@joe')).toBe(false);
            dictionary.clearRegexs();
        });
        it("should validate URLs", () => {
            expect(dictionary.spellCheck('https://www.test.com')).toBe(false);
            expect(dictionary.spellCheck('http://www.test.com')).toBe(false);
            expect(dictionary.spellCheck('http://test.com')).toBe(false);
            dictionary.addRegex(/(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/);
            expect(dictionary.spellCheck('https://www.test.com')).toBe(true);
            expect(dictionary.spellCheck('http://www.test.com')).toBe(true);
            expect(dictionary.spellCheck('http://test.com')).toBe(true);
            dictionary.clearRegexs();
        });
    });
});
