import { ObjectAssignProperty, createElement, createLabel, titleCase, createSelect } from "./Utils.js";
/**
 * Constains simple settings, and methods to load them to the forms
 */
export class Settings {
    constructor() {
        this.version = 1.0;
        this.map = 'hato_mayor';
        this.snap = true;
        /**
         * List of all the functions that will be notified when a property changes via .prop()
         */
        this.eventHandlerList_PropertyChanged = [];
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
        let o = {};
        Settings.dataProperties.forEach((e) => o[e] = this[e]);
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
     * @param wrapperNode Parent node to fill.
     * @param mapLoader MapLoader object, used to change/get currentMap.
     */
    updateSettingsNode(wrapperNode, mapLoader) {
        wrapperNode.innerHTML = '';
        { // Version
            document.getElementById('versionDisplay').innerHTML = `v${this.version}`;
        }
        { // Mapa
            let d = createElement(wrapperNode, 'div');
            createElement(d, 'h2', 'Mapa');
            $(createLabel(d, 'Mapa: ', 'El mapa actualmente cargado.')).prop('for', 'setting_current_map');
            let maps = ['azua', 'constanza', 'hato_mayor', 'jarabacoa', 'puerto_plata'];
            let formattedMaps = maps.map((e) => titleCase(e.replace('_', ' ')));
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
        { // Snap
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
    }
}
Settings.dataProperties = [
    'version',
    'map',
    'snap'
];
//# sourceMappingURL=Settings.js.map