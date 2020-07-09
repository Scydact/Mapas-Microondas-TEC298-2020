import { ObjectAssignProperty, createElement, createLabel, titleCase, createSelect, Restorable } from "./Utils.js";
import { MapLoader } from "./MapLoader.js";
import { timers } from "jquery";

type PropertyChangeHandler = (changedValue?: string, newValue?: any, oldValue?: any) => any;

/**
 * Constains simple settings, and methods to load them to the forms
 */
export class Settings implements Restorable {
    static dataProperties = [
        'map',
        'snap',
        'paneState'
    ];

    version = 1.2;
    map = 'hato_mayor';
    snap = true;


    paneState = {
        config: false,
        elements: false,
        selectedElement: 0,
        edit: false,
    }

    //#region Pane managers
    panes = {
        config: new PaneButtonPair($('#settingsWrapper')[0], $('#openSettingsPane')[0]),
        elements: new PaneButtonPair($('#elementsWrapper')[0], $('#openElementsPane')[0]),
        edit: new PaneButtonPair($('#editionWrapper')[0], $('#openEditionPane')[0]),
    }

    elementTabs = new TabCollection([
        new PaneButtonPair($('#linesWrapper')[0], $('#openLinePane')[0]),
        new PaneButtonPair($('#pointsWrapper')[0], $('#openPointPane')[0]),
    ]);
    //#endregion

    /** Gets the state of the panes and saves them */
    getOpenPanes() {
        let op = this.paneState;
        let p = this.panes;
        let et = this.elementTabs;

        op.config = p.config.get();
        op.elements = p.elements.get();
        op.selectedElement = et.get();
        op.edit = p.edit.get();
        return op;
    }

    /** Sets the state of the panes to HTML */
    setOpenPanes() {
        let op = this.paneState;
        let p = this.panes;
        let et = this.elementTabs;

        p.config.set(op.config);
        p.elements.set(op.elements);
        et.set(op.selectedElement);
        p.edit.set(op.edit);

        return true;
    }

    /**
     * Calls every handler inside .eventHandlerList_PropertyChanged
     * @param property Property that changed.
     * @param newValue New value of the property.
     * @param oldValue Old value of the property.
     */
    private propertyChanged(property: string, newValue, oldValue) {
        this.eventHandlerList_PropertyChanged.forEach(
            (e) => e(property, newValue, oldValue));
    }
    
    /**
     * Changes a property of this object, and calls the corresponding event handler.
     * @param property Property to change.
     * @param value Value to set the property to.
     */
    prop(property: string, value) {
        if (Settings.dataProperties.includes(property)) {
            this.propertyChanged(property, value, this[property]);
            this[property] = value;
        }
        return true;
    }

    /**
     * List of all the functions that will be notified when a property changes via .prop()
     */
    eventHandlerList_PropertyChanged: PropertyChangeHandler[] = [];

    /**
     * Creates a generic object with this object's properties.
     */
    toJObject() {
        this.getOpenPanes();
        let o = {};
        Settings.dataProperties.forEach((e) => o[e] = this[e]);
        o['version'] = this.version;
        return o;
    }

    /**
     * Returns a Json String containing the Object made with .toJObject()
     * @param settingsObj 
     */
    static stringify(settingsObj: Settings) {
        let genericObject = settingsObj.toJObject();
        return JSON.stringify(genericObject);
    }

    /**
     * Assigns every value of the given object to this Settings object. 
     * @param object Object to assign from
     */
    assign(object) {
        Settings.dataProperties.forEach((e) => ObjectAssignProperty(this, object, e));
        this.setOpenPanes();
        return true;
    }

    /**
     * Returns a new Settings object from a given JSON string.
     * @param jsonString JSON string to parse.
     */
    static parse(jsonString: string) {
        let a = new Settings();
        return a.assign(JSON.parse(jsonString));
    }

    /**
     * Fills the given node with a form to edit settings.
     * @param wrapperNode Parent node to fill.
     * @param mapLoader MapLoader object, used to change/get currentMap.
     */
    updateSettingsNode(wrapperNode: HTMLElement, mapLoader: MapLoader) {
        wrapperNode.innerHTML = '';

        {   // Version
            document.getElementById('versionDisplay').innerHTML = `v${this.version}`;
        }
        
        {   // Mapa
            let d = createElement(wrapperNode, 'div');
            createElement(d, 'h2', 'Mapa');
            $(createLabel(d, 'Mapa: ', 'El mapa actualmente cargado.')).prop('for','setting_current_map');
            let maps = ['azua', 'constanza', 'hato_mayor', 'jarabacoa', 'puerto_plata'];
            let formattedMaps = maps.map((e) => titleCase(e.replace('_',' ')));
            let mapSelector = createSelect(d, maps, formattedMaps);
            mapSelector.id = 'setting_current_map';
            mapSelector.value = mapLoader.currentMap;

            // Update propertyChanged for map
            $(mapSelector).change((e) => {
                let newVal = mapSelector.value;
                this.prop('map', newVal);
            });
            
            // Add onMapChange handler
            mapLoader.eventHandlerList_MapChanged.push(
                (map) => {
                    let oldValue = this.map;
                    mapSelector.value = map;
                    this.prop('map', map);
                });
        }

        {   // Snap
            let d = createElement(wrapperNode, 'div');
            createElement(d, 'h2', 'Snap');
            $(createLabel(d, 'Snap: ', 'Similar al snap de los programas CAD, \npermite hacer click directamente sobre los elementos de forma exacta.')).prop('for','setting_snap');
            let checkBox = createElement(d,'input') as HTMLInputElement;
            checkBox.id = 'setting_snap';
            $(checkBox).prop('type', 'checkbox');
            checkBox.checked = this.snap;
            $(checkBox).change((e) => {
                let val = checkBox.checked;
                this.prop('snap', val);
            });
        }
    }
}

/** Manages a single Pane-Button pair that depend on each other to show/hide. */
class PaneButtonPair {
    button: HTMLElement;
    pane: HTMLElement;

    constructor(pane, button, initialState?: boolean) {
        this.pane = pane;
        this.button = button;
        this.button.addEventListener('click', (e) => {
            this.toggle();
        })
        this.set(initialState);
    }

    /** If true, opens the pane */
    set(state: boolean) {
        if (state) {
            this.pane.classList.add('active');
            this.button.classList.add('active');
        }
        else {
            this.pane.classList.remove('active');
            this.button.classList.remove('active');
        }
    }

    /** Toggles the state of the pane */
    toggle() {
        this.set(!this.get());
    }

    /** Gets the state of the pane */
    get() {
        return this.pane.classList.contains('active');
    }
}

/** Only allows one item in the collection to be active */
class TabCollection {
    tabs: PaneButtonPair[]
    currentTab = 0;

    constructor(PanePairs: PaneButtonPair[], firstOpenId?: number) {
        this.tabs = PanePairs;
        this.tabs.forEach((e, i) => {
            e.button.addEventListener('click', (k) => {
                this.close();
                this.set(i);
            });
        })
        let idToOpen = (firstOpenId !== undefined && firstOpenId < PanePairs.length) ? firstOpenId : 0;
        this.set(idToOpen);
    }

    /** Closes all the panes */
    close() {
        let o = Object.values(this.tabs);
        o.forEach((e) => {
            e.set(false);
        })
    }

    /** Opens the selected pane */
    set(id: number) {
        this.currentTab = id;
        this.close();
        if (this.tabs[id]) {
            this.tabs[id].set(true);
        }
    }

    get() {
        return this.currentTab;
    }
}