import { App } from "./App.js";

type UndoRedoStackAction = 'ModifyMapObjectListElement' | 'MapAddLine';
export type UndoRedoStackActionObject = {
    action: UndoRedoStackAction,
    source: any,
    data: any,
    oldData: any,
}

// TODO: Finish implementing me
export class UndoRedoManager {
    app: App;
    actionUndoStack: UndoRedoStackActionObject[] = [];
    actionRedoStack: UndoRedoStackActionObject[] = [];

    constructor(app: App) {
        this.app = app;
    }

    /** Saves an action to the undo stack. */
    do(action: UndoRedoStackActionObject) {
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

    invertOldNewData(action: UndoRedoStackActionObject) {
        let temp = action.oldData;
        action.oldData = action.data;
        action.data = temp;
        return action;
    }

    apply(action: UndoRedoStackActionObject) {
        switch(action.action) {
            case 'ModifyMapObjectListElement':
                let list = action.source;
                list.list = action.oldData;
                list.updateNode();
                break;
        }
        this.app.draw();
    }
        
}
