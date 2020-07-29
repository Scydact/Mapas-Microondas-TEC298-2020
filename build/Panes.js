import { createButton, createElement } from "./Utils.js";
/** Generic MessageDisplay */
class GenericMessageDisplay {
    clear() {
        this.node.innerHTML = '';
        this.node.classList.add('disabled');
        return true;
    }
    set(txt) {
        let splitList = txt.split("\n");
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
;
export class DialogDisplay {
    constructor() {
        this.node = document.getElementById('dialogWrapper');
        this.wrapperNode = document.getElementById('dialogWrapperWrapper');
    }
    setVisible(isVisible) {
        if (isVisible)
            this.wrapperNode.classList.remove('disabled');
        else
            this.wrapperNode.classList.add('disabled');
    }
    createExitButton(parentNode = this.createFooterButtonWrapperNode(this.node)) {
        let b = createButton(parentNode, 'OK', () => this.clear(), 'Aceptar y continuar.');
        b.classList.add('primary');
        return b;
    }
    createFooterButtonWrapperNode(parentNode = this.node) {
        let d = createElement(parentNode, 'div');
        d.classList.add('footerButtonWrapper');
        return d;
    }
    clear() {
        this.node.innerHTML = "";
        this.setVisible(false);
        return true;
    }
    set(string) {
        let splitList = string.split("\n");
        this.clear();
        splitList.forEach((t) => {
            let p = document.createElement('p');
            let tnode = document.createTextNode(t);
            p.appendChild(tnode);
            this.node.appendChild(p);
        });
        this.createExitButton();
        this.setVisible(true);
        return true;
    }
    /**
     *
     * @param HTMLElement The node to append to the pane.
     * @param doOkButton If true, will add an OK button to close the pane. Default true.
     */
    setNode(HTMLElement, doOkButton = true) {
        this.clear();
        this.node.appendChild(HTMLElement);
        if (doOkButton)
            this.createExitButton();
        this.setVisible(true);
        return true;
    }
}
//# sourceMappingURL=Panes.js.map