/**
 * Convert a decimal value to a sexagecimal string
 */
export function decimalToSexagecimal(dec: number) {
    let x = Math.abs(dec);
    let sign = Math.sign(dec);

    let minutes = (x - Math.floor(x)) * 60;
    let seconds = (minutes - Math.floor(minutes)) * 60;

    let signChar = sign == -1 ? '-' : '';

    return (
        signChar +
        Math.floor(x).toString() +
        '°' +
        Math.floor(minutes).toString() +
        "'" +
        seconds.toFixed(0) +
        "''"
    );
}

/**
 * Tries to copy the value from Object A to Object B. If successful, returns true.
 * @param target The object to copy to.
 * @param source The object to copy from.
 * @param propertyName The property to copy.
 */
export function ObjectAssignProperty(target, source, propertyName) {
    let prop = source[propertyName];
    if (prop !== undefined) {
        target[propertyName] = prop;
        return true;
    } else {
        return false;
    }
}

/**
 * Converts an string to title case
 * @param string String to convert to title case
 */
export function titleCase(string: string) {
    var sentence = string.toLowerCase().split(' ');
    for (var i = 0; i < sentence.length; i++) {
        sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }

    return sentence.join(' ');
}

/**
 * Creates a button and appends it to parentNode.
 * @param parentNode The node to append the button to.
 * @param text Text to display on the button.
 * @param callback Function to call when clicked.
 * @param tooltip (optional) Tooltip to show when hovering the button.
 */
export function createButton(
    parentNode: HTMLElement,
    text: string,
    callback?,
    tooltip?: string
) {
    let b = document.createElement('div');
    b.setAttribute('class', 'button');
    //b.setAttribute('value', text);
    b.innerHTML = text;
    if (tooltip) {
        b.setAttribute('title', tooltip);
    }
    if (callback) {
        $(b).on('click', callback);
    }
    parentNode.appendChild(b);
    return b;
}

/**
 * Creates a label and appends it to parentNode.
 * @param parentNode The node to append the button to.
 * @param text Text to display on the label
 * @param tooltip (optional) Tooltip to show when hovering the button.
 */
export function createLabel(
    parentNode: HTMLElement,
    text: string,
    tooltip?: string
) {
    let l = document.createElement('label');
    l.innerText = text;
    if (tooltip) {
        l.setAttribute('title', tooltip);
    }
    parentNode.appendChild(l);
    return l;
}

/**
 * Creates a line break <br> and appends it to parentNode.
 * @param parentNode The node to append the break to.
 */
export function lineBreak(parentNode: HTMLElement) {
    let b = document.createElement('br');
    parentNode.appendChild(b);
    return b;
}

/**
 * Creates a new <select> element and its corresponding options. Does not set the default option.
 * @param parentNode The node to append the <select> to.
 * @param optionList The values of the options.
 * @param optionValueList (optional) The display values of the options.
 * @param tooltip (optional) Tooltip to show when hovering the button.
 */
export function createSelect(
    parentNode: HTMLElement,
    optionList: readonly string[],
    optionValueList?: readonly string[],
    tooltip?: string
) {
    let l = document.createElement('select');
    if (tooltip) {
        l.setAttribute('title', tooltip);
    }
    parentNode.appendChild(l);

    let displayNames = optionValueList ? optionValueList : optionList;

    for (let i = 0; i < displayNames.length; i++) {
        let o = document.createElement('option');
        let jo = $(o);
        jo.val(optionList[i]);
        jo.html(displayNames[i]);
        l.appendChild(o);
    }

    return l;
}

export function createElement(
    parentNode: HTMLElement,
    tagName: string,
    innerHtml?: string
) {
    let e = document.createElement(tagName);
    parentNode.appendChild(e);
    if (innerHtml) {
        e.innerHTML = innerHtml;
    }
    return e;
}

/**
 * Interface for objects that can produce and accept a generic object for saving purposes.
 *
 * NOTE: Also create an static method called 'fromJObject(o)' with description:
 * Creates a new object and assigns its values.
 */
export interface Restorable {
    /** Creates a generic object that can be saved and loaded from JSON using .assign(o). */
    toJObject(): object;

    /** Assigns the values of the given object to this object. */
    assign(o): boolean;
}

/** Converts an SVG string to a PNG image, and passes it to callback(data) */
export function svgToPng(svg: string, callback: CallableFunction) {
    const url = getSvgUrl(svg);
    svgUrlToPng(url, (imgData) => {
        callback(imgData);
        URL.revokeObjectURL(url);
    });
}
/** Creates an URL from an SVG. Remember to do URL.revokeObjectURL() after using it. */
export function getSvgUrl(svg: string) {
    return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
}
/** Renders the given URL into a canvas, and runs the output URL through callback(data) */
export function svgUrlToPng(svgUrl: string, callback: CallableFunction, OutputWidth: number = 2000) {
    const svgImage = document.createElement('img');
    svgImage.style.position = 'absolute';
    svgImage.style.top = '-9999px';
    document.body.appendChild(svgImage);

    svgImage.onload = function () {
        const canvas = document.createElement('canvas');
        let w = OutputWidth;
        let h = w * svgImage.height / svgImage.width;

        canvas.width = w;
        canvas.height = h;

        const canvasCtx = canvas.getContext('2d');
        canvasCtx.drawImage(svgImage, 0, 0, w, h);

        const imgData = canvas.toDataURL('image/png');
        callback(imgData);
        document.body.removeChild(svgImage);
    };

    svgImage.src = svgUrl;
}

/** Prompts download of a given Uri (also encodes it, just in case) */
export function downloadUri(data: string, fileName: string) {
    var encodedUri = encodeURI(data);
    downloadUrl(encodedUri, fileName);
}

/** Prompts download of a given Uri */
export function downloadBlob(blob: Blob, fileName: string) {
    let url = URL.createObjectURL(blob);
    downloadUrl(url, fileName);
    URL.revokeObjectURL(url);
}

/** Creates a link and clicks it automatically */
export function downloadUrl(url: string, fileName: string) {
    var link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.click();
}

const metricPrefixes = {
    'y': 'yocto',
    'z': 'zepto',
    'a': 'atto',
    'f': 'femto',
    'p': 'pico',
    'n': 'nano',
    'µ': 'micro',
    'm': 'milli',
    '': '',
    'k': 'kilo',
    'M': 'mega',
    'G': 'giga',
    'T': 'tera',
    'P': 'peta',
    'E': 'exa',
    'Z': 'zetta',
    'Y': 'yotta',
}
const metricPrefixesShort = Object.keys(metricPrefixes);
const metricPrefixesLong = Object.values(metricPrefixes);
/**
 * Formats a number in engineering notation.
 * 
 * Examples: 
 *  - 2 ('Hz') => 2 Hz
 *  - 0.01 ('A') => 10 mA 
 *  - 1.023e-8 ('F') => 10.24 nF
 *  - 3.49243e10 ('bps') => 34.92 Gbps
 *  - 7.34e-36 ('') => 
 * @param n Number to format
 * @param suffix Suffix to add (Hz, m, s, ...). If falsy, will output in engineering exponent notation (0.01 => 10e-3 instead of the standard 1e-4)
 * @param showTrailingZeros (false) If true, trailing zeroes will always be shown.
 * @param roundDigits (2) Number of digits to round to.
 * @param useLongPrefixes (false) If true, will use 'milli', 'kilo', 'mega'... intead of 'm', 'k', 'M'.
 * @param useExtendedSet (false) if true, will use extended metric prefixes from exp18 to exp24 ('atto', 'zepto', 'yocto' and 'exa', 'zetta', 'yotta')
 */
export function formatEng(
    n: number, 
    suffix: string, 
    showTrailingZeros = false,
    roundDigits = 2, 
    useLongPrefixes = false, 
    useExtendedSet = false) {
    let factor = Math.floor(Math.log10(Math.abs(n))/3);

    let offset = 8;
    let cap = (useExtendedSet) ? 8 : 5;
    let prefix = (useLongPrefixes) ? metricPrefixesLong : metricPrefixesShort;

    let num = n / 10**(factor * 3);
    let numPart = (showTrailingZeros) ? 
        num.toFixed(roundDigits): 
        (Math.round((num + Number.EPSILON) * 10**roundDigits) / 10**roundDigits).toString();

    let selectedPrefix = (Math.abs(factor) > cap || !suffix) ? 
        'e' + (factor * 3).toString() :
        ' ' + prefix[factor + offset] + suffix;

    return numPart + selectedPrefix ;
}

export function parseEng(data: any) {
    let comp = typeof data ;
    let str;
    if (comp == 'number') return data;
    else if (comp != 'string') str = data.toString();
    else str = data;

    var re = /([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)([yzafpnuµmkMGTPEZY]?)(.*)/;
    var searchResult = str.replace(/ /g,'').match(re);

    if (!searchResult) return parseFloat(str); 

    var fullMatch, num, symbol, extraBits;
    [fullMatch, num, symbol, extraBits]= searchResult;

    let n = parseFloat(num);
    let s = symbol.replace('u','µ');
    let e = metricPrefixesShort.findIndex((e) => e === s);
    if (e == -1) return n;

    let exponent = (e - 8) * 3;
    return n * 10 ** exponent;
}

export const C0 = 299792458;
export const TopoCalculator = {
    watt2dbm: (w) => 10 * Math.log10(w * 1e3),
    dbm2watt: (dbm) => 1e-3 * 10 ** (dbm / 10),

    freeSpaceLoss: (d, f) => (4 * Math.PI * d * f / C0) ** 2,
    
    freeSpaceLossDB: (d, f) => 20 * Math.log10(4 * Math.PI * d * f / C0),
    maxPermisibleDistance: (h1, h2) => 1000 * Math.sqrt(17) * (Math.sqrt(h1) + Math.sqrt(h2)),
    
    reflectionC: (h1, h2) => (h1 - h2) / (h1 + h2),
    reflectionM: (d, h1, h2) => d * d / (4 * (4 / 3) * 6370e3 * (h1 + h2)),
    reflectionB: (d, h1, h2) => {
        let c = TopoCalculator.reflectionC(h1, h2);
        let m = TopoCalculator.reflectionM(d, h1, h2);
        return c/(1 + m * Math.sqrt(1-c^2));
    },
    reflectionPoint: (d, h1, h2) => {
        let b = TopoCalculator.reflectionB(d, h1, h2);
        return [
            0.5 * d * (1 + b),
            0.5 * d * (1 - b),
        ];
    },

    fresnelRadius: (d1, d2, f, n) => Math.sqrt(n * (C0 / f) * d1 * d2 / (d1 + d2)),
}