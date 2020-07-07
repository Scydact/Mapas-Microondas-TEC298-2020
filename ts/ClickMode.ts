import { TopStatusMessageDisplay } from "./Panes.js";

/**
 * Possible click modes available
 */
export type ClickModeType = (
    null | 
    'setLinePoint1' | 
    'setLinePoint2' | 
    'setPointMarker' | 
    'setTopographicPoint');

/**
 * Stores the current click mode (selected tool) and updates a few things when changed.
 */
export class ClickMode {
    mode: ClickModeType;
    oldMode: ClickModeType;
    canvas: HTMLCanvasElement;
    msgBar: TopStatusMessageDisplay;

    /**
     * Stores the current click mode (selected tool) and updates a few things when changed.
     * - Updates the visual cursor (css).
     * - Updates the selected tool buttons.
     * @param canvas Canvas element. Used to update the cursor 
     * @param msgBar Top message output. ClickMode will clear it when no tool is selected.
     */
    constructor(canvas: HTMLCanvasElement, msgBar: TopStatusMessageDisplay) {
        this.mode = null;
        this.oldMode = null;
        this.canvas = canvas;
        this.msgBar = msgBar;
        this.updateUITools();
    }

    clear() {
        this.oldMode = this.mode;
        this.mode = null;
        this.msgBar.clear();
        this.updateUITools();
    }

    set(mode: ClickModeType) {
        this.oldMode = this.mode;
        this.mode = mode;
        this.updateUITools();
    }

    deselectUITools() {
        $('.toolBtn').removeClass('active');
        $(this.canvas).removeClass('crosshair');
    }
    
    updateUITools() {
        let mode = this.mode;
        let canvas = this.canvas;
        this.deselectUITools();
        switch (mode) {
            case 'setLinePoint1':
            case 'setLinePoint2':
            case 'setTopographicPoint':
                $('#toolLine').addClass('active');
                $(canvas).addClass('crosshair');
                break;

            case 'setPointMarker':
                $('#toolPoint').addClass('active');
                $(canvas).addClass('crosshair');
                break;

            default:
                $('#toolPointer').addClass('active');
        }
    }
}