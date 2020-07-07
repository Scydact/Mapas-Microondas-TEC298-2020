/**
 * Generic point (x, y)
 */

 /**
  * Functions that require two numbers (operation, and output another number)
  */
type BinaryOperator = (a: number, b: number) => number;

export class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
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
    static Dot(p1: Point, p2: Point) {
        return p1.x * p2.x + p1.y * p2.y;
    }

    /**
     * Performs a function (operation) on both 'x' and 'y' axis of given points.
     * @param p1 First point
     * @param p2 Second point
     * @param operation Binary operation to perform
     */
    static BinaryOperation(p1: Point, p2: Point, operation: BinaryOperator) {
        return new Point(
            operation(p1.x, p2.x),
            operation(p1.y, p2.y)
        )
    }

    /**
     * Returns the vector subtraction.
     */
    static Minus(p1: Point, p2: Point) {
        return Point.BinaryOperation(p1, p2, (a,b) => a-b)
    }

    /**
     * Returns the vector sum.
     */
    static Plus(p1: Point, p2: Point) {
        return Point.BinaryOperation(p1, p2, (a,b) => a+b)
    }

    /**
     * Multiplies x & y by an scalar
     */
    static ScalarMult(p1: Point, mult: number) {
        return new Point(
            p1.x * mult,
            p1.y * mult
        );
    }

    /**
     * Returns the distance between two points.
     */
    static Distance(p1: Point, p2: Point) {
        return Math.sqrt(
            (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)
        );
    }

    /**
     * Returns the midpoint between two points.
     */
    static MidPoint(p1: Point, p2: Point) {
        return Point.BinaryOperation(p1, p2, (a,b) => (a+b)/2);
    }
}