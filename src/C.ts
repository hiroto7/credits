import Course from "./Course";

export interface C1 {
    title: string;
    subtitle?: string;
    creditsCount: number | MinMax;
    children: Iterable<Course | C1 | C2>;
}
export const isC1 = (obj: Course | C1 | C2): obj is C1 => 'title' in obj && 'creditsCount' in obj && 'children' in obj;

export interface C2 {
    candidates: Iterable<C1>;
}

export interface MinMax {
    min: number,
    max: number
}
export const isMinMax = (obj: number | MinMax): obj is MinMax => typeof obj !== 'number';