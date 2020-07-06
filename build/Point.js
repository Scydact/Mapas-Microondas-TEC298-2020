/**
 * Generic point (x, y)
 */
export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * Creates a new instance of this object
     */
    copy() {
        return new Point(this.x, this.y);
    }
    /**
     * Assigns values 'x' and 'y' from an object.
     */
    assign(o) {
        if (o.x !== undefined && o.y !== undefined) {
            this.x = o.x;
            this.y = o.y;
            return true;
        }
        return false;
    }
    /**
     * Creates an instance of a Point from an object containing 'x' and 'y'.
     */
    static fromObject(o) {
        return new Point(o.x, o.y);
    }
    /**
     * Gives the dot product (x1*x2+y1*y2) of a point.
     */
    static Dot(p1, p2) {
        return p1.x * p2.x + p1.y * p2.y;
    }
    /**
     * Returns the vector subtraction.
     */
    static Minus(p1, p2) {
        return new Point(p1.x - p2.x, p1.y - p2.y);
    }
    /**
     * Returns the vector sum.
     */
    static Plus(p1, p2) {
        return new Point(p1.x + p2.x, p1.y + p2.y);
    }
    /**
     * Multiplies x & y by an scalar
     */
    static ScalarMult(p1, mult) {
        return new Point(p1.x * mult, p1.y * mult);
    }
    /**
     * Returns the distance between two points.
     */
    static Distance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
    }
    /**
     * Returns the midpoint between two points.
     */
    static MidPoint(p1, p2) {
        return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
    }
}
//# sourceMappingURL=Point.js.map