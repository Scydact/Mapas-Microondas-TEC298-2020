import {Point} from './Point.js';
import {ObjectAssignProperty} from './Utils.js';



/**
 * Collection of a map's fixed data points.
 */
export class MapMeta {
    name = "";
    deg = {
        p1: new Point(0, 0),
        p2: new Point(0, 0),
        length: () => Point.Minus(this.deg.p2, this.deg.p1)
    }
    px = {
        p1: new Point(0, 0),
        p2: new Point(0, 0), 
        length: () => Point.Minus(this.px.p2, this.px.p1)
    }

    oneMetreInPx = 2;

    /**
     * Creates a new MapMeta from a Legacy String used before the TS conversion.
     * @param name Name of the new MapMeta.
     * @param str Legacy json string.
     */
    static fromLegacyString(name: string, str: string) {
        // '{"x1Deg":70.75,"x2Deg":70.5,"x1Px":1221,"x2Px":7463,"y1Deg":18.5,"y2Deg":18.33333,"y1Px":255,"y2Px":4613,"oneMetreInPx":1.9511393698710089}'
        let o = JSON.parse(str);
        let mm = new MapMeta();
        mm.name = name;

        mm.deg.p1 = new Point(o.x1Deg, o.y1Deg);
        mm.deg.p2 = new Point(o.x2Deg, o.y2Deg);
        mm.px.p1 = new Point(o.x1Px, o.y1Px);
        mm.px.p2 = new Point(o.x2Px, o.y2Px);

        mm.oneMetreInPx = o.oneMetreInPx;
        return mm;
    }

    /**
     * Creates and assigns a new MapMeta from an object.
     * @param o Object to assign from.
     */
    static fromObject(o: any) {
        let mm = new MapMeta();
        ObjectAssignProperty(mm, o, 'name');
        ObjectAssignProperty(mm, o, 'oneMetreInPx');

        mm.deg.p1 = Point.fromObject(o.deg.p1);
        mm.deg.p2 = Point.fromObject(o.deg.p2);
        mm.px.p1 = Point.fromObject(o.px.p1);
        mm.px.p2 = Point.fromObject(o.px.p2);
        return mm;
    }

    /**
     * Creates a new MapMeta from a JSON string.
     * @param str JSON string to parse.
     */
    static fromJson(str: string) {
        let json = JSON.parse(str);
        return this.fromObject(json);
    }

    /**
     * Sets the values of this MapMeta from another MapMeta.
     * @param mapMeta Source MapMeta to copy values from.
     */
    set(mapMeta: MapMeta) {
        this.name = mapMeta.name;
        this.oneMetreInPx = mapMeta.oneMetreInPx;
        this.deg = mapMeta.deg;
        this.px = mapMeta.px;
    }
}