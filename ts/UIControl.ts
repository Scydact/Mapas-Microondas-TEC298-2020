import { App } from './App.js';
import { Point } from './Point.js';
import {
    TopStatusMessageDisplay,
    StatusBarMessageDisplay,
    MouseMessageDisplay,
    DialogDisplay,
} from './Panes.js';
import { ClickMode } from './ClickMode.js';
import {
    MapLine,
    MapPoint,
    TopographicProfilePoint,
    MapObjectList,
    MapLineList,
    MapObject,
    MapObjectState,
} from './MapObject.js';
import { EditPane } from './EditPane.js';
import { timers } from 'jquery';
import { Line } from './Line.js';

type AppMapObjectGroup = { line: MapLine[]; point: MapPoint[] };
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
    startDrag = new Point(0, 0);

    hoverDistance = 7; // TODO: Move to settings
    hoverDistanceFactor = 1;

    DEBUG_DRAG = 0;

    temp = {
        lineTool: {
            draftLine: new MapLine(this.app),
            p1: Point.ZERO(),
        },
        topoPointTool: {
            draftLine: new MapLine(this.app),
            sourceLine: new MapLine(this.app),
        },
    };

    out = {
        topMsg: new TopStatusMessageDisplay(),
        status: new StatusBarMessageDisplay(),
        mouse: new MouseMessageDisplay(),
        dialog: new DialogDisplay(),
    };

    constructor(app: App) {
        this.app = app;
        this.clickMode = new ClickMode(app);
        this.editPane = new EditPane(app);
    }

    _getMouseDistanceThreshold() {
        return devicePixelRatio * this.hoverDistance * this.hoverDistanceFactor;
    }

    /** Returns this.map.objectList, but filtered with the given state. */
    _getCurrentState(
        state: MapObjectState,
        value?: boolean
    ): AppMapObjectGroup {
        if (value === undefined) {
            value = true;
        }

        let iterateValues = Object.entries(this.app.objectList);
        let output = {};
        iterateValues.forEach((e) => {
            let prop = e[0] as string;
            let val = e[1] as MapObjectList;
            output[prop] = val.getState(state, value);
        });
        return output as AppMapObjectGroup;
    }

    /** Returns this.map.objectList, but filtered. */
    _getCurrentHover(): AppMapObjectGroup {
        return this._getCurrentState('hover');
    }

    /**
     *
     * @param newPoint New mouse position
     */
    handlerScreenPointMove(newPoint: Point) {
        let newPointScaled = Point.ScalarProduct(newPoint, devicePixelRatio);
        let mouseDistanceThreshold = this._getMouseDistanceThreshold();

        if (this.clicking) {
            if (!this.dragging) {
                let dragDist = Point.Distance(this.startDrag, newPointScaled);
                this.DEBUG_DRAG = dragDist;
                let dragThreshold = 2 * devicePixelRatio + 2;
                if (dragDist > dragThreshold) this.dragging = true;
            }

            if (this.dragging)
                this.app.posState.translate.assign(
                    Point.Minus(newPointScaled, this.startDragOffset)
                );
        }

        // Set mouse pointer to 'move' if dragging
        $(this.app.canvas).toggleClass('move', this.dragging);

        // Update mousePos / coordPos global vars
        let snapData = this.updateAllMousePoints(newPointScaled);

        // Update hover status
        this.app.objectListList.forEach((e) => {
            e.setState('hover', false);
            e.getCloseToScreenPoint(
                newPointScaled,
                mouseDistanceThreshold
            ).forEach((e) => e.setState('hover', true));
            e.updateNode();
        });

        // Update hover of topopoints (if available)
        let currentActive = this._getCurrentState('active');
        if (
            currentActive.line.length == 1 &&
            currentActive.point.length == 0 &&
            currentActive.line[0].getDistanceToScreenPoint(newPointScaled) <
                mouseDistanceThreshold
        ) {
            // If clicked near the line, actuate the hoverPoints.
            // Direct copy from below, but applied to TopoPoints.
            let currentLine = currentActive.line[0];
            currentLine.topoPoints.setState('hover', false);
            let topoCloseToScreen = currentLine.topoPoints.getCloseToScreenPoint(
                newPointScaled,
                mouseDistanceThreshold
            );
            topoCloseToScreen.forEach((e) => e.setState('hover', true));
            currentLine.topoPoints.updateNode();
        }

        // Display tooltip
        let formattedPosition = this.app.mapMeta.sexagecimalCanvasPointToCoordPoint(
            this.app.mouse.canvas
        );
        let msg = `Pos: (${formattedPosition.x}, ${formattedPosition.y})`;
        if (this.app.DEBUG)
            msg += `\nCurrent Canvas Position: ${this.app.mouse.canvas.x.toFixed(
                2
            )}, ${this.app.mouse.canvas.y.toFixed(2)}`; //DEBUG, for adding new maps
        if (snapData.snapObjectType) {
            let snapObj = snapData.snapObject as MapObject;
            msg += '\n' + snapObj.getHoverMessageContent();
        }
        if (
            this.app.settings.snap &&
            snapData.snapObjectType &&
            this.clickMode.mode
        ) {
            msg += ' ' + snapData.snapMessage;
        }

        switch (this.clickMode.mode) {
            case 'setLinePoint1':
                break;
            case 'setLinePoint2':
                msg += `\nd = ${this.temp.lineTool.draftLine.getFormattedLength()}`;
                break;
            case 'setPointMarker':
                break;
            case 'setTopographicPoint': {
                let tpt = this.temp.topoPointTool;
                let LineProjection = Line.PointProjection(
                    tpt.sourceLine.l,
                    this.app.mouse.canvasSnap
                );
                tpt.draftLine.l.p2 = LineProjection;
                let distance = Point.Distance(
                    LineProjection,
                    tpt.sourceLine.l.p1
                );
                msg += `\nd = ${this.app.DistanceFormat.canvas2unit(distance)}`;
            }
        }

        this.out.mouse.set(msg);
        this.out.mouse.setPosition(newPoint);

        // Final draw
        this.app.draw();
    }

    /** Updates all mousepoints of this.app. If updateSnap is set, returns the snap msg along with the snap object. */
    updateAllMousePoints(newPoint: Point) {
        let pointList = this.app.mouse;

        // Screen point
        pointList.screen.assign(newPoint);

        // Canvas point
        let canvasPoint = this.app.screenPointToCanvasPoint(newPoint);
        pointList.canvas.assign(canvasPoint);

        // Snap point
        let snapPoint = newPoint;
        let snapEnabled = this.app.settings.snap;
        var outObject = {
            snapObject: null,
            snapMessage: null,
            snapObjectType: null,
        };
        let hoverList = this._getCurrentHover();
        /**
         * Priority:
         * - Point
         * - Line
         */
        let snapObject = null;
        if (hoverList.point.length) {
            let tempP = hoverList.point[0].p;
            if (snapEnabled)
                snapPoint = this.app.canvasPointToScreenPoint(tempP);
            outObject.snapMessage = '[Snap a punto]';
            outObject.snapObject = hoverList.point[0];
            outObject.snapObjectType = 'point';
        } else if (hoverList.line.length) {
            let tempL = hoverList.line[0].l;
            let tempP = Line.PointProjection(tempL, canvasPoint);
            if (snapEnabled)
                snapPoint = this.app.canvasPointToScreenPoint(tempP);
            outObject.snapMessage = '[Snap a linea]';
            outObject.snapObject = hoverList.line[0];
            outObject.snapObjectType = 'line';

            // Snap at topo point
            let topoHover = hoverList.line[0].topoPoints.getCloseToScreenPoint(
                newPoint,
                this._getMouseDistanceThreshold()
            );
            if (topoHover.length) {
                let o = topoHover[0] as TopographicProfilePoint;
                if (snapEnabled)
                    snapPoint = this.app.canvasPointToScreenPoint(o.p);
                outObject.snapMessage = '[Snap a punto topo]';
                outObject.snapObject = o;
                outObject.snapObjectType = 'topoPoint';
            }
        }

        let canvasSnap = this.app.screenPointToCanvasPoint(snapPoint);
        // let snapDelta = Point.Minus(canvasPoint, canvasSnap)
        // console.log(`SnapDelta: {x: ${snapDelta.x}, y: ${snapDelta.y}}`)
        pointList.screenSnap.assign(snapPoint);
        pointList.canvasSnap.assign(canvasSnap);

        return outObject;
    }

    handlerScreenPointClick(newPoint: Point) {
        let newPointScaled = Point.ScalarProduct(newPoint, devicePixelRatio);
        this.updateAllMousePoints(newPointScaled);
        let mouse = this.app.mouse;

        let mouseDistanceThreshold = this._getMouseDistanceThreshold();

        if (!this.dragging) {
            switch (this.clickMode.mode) {
                case 'setLinePoint1': {
                    this.temp.lineTool.p1 = mouse.canvasSnap.copy();
                    this.temp.lineTool.draftLine.app = this.app;
                    this.temp.lineTool.draftLine.l.p1 = this.temp.lineTool.p1;
                    this.temp.lineTool.draftLine.l.p2 = mouse.canvasSnap;
                    this.clickMode.set('setLinePoint2');
                    this.out.topMsg.set('Click en el 2do punto de la linea');
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
                case 'selectTopographicLine': {
                    // copy of default case.
                    this.app.objectListList.forEach((e) => {
                        if (!this.modifier.shift) {
                            e.setState('active', false);
                        }
                        e.getCloseToScreenPoint(
                            newPointScaled,
                            mouseDistanceThreshold
                        ).forEach((e) => e.flipState('active'));

                        e.updateNode();
                    });

                    this.topoToolClick();
                    break;
                }
                case 'setTopographicPoint': {
                    let l = this.temp.topoPointTool.sourceLine.topoPoints;
                    l.toolbox.createElementPrompt(mouse.canvasSnap.copy());
                    break;
                }

                default: {
                    // If topopoint is active.
                    let currentActive = this._getCurrentState('active');
                    if (
                        currentActive.line.length == 1 &&
                        currentActive.point.length == 0 &&
                        currentActive.line[0].getDistanceToScreenPoint(
                            newPointScaled
                        ) < mouseDistanceThreshold
                    ) {
                        // If clicked near the line, actuate the hoverPoints.
                        // Direct copy from below, but applied to TopoPoints.
                        let currentLine = currentActive.line[0];
                        if (!this.modifier.shift) {
                            currentLine.topoPoints.setState('active', false);
                        }
                        let topoCloseToScreen = currentLine.topoPoints.getCloseToScreenPoint(
                            newPointScaled,
                            mouseDistanceThreshold
                        );
                        topoCloseToScreen.forEach((e) => e.flipState('active'));
                    } else {
                        // Interact with lines//points
                        this.app.objectListList.forEach((e) => {
                            if (!this.modifier.shift) {
                                e.setState('active', false);
                            }
                            e.getCloseToScreenPoint(
                                newPointScaled,
                                mouseDistanceThreshold
                            ).forEach((e) => e.flipState('active'));
                            e.updateNode();
                        });
                    }
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
        let newPointScaled = Point.ScalarProduct(newPoint, devicePixelRatio);
        this.clicking = true;
        let translate = this.app.posState.translate;

        this.startDragOffset.assign(Point.Minus(newPointScaled, translate));
        this.startDrag.assign(newPointScaled);
    }

    handlerKeyUp(keyEvent) {
        if (this.out.dialog.getVisible()) {
            this.out.dialog._onKeyUp(keyEvent);
            return;
        }

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
                let activeList = this._getCurrentState('active');
                if (activeList.line.length == 1 && !activeList.point.length) {
                    let l = activeList.line[0];
                    if (l.topoPoints.getState('active').length)
                        l.topoPoints.toolbox.deleteElement(true);
                    else this.app.objectList.line.toolbox.deleteElement(true);
                } else {
                    this.app.objectList.line.toolbox.deleteElement(true);
                    this.app.objectList.point.toolbox.deleteElement(true);
                }
                this.editPane.selfUpdate();
                break;
            }

            case 'L':
                this.app.objectList.line.toolbox.createElement();
                break;

            case 'P':
                this.app.objectList.point.toolbox.createElement();
                break;

            case 'Z': {
                if (modifier.ctrl) {
                    this.app.undoman.undo();
                }
                break;
            }

            case 'Y': {
                if (modifier.ctrl) {
                    this.app.undoman.redo();
                }
            }
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

    static TouchEvtToPos(evt, index?: number) {
        if (index === undefined) index = 0;
        let x = evt.originalEvent.changedTouches[index];
        return new Point(x.clientX, x.clientY);
    }

    // Pane functionality, as methods in case any other thing wants to use it.
    PaneIdList = [
        '#settingsWrapper',
        '#linesWrapper',
        '#pointsWrapper',
        '#editionWrapper',
    ];

    // /**
    //  * Close all panes on PaneIdList
    //  */
    // paneCloseAll() {
    //     this.PaneIdList.forEach((e) => $(e).addClass('disabled'));
    // }
    // /**
    //  * Toggles an specific pane
    //  * @param selector Selector of the pane to close
    //  */
    // togglePane(selector: string) {
    //     let j = $(selector);
    //     if (j.hasClass('disabled')) {
    //         this.paneCloseAll();
    //         j.removeClass('disabled');
    //     } else {
    //         this.paneCloseAll();
    //     }
    // }

    topoToolClick() {
        this.editPane.selfUpdate();
        this.app.settings.panes.edit.set(true); // Open element edit pane
        let active = this.editPane.active;
        if (active.length) {
            let condition = active[0].length == 1 && !active[1].length; // only 1 line selected

            if (condition) {
                let currentLine = active[0][0] as MapLine;
                currentLine.topoPoints.toolbox.createElement();
            } else {
                this.app.interman.clickMode.set('selectTopographicLine');
                this.app.interman.out.topMsg.set(
                    'Seleccione una linea para crear su perfil topografico.'
                );
            }
        } else {
            console.log('ERROR: editPane.active esta vacio?...');
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

        $(canvas).on('mousemove', (e) => {
            this.hoverDistanceFactor = 1;
            this.handlerScreenPointMove(InteractivityManager.MouseEvtToPos(e));
        });
        $(canvas).on('mousedown', (e) => {
            this.hoverDistanceFactor = 1;
            this.handlerScreenPointClickDown(
                InteractivityManager.MouseEvtToPos(e)
            );
        });
        $(canvas).on('mouseup', (e) => {
            this.hoverDistanceFactor = 1;
            this.handlerScreenPointClick(InteractivityManager.MouseEvtToPos(e));
        });

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
            let centerPoint = new Point(
                devicePixelRatio * e.offsetX,
                devicePixelRatio * e.offsetY
            );
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

        //#region Touch support

        $(canvas).on('touchstart', (e) => {
            this.hoverDistanceFactor = devicePixelRatio;
            e.preventDefault(); //sets preventDefault tag;
            $(canvas).focus(); // Avoids very weird glitches related to random clicking
            let oe = e.originalEvent;

            if (oe.touches.length == 1) {
                this.handlerScreenPointClickDown(
                    InteractivityManager.TouchEvtToPos(e)
                );

                this.handlerScreenPointMove(
                    InteractivityManager.TouchEvtToPos(e)
                );
            } else if (oe.touches.length == 2) {
                //TODO: Implement zoom by touch
                // touchZooming = 2;
                // let t1 = oe.touches[0];
                // let t2 = oe.touches[1];
                // let p1 = new p(t1.clientX, t1.clientY);
                // let p2 = new p(t2.clientX, t2.clientY);
                // touchZoomingDistance = p.Distance(p1, p2);
            }
        });

        $(canvas).on('touchmove', (e) => {
            this.hoverDistanceFactor = devicePixelRatio;
            e.preventDefault(); //sets preventDefault tag;
            let oe = e.originalEvent;
            $(canvas).focus(); // Avoids very weird glitches related to random clicking

            if (oe.touches.length == 1) {
                this.handlerScreenPointMove(
                    InteractivityManager.TouchEvtToPos(e)
                );
            } else if (oe.touches.length >= 2) {
                //TODO: Implement zoom by touch
                // let t1 = oe.touches[0];
                // let t2 = oe.touches[1];
                // let p1 = new p(t1.clientX, t1.clientY);
                // let p2 = new p(t2.clientX, t2.clientY);
                // let d = p.Distance(p1, p2);
                // let centerPoint = p.MidPoint(p1, p2);
                // let dx = d - touchZoomingDistance;
                // let scaleMult = 1;
                // let threshold = 2;
                // let scaledDx = Math.abs(dx*touchScaleMultiplier);
                // if (dx > 0) {
                //     scaleMult = 1 + scaledDx;
                // }
                // else if (dx < 0) {
                //     scaleMult = 1 / (1 + scaledDx);
                // }
                // // if (dx < -threshold) {
                // //     scaleMult = scaleMultiplier;
                // //     console.log(`Zooming out: ${d} : ${dx}`);
                // // }
                // // else if (dx > threshold) {
                // //     scaleMult = 1 / scaleMultiplier;
                // //     console.log(`Zooming in: ${d} : ${dx}`);
                // // }
                // // else {
                // //     console.log(`Not zooming`);
                // // }
                // zoomAtPosition(centerPoint.x, centerPoint.y, scale * scaleMult);
                // draw();
                // touchZoomingDistance = d; // save to previous state;
            }
        });

        $(canvas).on('touchend', (e) => {
            this.hoverDistanceFactor = devicePixelRatio;
            //touchend is registered as a mouse up somewhere else????
            e.preventDefault();
            $(canvas).focus(); // Avoids very weird glitches related to random clicking
            // if (touchZooming) {
            //     touchZooming--;
            //     return;
            // }

            this.handlerScreenPointClick(InteractivityManager.TouchEvtToPos(e));
        });

        $('.toolBtn').on('touchend', (e) => $(canvas).focus());

        //#endregion

        //#region Tool buttons
        $('#toolPointer').on('click', (e) => this.clickMode.clear());
        $('#toolLine').on('click', () =>
            this.app.objectList.line.toolbox.createElement()
        );
        $('#toolPoint').on('click', () =>
            this.app.objectList.point.toolbox.createElement()
        );
        $('#toolTopoPoint').on('click', () => this.topoToolClick());

        //#endregion
    }
}
