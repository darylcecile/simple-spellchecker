declare module 'binarysearch' {
    function binarysearch<T>(haystack: T[], needle: T, comparator?: (a: T, b: T) => number): number;
    namespace binarysearch {
        function closest<T>(haystack: T[], needle: T, comparator?: (a: T, b: T) => number): number;
    }
    export = binarysearch;
}

declare module 'damerau-levenshtein' {
    interface LevenshteinResult {
        steps: number;
        relative: number;
        similarity: number;
    }
    function levenshtein(a: string, b: string): LevenshteinResult;
    export = levenshtein;
}
