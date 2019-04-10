import Course, { isCourse } from "./Course";

export interface P {
    level: Level;
    creditsCount(level: Level, includesExcess: boolean): number;
}

export class P1 implements P {
    readonly children: ReadonlyMap<Course | C1 | C2, P>;
    constructor(private readonly c: C1, children: Iterable<[Course | C1 | C2, P]>) {
        this.children = new Map(children);
    }

    get level(): Level {
        const l1 = [...this.c.children].reduce<Level>((previous, child): Level => {
            if (isCourse(child)) {
                return previous;
            } else {
                const p = this.children.get(child);
                if (p === undefined) {
                    return Level.none;
                } else {
                    return Math.min(previous, p.level);
                }
            }
        }, Level.acquired);

        const creditsCounts = [Level.none, Level.registered, Level.acquired].map(level =>
            this.creditsCount(level, false));

        const min: number = isMinMax(this.c.creditsCount) ? this.c.creditsCount.min : this.c.creditsCount;
        const l2 =
            creditsCounts[Level.acquired] >= min ?
                Level.acquired :
                creditsCounts[Level.registered] >= min ?
                    Level.registered :
                    Level.none;

        return Math.min(l1, l2);
    }

    creditsCount(level: Level, includesExcess: boolean): number {
        const creditsCount = [...this.children.values()].reduce(
            (previous, child): number => previous + child.creditsCount(level, includesExcess), 0);
        const max: number = isMinMax(this.c.creditsCount) ? this.c.creditsCount.max : this.c.creditsCount;
        return includesExcess ? creditsCount : Math.min(max, creditsCount);
    }
}

export class P2 implements P {
    constructor(
        // private readonly c: C2,
        readonly selected: C1 | null,
        readonly child: P1 | null) { }

    get level(): Level {
        return this.child === null ? Level.none : this.child.level;
    }

    creditsCount(level: Level, includesExcess: boolean): number {
        return this.child === null ? 0 : this.child.creditsCount(level, includesExcess);
    }
}

export class P3 implements P {
    constructor(private readonly course: Course, public readonly level: Level) { }

    creditsCount(level: Level, _: boolean): number {
        return level <= this.level ? this.course.creditsCount : Level.none;
    }
}

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

export enum Level {
    none = 0,
    registered = 1,
    acquired = 2
}

export interface MinMax {
    min: number,
    max: number
}
export const isMinMax = (obj: number | MinMax): obj is MinMax => typeof obj !== 'number';