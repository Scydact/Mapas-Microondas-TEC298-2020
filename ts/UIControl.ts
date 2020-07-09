import { App } from './App.js';
import { Point } from './Point.js';
import {
    TopStatusMessageDisplay,
    StatusBarMessageDisplay,
    MouseMessageDisplay,
} from './Panes.js';
import { ClickMode } from './ClickMode.js';
import { MapLine, MapPoint, TopographicProfilePoint, MapObjectList, MapLineList, MapObject } from './MapObject.js';
import { EditPane } from './EditPane.js';
import { timers } from 'jquery';
import { Line } from './Line.js';

/**
 * * Main auxiliary class of this map application. Should be loaded once.
 * (Though nothing stops you from creating more than one.)
 * All interactivty (click events and such) are handled here.
 * So it has control over the main App.
 */
export class InteractivityManager {
    app: App;
    clickMode: ClickMode;
    editPane: EditPane;

    clicking = false;
    dragging = false;
    modifier = {
        shift: false,
        ctrl: false,
        alt: false,
    };

    scaleMultiplier = 0.8;
    touchZooming = 0;
    touchZoomingDistance = 0;
    touchScaleMultiplier = 1 / 100;

    startDragOffset = new Point(0, 0);

    hoverDistance = 7; // TODO: Move to settings

    temp = {
        lineTool: {
            draftLine: new MapLine(this.app),
            p1: Point.ZERO(),
        },
        topoPointTool: {
            draftLine: new MapLine(this.app),
            sourceLine: new MapLine(this.app),
        }
    };

    out = {
        topMsgBar: new TopStatusMessageDisplay(),
        statusBar: new StatusBarMessageDisplay(),
        mouseBar: new MouseMessageDisplay(),
    };

    constructor(app: App) {
        this.app = app;
        this.clickMode = new ClickMode(app);
        this.editPane = new EditPane(app);
    }

    /** Returns this.map.objectList, but filtered. */
    _getCurrentHover() {
        let iterateValues = Object.entries(this.app.objectList);
        let output = {};
        iterateValues.forEach((e) => {
            let prop = e[0] as string;
            let val = e[1] as MapObjectList;
            output[prop] = val.getState('hover');
        })
        return output;
    }

    /**
     *
     * @param newPoint New mouse position
     */
    handlerScreenPointMove(newPoint: Point) {
        if (this.clicking) {// TODO: Start dragging only after <dragging> a few px from the center.
            this.dragging = true;
            let translate = this.app.posState.translate;
            translate.assign(Point.Minus(newPoint, this.startDragOffset));
        }

        // Set mouse pointer to 'move' if dragging
        $(this.app.canvas).toggleClass('move', this.dragging);

        // Update mousePos / coordPos global vars
        let snapData = this.updateAllMousePoints(newPoint);

        // Update hover status
        this.app.objectListList.forEach((e) => {
            e.setState('hover', false);
            e.getCloseToScreenPoint(newPoint, this.hoverDistance).forEach((e) => (e.state.hover = true));
            e.updateNode();
        })

        // Display tooltip
        let formattedPosition = this.app.mapMeta.sexagecimalCanvasPointToCoordPoint(this.app.mouse.canvas);
        let msg = `Pos: (${formattedPosition.x}, ${formattedPosition.y})`;
        if (snapData.snapObjectType) {
            let snapObj = snapData.snapObject as MapObject;
            msg += '\n' + snapObj.getHoverMessageContent();
        };
        if (this.app.settings.snap && snapData.snapObjectType && this.clickMode.mode) {
            msg += snapData.snapMessage;
        }

        switch (this.clickMode.mode) {
            case 'setLinePoint1':                
                break;
            case 'setLinePoint2':
                break;
            case 'setPointMarker':
                break;
            case 'setTopographicPoint': {
                let tpt = this.temp.topoPointTool;
                tpt.draftLine.l.p2 = 
                    Line.PointProjection(tpt.sourceLine.l, this.app.mouse.canvasSnap);
            }
        }

        this.out.mouseBar.set(msg);
        this.out.mouseBar.setPosition(this.app.mouse.screen);

        // Final draw
        this.app.draw();
    }

    /** Updates all mousepoints of this.app. If updateSnap is set, returns the snap msg along with the snap object. */
    updateAllMousePoints(newPoint: Point, updateSnap?: boolean) {
        let pointList = this.app.mouse;

        // Screen point
        pointList.screen.assign(newPoint);

        // Canvas point
        let canvasPoint = this.app.screenPointToCanvasPoint(newPoint);
        pointList.canvas.assign(canvasPoint);

        // Snap point
        let snapPoint = newPoint;
        var outObject = {snapObject: null, snapMessage: null, snapObjectType: null};
        let hoverList: {line: MapLine[], point: MapPoint[]} = this._getCurrentHover() as {line: MapLine[], point: MapPoint[]};
        /**
         * Priority:
         * - Point
         * - Line
         */
        let snapObject = null;
        if (hoverList.point.length) {
            let tempP = hoverList.point[0].p;
            snapPoint = this.app.canvasPointToScreenPoint(tempP);
            outObject.snapMessage = '[Snap a punto]';
            outObject.snapObject = tempP;
            outObject.snapObjectType = 'point';
        }
        else if (hoverList.line.length) {
            let tempL = hoverList.line[0].l;
            let tempP = Line.PointProjection(tempL, canvasPoint);
            snapPoint = this.app.canvasPointToScreenPoint(tempP);
            outObject.snapMessage = '[Snap a linea]';
            outObject.snapObject = tempL;
            outObject.snapObjectType = 'line';
        }

        let canvasSnap = this.app.screenPointToCanvasPoint(snapPoint);
        // let snapDelta = Point.Minus(canvasPoint, canvasSnap)
        // console.log(`SnapDelta: {x: ${snapDelta.x}, y: ${snapDelta.y}}`)
        pointList.screenSnap.assign(snapPoint);
        pointList.canvasSnap.assign(canvasSnap);

        return outObject;
    }

    handlerScreenPointClick(newPoint: Point) {
        this.updateAllMousePoints(newPoint);
        let mouse = this.app.mouse;

        if (!this.dragging) {
            switch (this.clickMode.mode) {
                case 'setLinePoint1': {
                    this.temp.lineTool.p1 = mouse.canvasSnap.copy();
                    this.temp.lineTool.draftLine.app = this.app;
                    this.temp.lineTool.draftLine.l.p1 = this.temp.lineTool.p1;
                    this.temp.lineTool.draftLine.l.p2 = mouse.canvasSnap;
                    this.clickMode.set('setLinePoint2');
                    this.out.topMsgBar.set('Click en el 2do punto de la linea');
                    break;
                }
                case 'setLinePoint2': {
                    let p1 = this.temp.lineTool.p1.copy();
                    let p2 = mouse.canvasSnap.copy();
                    let m = MapLine.fromPoints(p1, p2, this.app);
                    m.state.active = true;
                    this.app.objectList.line.add(m);
                    this.clickMode.clear();
                    break;
                }
                case 'setPointMarker': {
                    let m = MapPoint.fromPoint(
                        mouse.canvasSnap.copy(),
                        this.app
                    );
                    m.state.active = true;
                    this.app.objectList.point.add(m);
                    this.clickMode.clear;
                    break;
                }
                case 'setTopographicPoint': {
                    let hTxt = prompt('Altura de punto: ', '');
                    if (hTxt) {
                        let h = parseFloat(hTxt);
                        let targetLine = this.temp.topoPointTool.sourceLine;

                        targetLine.topoPoints.add(
                            TopographicProfilePoint.fromCanvasPoint(
                                targetLine,
                                mouse.canvasSnap.copy(),
                                h
                            )
                        )
                        // TODO: Remove these comments
                        // let tpt = this.temp.topoPointTool;
                        // tpt.draftLine.l.p2 = 
                        //     Line.PointProjection(tpt.sourceLine.l, this.app.mouse.canvasSnap);
                        //temp.topo.add(screenToMapPos(snapPos), h);
                    }
                    break;
                }

                default: {
                    this.app.objectListList.forEach((e) => {
                        if (!this.modifier.shift) {
                            e.setState('active', false);
                        }
                        e
                            .getCloseToScreenPoint(newPoint, this.hoverDistance)
                            .forEach((e) => (e.state.active = true));
                            
                        e.updateNode();
                    });
                    break;
                }
            }
            this.editPane.selfUpdate();
        }

        // Clear clicking (this is a mouse up) and dragging tags
        this.clicking = false;
        this.dragging = false;

        // Final draw
        this.app.draw();
    }

    handlerScreenPointClickDown(newPoint: Point) {
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

            case 'ESCAPE':
                this.clickMode.clear();
                break;

            case 'DELETE': {
                let hover = 
                this.app.objectList.line.toolbox.deleteElement(true);
                this.app.objectList.point.toolbox.deleteElement(true);
                this.editPane.selfUpdate();
                break;
            }

            case 'L':
                this.app.objectList.line.toolbox.createElement();
                break;

            case 'P':
                this.app.objectList.point.toolbox.createElement();
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

    // Pane functionality, as methods in case any other thing wants to use it.
    PaneIdList = [
        '#settingsWrapper',
        '#linesWrapper',
        '#pointsWrapper',
        '#editionWrapper',
    ];

    /**
     * Close all panes on PaneIdList
     */
    paneCloseAll() {
        this.PaneIdList.forEach((e) => $(e).addClass('disabled'));
    }
    /**
     * Toggles an specific pane
     * @param selector Selector of the pane to close
     */
    togglePane(selector: string) {
        let j = $(selector);
        if (j.hasClass('disabled')) {
            this.paneCloseAll();
            j.removeClass('disabled');
        } else {
            this.paneCloseAll();
        }
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

        $(canvas).on('mousemove', (e) =>
            this.handlerScreenPointMove(InteractivityManager.MouseEvtToPos(e))
        );
        $(canvas).on('mousedown', (e) =>
            this.handlerScreenPointClickDown(
                InteractivityManager.MouseEvtToPos(e)
            )
        );
        $(canvas).on('mouseup', (e) =>
            this.handlerScreenPointClick(InteractivityManager.MouseEvtToPos(e))
        );

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
            let scaleMult =
                e.deltaY > 0 ? T.scaleMultiplier : 1 / T.scaleMultiplier;
            let centerPoint = new Point(e.offsetX, e.offsetY);
            app.posState.zoomAtPosition(
                centerPoint,
                app.posState.scale * scaleMult
            );
            app.draw();
        });
        //#endregion

        //#region Zoom buttons
        $('#zoomPlus').on('click', () => {
            let centerP = new Point(canvas.width / 2, canvas.height / 2);
            let newScale = this.app.posState.scale / this.scaleMultiplier;
            this.app.posState.zoomAtPosition(centerP, newScale);
            this.app.draw();
        });

        $('#zoomMinus').on('click', () => {
            let centerP = new Point(canvas.width / 2, canvas.height / 2);
            let newScale = this.app.posState.scale * this.scaleMultiplier;
            this.app.posState.zoomAtPosition(centerP, newScale);
            this.app.draw();
        });

        $('#zoomReset').on('click', () => {
            //scale *= scaleMultiplier;
            this.app.mapLoader.setDefaultZoom(this.app.posState);
            this.app.draw();
        });
        //#endregion

        //#region Side panes

        $('#openSettings').on('click', function () {
            // These things should be managed by Settings.ts
            //mapMeta.loadToSetup();
            //$('#snapCheckbox').prop('checked', snapEnabled);
            T.togglePane('#settingsWrapper');
        });

        $('#openLinePane').on('click', function () {
            T.togglePane('#linesWrapper');
        });
        //mapLineList.updateToolNode(document.querySelector('#lineListButtonWrapper'));

        $('#openPointPane').on('click', function () {
            T.togglePane('#pointsWrapper');
        });
        //mapPointList.updateToolNode(document.querySelector('#pointListButtonWrapper'));

        $('#openEditionPane').on('click', function () {
            T.togglePane('#editionWrapper');
        });

        //#endregion

        //#region Tool buttons
        $('#toolPointer').on('click', (e) => this.clickMode.clear());
        $('#toolLine').on('click', () =>
            this.app.objectList.line.toolbox.createElement()
        );
        $('#toolPoint').on('click', () =>
            this.app.objectList.point.toolbox.createElement()
        );

        //#endregion
    }
}
