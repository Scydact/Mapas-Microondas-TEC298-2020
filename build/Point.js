/**
 * Generic point (x, y)
 */
/** Generic point class */
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
    /** Point initialized at (0, 0) */
    static ZERO() { return new Point(0, 0); }
    /** Assigns values 'x' and 'y' from an object. */
    assign(o) {
        if (o.x !== undefined && o.y !== undefined) {
            this.x = o.x;
            this.y = o.y;
            return true;
        }
        return false;
    }
    /** Creates an instance of a Point from an object containing 'x' and 'y'. */
    static fromObject(o) {
        return new Point(o.x, o.y);
    }
    //#region Vector operations
    /** Gives the dot product (x1*x2+y1*y2) of a point. */
    static Dot(p1, p2) {
        return p1.x * p2.x + p1.y * p2.y;
    }
    /**
     * Performs a function (operation) on both 'x' and 'y' axis of a given point.
     * @param p Point to operate.
     * @param operation Binary operation to perform.
     */
    static UnaryOperation(p, operation) {
        return new Point(operation(p.x), operation(p.y));
    }
    /**
     * Performs a function (operation) on both 'x' and 'y' axis of the given points.
     * @param p1 First point.
     * @param p2 Second point.
     * @param operation Binary operation to perform.
     */
    static BinaryOperation(p1, p2, operation) {
        return new Point(operation(p1.x, p2.x), operation(p1.y, p2.y));
    }
    /** Returns the direct product of each vector's element */
    static BinaryProduct(p1, p2) {
        return Point.BinaryOperation(p1, p2, (a, b) => a * b);
    }
    /**
     * Returns the direct division of each vector's element (x1/x2)
     * @param p1 Numerator
     * @param p2 Denominator
     */
    static BinaryDivision(p1, p2) {
        return Point.BinaryOperation(p1, p2, (a, b) => a / b);
    }
    /** Returns a new point with reciprocal elements. (x, y) => (1/x, 1/y) */
    static Reciprocal(p) {
        return Point.UnaryOperation(p, (a) => 1 / a);
    }
    /** Returns the vector subtraction. */
    static Minus(p1, p2) {
        return Point.BinaryOperation(p1, p2, (a, b) => a - b);
    }
    /** Returns the vector sum. */
    static Plus(p1, p2) {
        return Point.BinaryOperation(p1, p2, (a, b) => a + b);
    }
    /** Multiplies x & y by an scalar */
    static ScalarProduct(p1, mult) {
        return new Point(p1.x * mult, p1.y * mult);
    }
    /** Returns x^2 + y^2; */
    static AbsSquared(z) {
        return z.x * z.x + z.y * z.y;
    }
    /** Returns the absolute value of the vector. */
    static Abs(z) {
        return Math.sqrt(Point.AbsSquared(z));
    }
    /** Returns the scalar projection of a on b */
    static ScalarProjection(a, b) {
        return Point.Dot(a, b) / Point.Abs(b);
    }
    /** Normalizes the vector */
    static Normalize(a) {
        return Point.ScalarProduct(a, 1 / Point.Abs(a));
    }
    /** Returns the scalar projection of a on b */
    static VectorProjection(a, b) {
        let scale = Point.Dot(a, b) / Point.Abs(b);
        return Point.ScalarProduct(b, scale);
    }
    //#endregion
    //#region Misc Operations
    /** Returns the distance between two points. */
    static Distance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
    }
    /** Returns the midpoint between two points. */
    static MidPoint(p1, p2) {
        return Point.BinaryOperation(p1, p2, (a, b) => (a + b) / 2);
    }
    //#endregion
    //#region Complex operations
    /**
     * Returns z1 * z2 where z are treated as complex numbers.
     * @param z1 First complex number.
     * @param z2 Second complex number.
     */
    static ComplexProduct(z1, z2) {
        // src: https://www2.clarku.edu/faculty/djoyce/complex/mult.html
        return new Point(z1.x * z2.x - z1.y * z2.y, z1.x * z2.y + z1.y * z2.x);
    }
    /**
     * Returns z1 / z2 where z are treated as complex numbers.
     * @param z1 Numerator
     * @param z2 Denominator
     */
    static ComplexDivision(z1, z2) {
        // src: https://www2.clarku.edu/faculty/djoyce/complex/div.html
        return Point.ComplexProduct(z1, Point.ComplexConjugate(z2));
    }
    /** Returns the conjugate of Z=a+bi, Z*=a-bi */
    static ComplexConjugate(z) {
        return new Point(z.x, -z.y);
    }
    /** Returns the complex reciprocal, 1/z */
    static ComplexReciprocal(z) {
        // src: https://www2.clarku.edu/faculty/djoyce/complex/div.html
        let rec = Point.ComplexReciprocal(z);
        let abs2 = Point.AbsSquared(z);
        return Point.ScalarProduct(rec, 1 / abs2);
    }
}
//# sourceMappingURL=Point.js.map