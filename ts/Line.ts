import { Point, UnaryOperator, BinaryOperator } from "./Point.js";


export class Line {
    p1: Point;
    p2: Point;

    constructor(p1: Point, p2: Point) {
        this.p1 = p1;
        this.p2 = p2;
    }

    /**
     * Creates a new instance of this object
     */
    copy() {
        return new Line(this.p1, this.p2);
    }

    /** Assigns values 'p1' and 'p2' from an object. */
    assign(o) {
        if (o.p1 !== undefined && o.p2 !== undefined) {
            this.p1 = Point.fromObject(o.p1);
            this.p2 = Point.fromObject(o.p2);
            return true;
        }

        return false;
    }    

    /** Gets the length of the line. */
    length() {
        return Point.Distance(this.p1, this.p2);
    }

    /** Flips this line. */
    flip() {
        let pTemp = this.p1;
        this.p1 = this.p2;
        this.p2 = pTemp;
        return true;
    }

    /** Creates an instance of a Point from an object containing 'x' and 'y'. */
    static fromObject(o) {
        let l = new Line(Point.ZERO(), Point.ZERO());
        l.assign(o);
        return l;
    }

    /** Gets the length of the line. */
    static Length(L: Line) {
        return Point.Distance(L.p1, L.p2);
    }

    /** Returns a new, flipped, line. */
    static Flip(L: Line) {
        return new Line(L.p2, L.p1);
    }

    /** Returns a new line with an operation applied on both points */
    static UnaryOperation(L: Line, operation: UnaryOperator){
        return new Line(
            Point.UnaryOperation(L.p1, operation),
            Point.UnaryOperation(L.p2, operation)
        );
    }

    /** Returns a new line with an operation applied on both points */
    static BinaryOperation(L1: Line, L2: Line, operation: BinaryOperator){
        return new Line(
            Point.BinaryOperation(L1.p1, L2.p1, operation),
            Point.BinaryOperation(L1.p2, L2.p2, operation)
        );
    }

    /** Gets the projected point on the line (no overflow, finite line segment). */
    static PointProjection(L: Line, p: Point) {
        // src: https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment?page=1&tab=votes#tab-top
        let a = Point.Minus(p, L.p1);
        let b = Point.Minus(L.p2, L.p1);

        let length_sqr = Point.AbsSquared(b);
        let a_dot_b = Point.Dot(a, b);

        // Scalar projection of p on the line, normalized so that 1 = 100% of the line.
        // Set value to -1 if length = 0 (avoid division by zero)
        let param = (length_sqr) ? (a_dot_b / length_sqr) : -1;
        let pProyected;
        if (param < 0) {
            // Projection was negative, projection is before p1.
            pProyected = L.p1;
        } 
        else if (param > 1) {
            // Projection was more than 100%, projection is after p2.
            pProyected = L.p2;
        } 
        else {
            // Projection was inside the line.
            pProyected = Point.BinaryOperation(
                L.p1,
                b,
                (a, b) => a + param * b
            );
        }

        return pProyected;
    }

    /** Gets the distance from a given point (finite line segment) */
    static DistanceToPoint(L: Line, p: Point) {
        let pProjection = Line.PointProjection(L, p);
        return Point.Distance(p, pProjection);
    }

    /** Gets the projected point on the line (no overflow, finite line segment). */
    static PointProjectionAsInfiniteLine(L: Line, p: Point) {
        let a = Point.Minus(p, L.p1);
        let b = Point.Minus(L.p2, L.p1);
        let a1 = Point.VectorProjection(a, b)
        return Point.Plus(a1, L.p1);
    }
    
    /** Gets the distance from a given point */
    static DistanceToPointAsInfiniteLine(L: Line, p: Point) {
        let pProjection = Line.PointProjectionAsInfiniteLine(L, p);
        return Point.Distance(p, pProjection);
    }

    /** Returns the scalar projection of the point to the line, but normalized so that the line has lenght of 1. */
    static NormalizedScalarPointProjection(L: Line, p: Point) {
        // Direct copy of .PointProjection()
        let a = Point.Minus(p, L.p1);
        let b = Point.Minus(L.p2, L.p1);

        let length_sqr = Point.AbsSquared(b);
        let a_dot_b = Point.Dot(a, b);

        // Scalar projection of p on the line, normalized so that 1 = 100% of the line.
        // Set value to -1 if length = 0 (avoid division by zero)
        return (length_sqr) ? (a_dot_b / length_sqr) : -1;
    }
}