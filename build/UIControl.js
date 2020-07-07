import { Point } from './Point.js';
import { TopStatusMessageDisplay, StatusBarMessageDisplay, MouseMessageDisplay } from './Panes.js';
import { ClickMode } from './ClickMode.js';
/**
 * * Main auxiliary class of this map application. Should be loaded once.
 * (Though nothing stops you from creating more than one.)
 * All interactivty (click events and such) are handled here.
 * So it has control over the main App.
 */
export class InteractivityManager {
    constructor(app) {
        this.clicking = false;
        this.dragging = false;
        this.modifier = {
            shift: false,
            ctrl: false,
            alt: false,
        };
        this.scaleMultiplier = 0.8;
        this.touchZooming = 0;
        this.touchZoomingDistance = 0;
        this.touchScaleMultiplier = 1 / 100;
        this.startDragOffset = new Point(0, 0);
        this.hoverDistance = 7; // TODO: Move to settings
        this.out = {
            topMsgBar: new TopStatusMessageDisplay(),
            statusBar: new StatusBarMessageDisplay(),
            mouseBar: new MouseMessageDisplay(),
        };
        this.app = app;
        this.clickMode = new ClickMode(this.app.canvas, this.out.topMsgBar);
    }
    /**
     *
     * @param newPoint New mouse position
     */
    handlerScreenPointMove(newPoint) {
        console.log('mousemove');
        if (this.clicking) {
            this.dragging = true;
            let translate = this.app.posState.translate;
            translate.assign(Point.Minus(newPoint, this.startDragOffset));
        }
        // Set mouse pointer to 'move' if dragging
        if (this.dragging) {
            $(this.app.canvas).addClass('move');
        }
        else {
            $(this.app.canvas).removeClass('move');
        }
        // Update mousePos / coordPos global vars
        // getMousePos(canvas, newPos);
        // getMousePosInMap(canvas, newPos);
        // Final draw
        this.app.draw();
    }
    handlerScreenPointClick(newPoint) {
        this.clicking = false;
        this.dragging = false;
        // Final draw
        this.app.draw();
    }
    handlerScreenPointClickDown(newPoint) {
        this.clicking = true;
        let translate = this.app.posState.translate;
        this.startDragOffset.assign(Point.Minus(newPoint, translate));
    }
    handlerKeyUp(keyEvent) {
        let modifier = this.modifier;
        switch (keyEvent.key.toUpperCase()) {
            case 'SHIFT':
                modifier.shift = false;
                break;
            case 'CONTROL':
                modifier.ctrl = false;
                break;
            case 'ALT':
                modifier.alt = false;
                break;
        }
        // Final draw
        this.app.draw();
    }
    handlerKeyDown(keyEvent) {
        let modifier = this.modifier;
        switch (keyEvent.key) {
            case 'Shift':
                modifier.shift = true;
                break;
            case 'Control':
                modifier.ctrl = true;
                break;
            case 'Alt':
                modifier.alt = true;
                break;
        }
    }
    static MouseEvtToPos(evt) {
        return new Point(evt.clientX, evt.clientY);
    }
    static TouchEvtToPos(evt) {
        let x = evt.originalEvent.changedTouches[0];
        return new Point(x.clientX, x.clientY);
    }
    onWindowReady() {
        let app = this.app;
        let canvas = this.app.canvas;
        let T = this; // use only when callback function is not defined inline
        $(window).resize(function () {
            app.draw();
        });
        //#region Canvas interactivity
        $(document).keyup((e) => this.handlerKeyUp(e));
        $(document).keydown((e) => this.handlerKeyDown(e));
        $(canvas).on('mousemove', (e) => this.handlerScreenPointMove(InteractivityManager.MouseEvtToPos(e)));
        $(canvas).on('mousedown', (e) => this.handlerScreenPointClickDown(InteractivityManager.MouseEvtToPos(e)));
        $(canvas).on('mouseup', (e) => this.handlerScreenPointClick(InteractivityManager.MouseEvtToPos(e)));
        function disableClick() {
            T.clicking = false;
            T.dragging = false;
        }
        $(canvas).on('mouseover', (e) => disableClick());
        $(canvas).on('mouseout', (e) => disableClick());
        // Wheel zoom
        canvas.addEventListener('wheel', function (e) {
            // jquery is broken with wheel?
            e.preventDefault(); // for touch support
            // calculate scale direction
            let scaleMult = e.deltaY > 0 ? T.scaleMultiplier : 1 / T.scaleMultiplier;
            let centerPoint = new Point(e.offsetX, e.offsetY);
            app.posState.zoomAtPosition(centerPoint, app.posState.scale * scaleMult);
            app.draw();
        });
        //#endregion
        //#region Side panes
        let PaneIdList = [
            '#settingsWrapper',
            '#linesWrapper',
            '#pointsWrapper',
            '#editionWrapper',
        ];
        /**
         * Close all panes on PaneIdList
         */
        function paneCloseAll() {
            PaneIdList.forEach((e) => $(e).addClass('disabled'));
        }
        /**
         * Toggles an specific pane
         * @param selector Selector of the pane to close
         */
        function togglePane(selector) {
            let j = $(selector);
            if (j.hasClass('disabled')) {
                paneCloseAll();
                j.removeClass('disabled');
            }
            else {
                paneCloseAll();
            }
        }
        $('#openSettings').on('click', function () {
            // These things should be managed by Settings.ts
            //mapMeta.loadToSetup();
            //$('#snapCheckbox').prop('checked', snapEnabled);
            togglePane('#settingsWrapper');
        });
        $('#openLinePane').on('click', function () {
            togglePane('#linesWrapper');
        });
        //mapLineList.updateToolNode(document.querySelector('#lineListButtonWrapper'));
        $('#openPointPane').on('click', function () {
            togglePane('#pointsWrapper');
        });
        //mapPointList.updateToolNode(document.querySelector('#pointListButtonWrapper'));
        $('#openEditionPane').on('click', function () {
            togglePane('#editionWrapper');
        });
        //#endregion
    }
}
//# sourceMappingURL=UIControl.js.map