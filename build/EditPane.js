export class EditPane {
    constructor(app) {
        this.app = app;
        this.active = [];
        this.wrapperNode = document.getElementById('editionWrapper');
        this.contentNode = document.getElementById('editionContentWrapper');
    }
    clear() {
        this.contentNode.innerHTML = '';
    }
    selfUpdate() {
        this.updateActive();
        this.updateNode();
    }
    updateActive() {
        let allLists = this.app.objectListList;
        let a = [1, 2, 3];
        a.map((e) => 2 * e);
        this.active = allLists.map((e) => e.getState('active'));
    }
    updateNode() {
        this.clear();
        // only lines
        if (this.active[0].length && !this.active[1].length) {
            this.contentNode.appendChild(this.active[0][0].getEditNodeContent()); // TODO: Implement getEditNodeContent as an interface
        }
        else if (this.active[1].length && !this.active[0].length) {
            this.contentNode.appendChild(this.active[1][0].getEditNodeContent());
        }
    }
}
//# sourceMappingURL=EditPane.js.map