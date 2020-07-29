import { Point } from './Point.js';
import { MapObject, MapObjectList } from './MapObject.js';
import { createButton, createElement } from './Utils.js';

interface MessageDisplay {
    /**
     * Node that this pane manages.
     */
    node: HTMLElement;

    /**
     * Clears (and hides) the pane.
     */
    clear(): boolean;

    /**
     * Sets the text inside the pane.
     * @param string String to set as the content.
     */
    set(string): boolean;

    /**
     * Sets the given node as the pane's content.
     * @param HTMLElement Element to set as the content.
     */
    setNode(HTMLElement): boolean;
}

/** Generic MessageDisplay */
class GenericMessageDisplay implements MessageDisplay {
    node: HTMLElement;

    clear(): boolean {
        this.node.innerHTML = '';
        this.node.classList.add('disabled');
        return true;
    }
    set(txt: any): boolean {
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
    setNode(HTMLElement: any): boolean {
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

    setPosition(p: Point): boolean {
        this.node.style.top = p.y.toString();
        this.node.style.left = p.x.toString();
        return true;
    }
}

export class DialogDisplay implements MessageDisplay {
    node: HTMLElement;
    wrapperNode: HTMLElement;
    callbackKeyEnter: CallableFunction;
    callbackKeyEscape: CallableFunction;

    constructor() {
        this.node = document.getElementById('dialogWrapper');
        this.wrapperNode = document.getElementById('dialogWrapperWrapper');
    }

    _onKeyUp(keyEvent) {
        switch (keyEvent.key.toUpperCase()) {
            case 'ENTER': {
                if (this.callbackKeyEnter) {
                    this.callbackKeyEnter();
                }
                break;
            }
            case 'ESCAPE': {
                if (this.callbackKeyEscape) {
                    this.callbackKeyEscape();
                }
                break;
            }
        }
    }

    setVisible(isVisible: boolean) {
        if (isVisible) this.wrapperNode.classList.remove('disabled');
        else this.wrapperNode.classList.add('disabled');
    }

    getVisible() {
        return !this.wrapperNode.classList.contains('disabled');
    }

    createOkButton(
        parentNode: HTMLElement = this.createFooterButtonWrapperNode(this.node)
    ) {
        let exitCallback = () => this.clear();
        let b = createButton(
            parentNode,
            'OK',
            exitCallback,
            'Aceptar y continuar.'
        );
        b.classList.add('primary');
        this.callbackKeyEnter = exitCallback;
        this.callbackKeyEscape = exitCallback;
        return b;
    }

    createFooterButtonWrapperNode(parentNode: HTMLElement = this.node) {
        let d = createElement(parentNode, 'div');
        d.classList.add('footerButtonWrapper');
        return d;
    }

    clear(): boolean {
        this.node.innerHTML = '';
        this.setVisible(false);

        this.callbackKeyEnter = null;
        this.callbackKeyEscape = null;

        return true;
    }

    set(string: any): boolean {
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
     *
     * @param HTMLElement The node to append to the pane.
     * @param doOkButton If true, will add an OK button to close the pane. Default true.
     */
    setNode(HTMLElement: any, doOkButton: boolean = true): boolean {
        this.clear();
        this.node.appendChild(HTMLElement);

        if (doOkButton) this.createOkButton();
        this.setVisible(true);
        return true;
    }
}
