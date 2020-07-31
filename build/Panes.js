import { createButton, createElement, formatEng, parseEng } from './Utils.js';
/** Generic MessageDisplay */
class GenericMessageDisplay {
    clear() {
        this.node.innerHTML = '';
        this.node.classList.add('disabled');
        return true;
    }
    set(txt) {
        // TODO: single \n adds <br>, double \n\n adds new <p>
        let splitList = txt.split('\n');
        this.clear();
        splitList.forEach((t) => {
            let p = document.createElement('p');
            let tnode = document.createTextNode(t);
            p.appendChild(tnode);
            this.node.appendChild(p);
        });
        this.node.classList.remove('disabled');
        return true;
    }
    setNode(HTMLElement) {
        this.clear();
        this.node.appendChild(HTMLElement);
        this.node.classList.remove('disabled');
        return true;
    }
}
/**
 * Displays a message on top center of the page.
 */
export class TopStatusMessageDisplay extends GenericMessageDisplay {
    constructor() {
        super();
        this.node = document.getElementById('msgWrapper');
    }
}
/**
 * Displays a message on the lower left corner of the screen.
 */
export class StatusBarMessageDisplay extends GenericMessageDisplay {
    constructor() {
        super();
        this.node = document.getElementById('statusBarWrapper');
    }
}
/**
 * Displays a message right on the cursor position.
 */
export class MouseMessageDisplay extends GenericMessageDisplay {
    constructor() {
        super();
        this.node = document.getElementById('mouseMsg');
    }
    setPosition(p) {
        this.node.style.top = p.y.toString();
        this.node.style.left = p.x.toString();
        return true;
    }
}
export class DialogDisplay {
    constructor() {
        this.node = document.getElementById('dialogWrapper');
        this.wrapperNode = document.getElementById('dialogWrapperWrapper');
    }
    _onKeyUp(keyEvent) {
        switch (keyEvent.key.toUpperCase()) {
            case 'ENTER': {
                if (this.callback) {
                    this.callback(1);
                }
                break;
            }
            case 'ESCAPE': {
                if (this.callback) {
                    this.callback(0);
                }
                break;
            }
        }
    }
    /** Sets the visibility state of this DialogDisplay's node. */
    setVisible(isVisible) {
        if (isVisible)
            this.wrapperNode.classList.remove('disabled');
        else
            this.wrapperNode.classList.add('disabled');
    }
    /** Gets the visibility state of this DialogDisplay's node. */
    getVisible() {
        return !this.wrapperNode.classList.contains('disabled');
    }
    /** Creates an OK button and sets the default callback of DialogDisplay.
     *
     * If no argument is given, calls createFooterButtonWrapperNode().
    */
    createOkButton(parentNode = this.createFooterButtonWrapperNode(this.node)) {
        this.setDefaultExitCallback();
        let b = createButton(parentNode, 'OK', () => this.callback(1), 'Aceptar y continuar.');
        b.classList.add('primary');
        return b;
    }
    /** Creates a Cancel button.
     *
     * Does not set the default callback (assumes createOkButton has been called).
     *
     * If no argument is given, calls createFooterButtonWrapperNode().
    */
    createCancelButton(parentNode = this.createFooterButtonWrapperNode(this.node)) {
        let b = createButton(parentNode, 'Cancelar', () => this.callback(0), 'Cancelar y regresar');
        return b;
    }
    /** Creates a div and sets its class to .footerButtonWrapper
     * If no argument is given, assumes that parentNode = this.node.
    */
    createFooterButtonWrapperNode(parentNode = this.node) {
        let d = createElement(parentNode, 'div');
        d.classList.add('footerButtonWrapper');
        return d;
    }
    /** Sets the default callback to this.clear() */
    setDefaultExitCallback() {
        this.callback = this.clear;
    }
    /** Clears the inner node and sets the keyBinding callbacks to none. */
    clear() {
        this.node.innerHTML = '';
        this.setVisible(false);
        this.callback = null;
        return true;
    }
    /** Sets a string as the dialog message and adds an OK button. */
    set(string) {
        let splitList = string.split('\n');
        this.clear();
        splitList.forEach((t) => {
            let p = document.createElement('p');
            let tnode = document.createTextNode(t);
            p.appendChild(tnode);
            this.node.appendChild(p);
        });
        this.createOkButton();
        this.setVisible(true);
        return true;
    }
    /**
     * This does not call .clear()!.
     * @param HTMLElement The node to append to the pane.
     * @param doOkButton If true, will add an OK button to close the pane. Default true.
     */
    setNode(HTMLElement, doOkButton = true) {
        this.node.appendChild(HTMLElement);
        if (doOkButton)
            this.createOkButton();
        this.setVisible(true);
        return true;
    }
    /**
     * Creates a <span> with custom properties and functions:
     *  - suffix: Suffix of the EngNumber to use.
     *  - value: numeric value of the input.
     *  - callback: function to call when changed
     *  - get(): return the value of the input as a number.
     *  - getEng(): returns the value of the input as an Engineering String.
     *  - set(value): sets the input to a string or number.
     * @param onChange Function to call when value is changed..
     * @param defaultValue Default (standard numeric) value of the input.
     * @param suffix Suffix to display.
     * @param msg Message to show when clicked.
     * @param precision Decimal points to display. Defaults to 3.
     */
    createEngineerNumberInput(onChange, defaultValue = 0, suffix = '', msg = 'Inserte el nuevo valor', precision = 3, doClearAfterCallback = true) {
        let d = document.createElement('span');
        d.classList.add('engFormatInput');
        let d_any = d;
        d_any.suffix = suffix;
        d_any.value = defaultValue;
        d_any.callback = onChange;
        d_any.precision = precision;
        d_any.get = () => d_any.value;
        d_any.getEng = () => formatEng(d_any.value, d_any.suffix, false, d_any.precision);
        d_any.set = (value) => {
            let newVal = parseEng(value);
            if (d_any.value != newVal) {
                d_any.value = newVal;
                d_any.updateInnerHTML();
                d_any.callback(1, d_any.getEng(), newVal);
            }
        };
        d_any.updateInnerHTML = () => d.innerHTML = d_any.getEng();
        $(d).on('click', () => {
            let wrapper = document.createElement('div');
            createElement(wrapper, 'h1', msg);
            createElement(wrapper, 'p', 'Por ejemplo, 1000, 1e3, 20k, -3n, 80 k' + suffix + '...');
            let i = createElement(wrapper, 'input');
            i.type = 'text';
            i.value = d_any.getEng();
            $(i).change(() => {
                // Correct the value when changed.
                let n = parseEng(i.value);
                i.value = formatEng(n, d_any.suffix, false, d_any.precision);
            });
            let footer = this.createFooterButtonWrapperNode(wrapper);
            this.createCancelButton(footer);
            this.createOkButton(footer);
            this.clear();
            this.callback = (code) => {
                if (code)
                    d_any.set(i.value);
                else
                    d_any.callback(code, d_any.getEng(), d_any.value);
                if (doClearAfterCallback)
                    this.clear();
            };
            this.setNode(wrapper, false);
            i.focus();
        });
        d_any.updateInnerHTML();
        return d;
    }
}
//# sourceMappingURL=Panes.js.map