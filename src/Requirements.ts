import { $number, $object, isCompatible } from "@hiroto/json-type-checker";
import Course from "./Course";
import RegistrationStatus from "./RegistrationStatus";

type Requirements = RequirementWithChildren | RequirementWithCourses | SelectionRequirement;
export default Requirements;

abstract class Requirement {
    constructor(readonly title: string, readonly description?: string) { }
    abstract getRegisteredCreditsCount({ status, includesExcess, courseToStatus, courseToRequirement, selectionToRequirement }: {
        status: RegistrationStatus,
        includesExcess: boolean
        courseToStatus: Map<Course, RegistrationStatus>,
        courseToRequirement: Map<Course, Requirements>,
        selectionToRequirement: Map<SelectionRequirement, Requirement>,
    }): number;
    abstract getRequiredCreditsCount(selectionToRequirement: Map<SelectionRequirement, Requirement>): Range;
    getStatus({ courseToStatus, courseToRequirement, selectionToRequirement }: {
        courseToStatus: Map<Course, RegistrationStatus>,
        courseToRequirement: Map<Course, Requirements>,
        selectionToRequirement: Map<SelectionRequirement, Requirement>,
    }): RegistrationStatus {
        const requiredCreditsCount = this.getRequiredCreditsCount(selectionToRequirement);
        return this.getRegisteredCreditsCount({ status: RegistrationStatus.Acquired, includesExcess: false, courseToStatus, courseToRequirement, selectionToRequirement }) >= requiredCreditsCount.min ?
            RegistrationStatus.Acquired :
            this.getRegisteredCreditsCount({ status: RegistrationStatus.Registered, includesExcess: false, courseToStatus, courseToRequirement, selectionToRequirement }) >= requiredCreditsCount.min ?
                RegistrationStatus.Registered :
                RegistrationStatus.Unregistered;
    };
}

export interface Range {
    min: number;
    max: number;
}
export const isRange = (obj: unknown): obj is Range => isCompatible(obj, $object({ min: $number, max: $number }));

export interface RequirementWithChildrenInit {
    readonly title: string;
    readonly description?: string;
    readonly children: Iterable<Requirements>;
    readonly creditsCount?: Range;
}

export class RequirementWithChildren extends Requirement implements RequirementWithChildrenInit {
    readonly children: readonly Requirements[];
    readonly creditsCount?: Range;
    constructor({ title, description, children, creditsCount }: RequirementWithChildrenInit) {
        super(title, description);
        this.children = [...children];
        this.creditsCount = creditsCount;
    }
    getRegisteredCreditsCount({ status, includesExcess, courseToStatus, courseToRequirement, selectionToRequirement }: {
        status: RegistrationStatus,
        includesExcess: boolean
        courseToStatus: Map<Course, RegistrationStatus>,
        courseToRequirement: Map<Course, Requirements>,
        selectionToRequirement: Map<SelectionRequirement, Requirement>,
    }): number {
        const creditsCount = this.children.reduce(
            (previous, child) => previous + child.getRegisteredCreditsCount({ status, includesExcess, courseToStatus, courseToRequirement, selectionToRequirement }),
            0);
        return includesExcess || this.creditsCount === undefined ? creditsCount : Math.min(this.creditsCount.max, creditsCount);
    }
    getRequiredCreditsCount(selectionToRequirement: Map<SelectionRequirement, Requirement>): Range {
        return this.creditsCount === undefined ? this.children.reduce(
            (previous, child) => {
                const childRequiredCreditsCount = child.getRequiredCreditsCount(selectionToRequirement);
                return {
                    min: previous.min + childRequiredCreditsCount.min,
                    max: previous.max + childRequiredCreditsCount.max,
                }
            },
            { min: 0, max: 0 }) : this.creditsCount;
    }
}

export interface RequirementWithCoursesInit {
    readonly title: string;
    readonly description?: string;
    readonly courses: Iterable<Course>;
    readonly creditsCount: Range;
    readonly allowsOthers?: boolean;
}

export class RequirementWithCourses extends Requirement {
    readonly courses: readonly Course[];
    readonly creditsCount: Range;
    readonly allowsOthers: boolean;
    constructor({ title, description, courses, creditsCount, allowsOthers = false }: RequirementWithCoursesInit) {
        super(title, description);
        this.courses = [...courses];
        this.creditsCount = creditsCount;
        this.allowsOthers = allowsOthers;
    }
    getRegisteredCreditsCount({ status, includesExcess, courseToStatus, courseToRequirement }: {
        status: RegistrationStatus,
        includesExcess: boolean
        courseToStatus: Map<Course, RegistrationStatus>,
        courseToRequirement: Map<Course, Requirements>,
    }): number {
        const creditsCount = this.courses.reduce(
            (previous, course) => {
                const courseStatus = courseToStatus.get(course) || 0;
                return courseToRequirement.get(course) === this && courseStatus >= status ? previous + course.creditsCount : previous;
            },
            0);
        return includesExcess || this.creditsCount === undefined ? creditsCount : Math.min(this.creditsCount.max, creditsCount);
    }
    getRequiredCreditsCount() {
        return this.creditsCount;
    }
}

export interface SelectionRequirementInit {
    readonly title: string;
    readonly description?: string;
    readonly choices: Iterable<Requirements>
}

export class SelectionRequirement extends Requirement implements SelectionRequirementInit {
    readonly choices: readonly Requirements[]
    constructor({ title, description, choices }: SelectionRequirementInit) {
        super(title, description);
        this.choices = [...choices];
    }
    getRegisteredCreditsCount({ status, includesExcess, courseToStatus, courseToRequirement, selectionToRequirement }: {
        status: RegistrationStatus,
        includesExcess: boolean
        courseToStatus: Map<Course, RegistrationStatus>,
        courseToRequirement: Map<Course, Requirements>,
        selectionToRequirement: Map<SelectionRequirement, Requirement>,
    }): number {
        return (selectionToRequirement.get(this) || this.choices[0]).getRegisteredCreditsCount({ status, includesExcess, courseToStatus, courseToRequirement, selectionToRequirement });
    }
    getRequiredCreditsCount(selectionToRequirement: Map<SelectionRequirement, Requirement>): Range {
        return (selectionToRequirement.get(this) || this.choices[0]).getRequiredCreditsCount(selectionToRequirement);
    }
}