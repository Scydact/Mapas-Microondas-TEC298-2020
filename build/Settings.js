import { ObjectAssignProperty, createElement, createLabel, createSelect, lineBreak, } from './Utils.js';
import { MapLoader } from './MapLoader.js';
const DistanceUnitsLongNames = {
    m: 'Metros',
    km: 'Kilometros',
    mi: 'Millas terrestres',
    nmi: 'Millas nauticas',
    ft: 'Pies',
    cu: 'CU',
};
/**
 * Multiply Metre by this value to convert to the desired unit.
 * Divide the unit by this value to convert back to metre.
 * */
export const MetreConversion = {
    m: 1,
    km: 1 / 1000,
    cu: 0.236284125751452,
    mi: 1 / 1609.344,
    nmi: 1 / 1852,
    ft: 0.3048,
};
/**
 * Constains simple settings, and methods to load them to the forms
 */
export class Settings {
    constructor() {
        this.version = 1.4;
        this.map = 'hato_mayor';
        this.snap = true;
        this.distanceUnits = 'km';
        this.distanceDigits = 2;
        this.calcDigits = 2;
        this.calcFrequency = 1e9;
        this.paneState = {
            config: false,
            elements: false,
            selectedElement: 0,
            edit: false,
        };
        //#region Pane managers
        this.panes = {
            config: new PaneButtonPair($('#settingsWrapper')[0], $('#openSettingsPane')[0]),
            elements: new PaneButtonPair($('#elementsWrapper')[0], $('#openElementsPane')[0]),
            edit: new PaneButtonPair($('#editionWrapper')[0], $('#openEditionPane')[0]),
        };
        this.elementTabs = new TabCollection([
            new PaneButtonPair($('#linesWrapper')[0], $('#openLinePane')[0]),
            new PaneButtonPair($('#pointsWrapper')[0], $('#openPointPane')[0]),
        ]);
        /**
         * List of all the functions that will be notified when a property changes via .prop()
         */
        this.eventHandlerList_PropertyChanged = [];
    }
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
    propertyChanged(property, newValue, oldValue) {
        this.eventHandlerList_PropertyChanged.forEach((e) => e(property, newValue, oldValue));
    }
    /**
     * Changes a property of this object, and calls the corresponding event handler.
     * @param property Property to change.
     * @param value Value to set the property to.
     */
    prop(property, value) {
        if (Settings.dataProperties.includes(property)) {
            this.propertyChanged(property, value, this[property]);
            this[property] = value;
        }
        return true;
    }
    /**
     * Creates a generic object with this object's properties.
     */
    toJObject() {
        this.getOpenPanes();
        let o = {};
        Settings.dataProperties.forEach((e) => (o[e] = this[e]));
        o['version'] = this.version;
        return o;
    }
    /**
     * Returns a Json String containing the Object made with .toJObject()
     * @param settingsObj
     */
    static stringify(settingsObj) {
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
    static parse(jsonString) {
        let a = new Settings();
        return a.assign(JSON.parse(jsonString));
    }
    /**
     * Fills the given node with a form to edit settings.
     * @param interman Interactivity manager to make dialog boxes.
     * @param wrapperNode Parent node to fill.
     * @param mapLoader MapLoader object, used to change/get currentMap.
     */
    updateSettingsNode(interman, wrapperNode, mapLoader) {
        wrapperNode.innerHTML = '';
        {
            // Version
            document.getElementById('versionDisplay').innerHTML = `v${this.version}`;
        }
        {
            // Mapa
            let d = createElement(wrapperNode, 'div');
            createElement(d, 'h2', 'Mapa');
            $(createLabel(d, 'Mapa: ', 'El mapa actualmente cargado.')).prop('for', 'setting_current_map');
            let maps = Object.keys(MapLoader.mapStruct);
            //let formattedMaps = maps.map((e) => titleCase(e.replace('_',' ')));
            let formattedMaps = maps.map((e) => MapLoader.mapStruct[e].mapMeta.name);
            let mapSelector = createSelect(d, maps, formattedMaps);
            mapSelector.id = 'setting_current_map';
            mapSelector.value = mapLoader.currentMap;
            // Update propertyChanged for map
            $(mapSelector).change((e) => {
                let newVal = mapSelector.value;
                this.prop('map', newVal);
            });
            // Add onMapChange handler
            mapLoader.eventHandlerList_MapChanged.push((map) => {
                let oldValue = this.map;
                mapSelector.value = map;
                this.prop('map', map);
            });
        }
        {
            // Snap
            let d = createElement(wrapperNode, 'div');
            createElement(d, 'h2', 'Snap');
            $(createLabel(d, 'Snap: ', 'Similar al snap de los programas CAD, \npermite hacer click directamente sobre los elementos de forma exacta.')).prop('for', 'setting_snap');
            let checkBox = createElement(d, 'input');
            checkBox.id = 'setting_snap';
            $(checkBox).prop('type', 'checkbox');
            checkBox.checked = this.snap;
            $(checkBox).change((e) => {
                let val = checkBox.checked;
                this.prop('snap', val);
            });
        }
        {
            // Distance units
            let d = createElement(wrapperNode, 'div');
            createElement(d, 'h2', 'Mediciones');
            {
                // Unit to use
                $(createLabel(d, 'Unidades: ', 'La unidad usada en mediciones de distancia.\n No afecta las graficas de perfiles topograficos (ya que usa las distancias en m)')).prop('for', 'setting_distance_unit');
                let form = createSelect(d, Object.keys(DistanceUnitsLongNames), Object.values(DistanceUnitsLongNames));
                form.id = 'setting_distance_unit';
                form.value = this.distanceUnits;
                $(form).change((e) => {
                    let newVal = form.value;
                    this.prop('distanceUnits', newVal);
                });
            }
            lineBreak(d);
            {
                // Distance Round digits
                $(createLabel(d, 'Decimales p/ distancias: ', 'Cantidad de decimales para redondear las distancias.')).prop('for', 'setting_distance_digits');
                let form = createElement(d, 'input');
                form.id = 'setting_distance_digits';
                form.value = this.distanceDigits.toString();
                form.type = 'number';
                form.min = '0';
                form.max = '20';
                form.step = '1';
                $(form).change((e) => {
                    let newVal = parseInt(form.value);
                    this.prop('distanceDigits', newVal);
                });
            }
        }
        {
            // Calculations
            let d = createElement(wrapperNode, 'div');
            createElement(d, 'h2', 'Cálculos');
            {
                // Operation frequency
                $(createLabel(d, 'Frecuencia p/ calculos: ', 'La frecuencia predeterminada para los calculos.')).prop('for', 'setting_default_freq');
                let form = interman.out.dialog.createEngineerNumberInput((code, str, num) => {
                    this.prop('calcFrequency', num);
                }, this.calcFrequency, 'Hz', 'Frecuencia de operacion base:', 10);
                d.appendChild(form);
                this.eventHandlerList_PropertyChanged.push((prop, newVal) => {
                    if (prop == 'calcFrequency') {
                        let f = form;
                        f.set(newVal);
                    }
                });
            }
            lineBreak(d);
            {
                // Calc Round digits
                $(createLabel(d, 'Decimales p/ calculos: ', 'Cantidad de decimales para redondear calculos como Perdidas de espacio libre, etc....')).prop('for', 'setting_calc_digits');
                let form = createElement(d, 'input');
                form.id = 'setting_calc_digits';
                form.value = this.calcDigits.toString();
                form.type = 'number';
                form.min = '0';
                form.max = '20';
                form.step = '1';
                $(form).change((e) => {
                    let newVal = parseInt(form.value);
                    this.prop('calcDigits', newVal);
                });
            }
        }
    }
}
/**
 * Basic data properties.
 * Items in this list will be saved/loaded automatically.
 * NOTE: Must manually add to updateSettingsNode().
 */
Settings.dataProperties = [
    'map',
    'snap',
    'paneState',
    'distanceUnits',
    'distanceDigits',
    'calcDigits',
    'calcFrequency',
];
/** Manages a single Pane-Button pair that depend on each other to show/hide. */
class PaneButtonPair {
    constructor(pane, button, initialState) {
        this.pane = pane;
        this.button = button;
        this.button.addEventListener('click', (e) => {
            this.toggle();
        });
        this.set(initialState);
    }
    /** If true, opens the pane */
    set(state) {
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
    constructor(PanePairs, firstOpenId) {
        this.currentTab = 0;
        this.tabs = PanePairs;
        this.tabs.forEach((e, i) => {
            e.button.addEventListener('click', (k) => {
                this.close();
                this.set(i);
            });
        });
        let idToOpen = firstOpenId !== undefined && firstOpenId < PanePairs.length
            ? firstOpenId
            : 0;
        this.set(idToOpen);
    }
    /** Closes all the panes */
    close() {
        let o = Object.values(this.tabs);
        o.forEach((e) => {
            e.set(false);
        });
    }
    /** Opens the selected pane */
    set(id) {
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
//# sourceMappingURL=Settings.js.map