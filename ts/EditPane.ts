import { MapObjectList, MapObject } from './MapObject.js';
import { App } from './App.js';

export class EditPane {
    app: App;
    active: any; //{ list: MapObject[] }[]; 
    wrapperNode: HTMLElement;
    contentNode: HTMLElement;

    constructor(app: App) {
        this.app = app;
        this.active = [];
        this.wrapperNode = document.getElementById('editionWrapper');
        this.contentNode = document.getElementById('editionContentWrapper');
    }

    /** Clears the associated node. */
    clear() {
        this.contentNode.innerHTML = '';
    }

    /** Calls both updateActive() and updateNode() */
    selfUpdate() {
        this.updateActive();
        this.updateNode();
    }

    /** Updates the EditPane.active object. Does not update the associated node.*/
    updateActive() {
        let allLists = this.app.objectListList;
        this.active = allLists.map((e) => e.getState('active'));
    }

    /** Updates the associated node. Requires updateActive() first. */
    updateNode() {
        this.clear();

        // only 1 line
        if (this.active[0].length == 1 && !this.active[1].length) {
            this.contentNode.appendChild(this.active[0][0].getEditNodeContent()); // TODO: Implement getEditNodeContent as an interface
        }
        else if (this.active[1].length && !this.active[0].length) {
            this.contentNode.appendChild(this.active[1][0].getEditNodeContent());
        }
    }
}
