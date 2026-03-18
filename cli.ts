#!/usr/bin/env bun

/*
 * Copyright (c) 2016 José F. Maldonado
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import SpellChecker from './index.js';

const action = process.argv.length > 2 ? process.argv[2].toLowerCase() : '';

if (action === 'check') {
    const inputFolder = process.argv[3] ?? null;
    const fileName = process.argv[4] ?? null;
    const word = process.argv[5] ?? null;

    try {
        const dictionary = await SpellChecker.getDictionary(fileName!, inputFolder!);
        console.log(dictionary.checkAndSuggest(word!));
    } catch (err) {
        console.error((err as Error).message);
    }
    process.exit();
}

if (action === 'normalize') {
    const inputFile = process.argv[3] ?? null;
    const outputFile = process.argv[4] ?? undefined;

    try {
        await SpellChecker.normalizeDictionary(inputFile!, outputFile);
        console.log('The file was normalized');
    } catch (err) {
        console.error((err as Error).message);
    }
    process.exit();
}

