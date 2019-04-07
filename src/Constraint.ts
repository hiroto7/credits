import Course from "./Course";

export default interface Constraint {
    candidates: Iterable<Course | Constraint | Iterable<Course | Constraint>>;
    title: string;
    subtitle?: string;
    creditsCount: number | MinMax;
}

export interface MinMax {
    min: number,
    max: number
}