/**
* Convert a decimal value to a sexagecimal string
*/
export function decimalToSexagecimal(dec) {
    let x = Math.abs(dec);
    let sign = Math.sign(dec);
    let minutes = (x - Math.floor(x)) * 60;
    let seconds = (minutes - Math.floor(minutes)) * 60;
    let signChar = sign == -1 ? "-" : "";
    return (signChar +
        Math.floor(x).toString() +
        "°" +
        Math.floor(minutes).toString() +
        "'" +
        seconds.toFixed(2).toString() +
        "''");
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
    }
    else {
        return false;
    }
}
/**
 * Converts an string to title case
 * @param string String to convert to title case
 */
export function titleCase(string) {
    var sentence = string.toLowerCase().split(" ");
    for (var i = 0; i < sentence.length; i++) {
        sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }
    return sentence.join(" ");
}
/**
 * Creates a button and appends it to parentNode.
 * @param parentNode The node to append the button to.
 * @param text Text to display on the button.
 * @param callback Function to call when clicked.
 * @param tooltip (optional) Tooltip to show when hovering the button.
 */
export function createButton(parentNode, text, callback, tooltip) {
    let b = document.createElement('input');
    b.setAttribute('type', 'button');
    b.setAttribute('value', text);
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
export function createLabel(parentNode, text, tooltip) {
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
export function lineBreak(parentNode) {
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
export function createSelect(parentNode, optionList, optionValueList, tooltip) {
    let l = document.createElement('select');
    if (tooltip) {
        l.setAttribute('title', tooltip);
    }
    parentNode.appendChild(l);
    let displayNames = (optionValueList) ? optionValueList : optionList;
    for (let i = 0; i < displayNames.length; i++) {
        let o = document.createElement('option');
        let jo = $(o);
        jo.val(optionList[i]);
        jo.html(displayNames[i]);
        l.appendChild(o);
    }
    return l;
}
export function createElement(parentNode, tagName, innerHtml) {
    let e = document.createElement(tagName);
    parentNode.appendChild(e);
    if (innerHtml) {
        e.innerHTML = innerHtml;
    }
    return e;
}
//# sourceMappingURL=Utils.js.map