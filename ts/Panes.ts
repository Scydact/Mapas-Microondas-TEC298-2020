import { Point } from "./Point.js";

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
        let splitList = txt.split("\n");
        let T = this;

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
};