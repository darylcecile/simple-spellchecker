/*
 * Copyright (c) 2016 José F. Maldonado
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import fs from 'fs';
import { readFile, access, writeFile } from 'fs/promises';
import path from 'path';
import tmp from 'tmp';
import Zip from 'adm-zip';
import Dictionary from './dictionary.ts';

const FOLDER_PATH = path.join(import.meta.dirname, 'dict');

function stripBOM(str: string): string {
    if (str.charCodeAt(0) === 0xFEFF) return str.slice(1);
    return str;
}

const SpellChecker = {
    /**
     * Create a dictionary from a file, which might be either a .dic or a .zip file.
     *
     * @param fileName The name of the file from which read the word list.
     * @param folderPath The path to the directory in which the file is located (optional).
     * @returns A promise that resolves with the Dictionary instance.
     */
    async getDictionary(fileName: string, folderPath?: string): Promise<Dictionary> {
        const folder = (!folderPath || typeof folderPath !== 'string') ? FOLDER_PATH : folderPath;
        const dicPath = path.join(folder, fileName + '.dic');
        const zipPath = path.join(folder, fileName + '.zip');

        // Check if .dic file exists
        try {
            await access(dicPath);
            return await SpellChecker._readFile(dicPath);
        } catch {
            // .dic not found, try .zip
        }

        // Check if .zip file exists
        try {
            await access(zipPath);
            SpellChecker._unzipSync(zipPath, folder);
            return await SpellChecker._readFile(dicPath);
        } catch {
            throw new Error(`The dictionary could not be read, no file with the name "${fileName}" could be found`);
        }
    },

    /**
     * Create a dictionary from a .dic file.
     *
     * @param filePath The path of the file.
     * @returns A promise that resolves with the Dictionary instance.
     */
    async _readFile(filePath: string): Promise<Dictionary> {
        const text = await readFile(filePath, 'utf8');
        return new Dictionary(text.split('\n'));
    },

    /**
     * Create a dictionary from a .dic file synchronously.
     *
     * @param filePath The path of the file.
     * @returns The created dictionary.
     */
    _readFileSync(filePath: string): Dictionary {
        try {
            const text = fs.readFileSync(filePath, 'utf8');
            return new Dictionary(text.split('\n'));
        } catch (err) {
            throw new Error(`The dictionary file could not be read: ${filePath}. Error: ${err}`);
        }
    },

    /**
     * Unzip a zip file atomically.
     *
     * @param zipPath The path of the zip file.
     * @param destinationDir The directory to unzip into.
     */
    _unzipSync(zipPath: string, destinationDir: string): void {
        const tmpDir = tmp.dirSync({ dir: destinationDir });
        const zip = new Zip(zipPath);
        zip.extractAllTo(tmpDir.name);

        zip.getEntries().forEach(({ entryName }) => {
            const from = path.join(tmpDir.name, entryName);
            const to = path.join(destinationDir, entryName);
            fs.renameSync(from, to);
        });

        tmpDir.removeCallback();
    },

    /**
     * Create a dictionary from a .dic file synchronously.
     *
     * @param fileName The name of the file from which read the word list.
     * @param folderPath The path to the directory in which the file is located (optional).
     * @returns An instance of the Dictionary class.
     */
    getDictionarySync(fileName: string, folderPath?: string): Dictionary {
        const folder = (!folderPath || typeof folderPath !== 'string') ? FOLDER_PATH : folderPath;
        const dicPath = path.join(folder, fileName + '.dic');
        const zipPath = path.join(folder, fileName + '.zip');

        if (fs.existsSync(dicPath)) {
            return SpellChecker._readFileSync(dicPath);
        }

        if (fs.existsSync(zipPath)) {
            SpellChecker._unzipSync(zipPath, folder);
            return SpellChecker._readFileSync(dicPath);
        }

        throw new Error(`The dictionary could not be read, no file with the name "${fileName}" could be found`);
    },

    /**
     * Reads a UTF-8 dictionary file, removes the BOM and \r characters and sorts the list of words.
     *
     * @param inputPath The path for the input file.
     * @param outputPath The path to output (optional, by default equals the input file).
     * @returns A promise that resolves with true on success.
     */
    async normalizeDictionary(inputPath: string, outputPath?: string): Promise<boolean> {
        const outPath = (!outputPath || typeof outputPath !== 'string') ? inputPath : outputPath;

        try {
            await access(inputPath);
        } catch {
            throw new Error('The input file does not exist');
        }

        const content = await readFile(inputPath, 'utf8');
        const cleaned = stripBOM(content).replace(/\r/g, '');

        const lines = cleaned.split('\n');
        const collator = new Intl.Collator();
        const sorted = lines
            .filter(line => line !== '' && line !== '\n')
            .sort(collator.compare);

        await writeFile(outPath, sorted.join('\n'), 'utf8');
        return true;
    }
};

export default SpellChecker;
