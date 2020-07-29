import { TopographicProfilePointList } from "./MapObject.js";
// TODO: Finish implementing me
export class UndoRedoManager {
    constructor(app) {
        this.actionUndoStack = [];
        this.actionRedoStack = [];
        this.app = app;
    }
    /** Saves an action to the undo stack. */
    do(action) {
        this.actionUndoStack.push(action);
    }
    /** Returns an action from the undo stack. */
    undo() {
        let undoAction = this.actionUndoStack.pop();
        if (undoAction) {
            this.apply(undoAction);
            this.actionRedoStack.push(this.invertOldNewData(undoAction));
        }
    }
    /** Returns an action from the undo stack. */
    redo() {
        let redoAction = this.actionRedoStack.pop();
        if (redoAction) {
            this.apply(redoAction);
            this.actionUndoStack.push(this.invertOldNewData(redoAction));
        }
    }
    invertOldNewData(action) {
        let temp = action.oldData;
        action.oldData = action.data;
        action.data = temp;
        return action;
    }
    apply(action) {
        switch (action.action) {
            case 'ModifyMapObjectListElement':
                let list = action.source;
                list.list = action.oldData;
                list.updateNode();
                if (list instanceof TopographicProfilePointList) {
                    list.updateNodeRender();
                }
                break;
        }
        this.app.draw();
    }
}
//# sourceMappingURL=UndoRedoManager.js.map