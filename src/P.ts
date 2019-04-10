import Course, { isCourse } from "./Course";
import { C1, C2, isMinMax } from "./C";
import Level from "./Level";

export interface P {
    level: Level;
    creditsCount(level: Level, includesExcess: boolean): number;
    titles(): IterableIterator<string>
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

    *titles(): IterableIterator<string> {
        yield* [...this.children.values()].reduce<Set<string>>((previous, child) => {
            for (const title of child.titles()) {
                previous.add(title);
            }
            return previous;
        }, new Set())
    }
}

export class P2 implements P {
    constructor(
        readonly selected: C1 | null,
        readonly child: P1 | null) { }

    get level(): Level {
        return this.child === null ? Level.none : this.child.level;
    }

    creditsCount(level: Level, includesExcess: boolean): number {
        return this.child === null ? 0 : this.child.creditsCount(level, includesExcess);
    }

    *titles(): IterableIterator<string> {
        if (this.child === null) {
            return;
        } else {
            yield* this.child.titles();
        }
    }
}

export class P3 implements P {
    constructor(private readonly course: Course, public readonly level: Level) { }

    creditsCount(level: Level, _: boolean): number {
        return level <= this.level ? this.course.creditsCount : Level.none;
    }

    *titles(): IterableIterator<string> {
        if (this.level === Level.none) {
            return;
        } else {
            yield this.course.title;
        }
    }
}
