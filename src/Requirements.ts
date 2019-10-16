import { $number, $object, isCompatible } from "@hiroto/json-type-checker";
import Course from "./Course";
import RegistrationStatus from "./RegistrationStatus";

type Requirements = RequirementWithChildren | RequirementWithCourses | SelectionRequirement;
export default Requirements;

abstract class Requirement {
    constructor(readonly title: string, readonly description?: string) { }
    abstract getRegisteredCreditsCount({ includesExcess, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount }: {
        includesExcess: boolean
        courseToStatus: Map<Course, RegistrationStatus>,
        courseToRequirement: Map<Course, Requirements>,
        selectionToRequirement: Map<SelectionRequirement, Requirement>,
        requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    }): RegisteredCreditsCounts;
    abstract getRequiredCreditsCount(selectionToRequirement: Map<SelectionRequirement, Requirement>): Range;
    getStatus({ courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount }: {
        courseToStatus: Map<Course, RegistrationStatus>,
        courseToRequirement: Map<Course, Requirements>,
        selectionToRequirement: Map<SelectionRequirement, Requirement>,
        requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    }): RegistrationStatus {
        const requiredCreditsCount = this.getRequiredCreditsCount(selectionToRequirement);
        const registeredCreditsCounts = this.getRegisteredCreditsCount({ includesExcess: false, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount })
        return registeredCreditsCounts.acquired >= requiredCreditsCount.min ?
            RegistrationStatus.Acquired :
            registeredCreditsCounts.registered >= requiredCreditsCount.min ?
                RegistrationStatus.Registered :
                RegistrationStatus.Unregistered;
    };
}

export interface Range {
    min: number;
    max: number;
}
export const isRange = (obj: unknown): obj is Range => isCompatible(obj, $object({ min: $number, max: $number }));

export interface RegisteredCreditsCounts {
    acquired: number;
    registered: number;
}

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
    getRegisteredCreditsCount({ includesExcess, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount }: {
        includesExcess: boolean
        courseToStatus: Map<Course, RegistrationStatus>,
        courseToRequirement: Map<Course, Requirements>,
        selectionToRequirement: Map<SelectionRequirement, Requirement>,
        requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    }): RegisteredCreditsCounts {
        const creditsCounts = this.children.reduce(
            (previous, child) => {
                const childRegisteredCreditsCount = child.getRegisteredCreditsCount({ includesExcess, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount });
                return {
                    acquired: previous.acquired + childRegisteredCreditsCount.acquired,
                    registered: previous.registered + childRegisteredCreditsCount.registered,
                }
            },
            { acquired: 0, registered: 0 }
        );
        return includesExcess || this.creditsCount === undefined ? creditsCounts : {
            acquired: Math.min(this.creditsCount.max, creditsCounts.acquired),
            registered: Math.min(this.creditsCount.max, creditsCounts.registered),
        };
    }
    getRequiredCreditsCount(selectionToRequirement: Map<SelectionRequirement, Requirement>): Range {
        return this.creditsCount === undefined ? this.children.reduce((previous, child) => {
            const childRequiredCreditsCount = child.getRequiredCreditsCount(selectionToRequirement);
            return {
                min: previous.min + childRequiredCreditsCount.min,
                max: previous.max + childRequiredCreditsCount.max,
            }
        }, { min: 0, max: 0 }) : this.creditsCount;
    }
    getStatus({ courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount }: {
        courseToStatus: Map<Course, RegistrationStatus>,
        courseToRequirement: Map<Course, Requirements>,
        selectionToRequirement: Map<SelectionRequirement, Requirement>,
        requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    }): RegistrationStatus {
        return Math.min(
            super.getStatus({ courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount }),
            ...this.children.map(child => child.getStatus({ courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount }))
        );
    };
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
    getRegisteredCreditsCount({ includesExcess, courseToStatus, courseToRequirement, requirementToOthersCount }: {
        includesExcess: boolean
        courseToStatus: Map<Course, RegistrationStatus>,
        courseToRequirement: Map<Course, Requirements>,
        requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    }): RegisteredCreditsCounts {
        const othersCount = requirementToOthersCount.get(this) || { acquired: 0, registered: 0 };
        const creditsCounts = this.courses.reduce((previous, course): RegisteredCreditsCounts => {
            const courseStatus = courseToStatus.get(course) || RegistrationStatus.Unregistered;
            if (courseToRequirement.get(course) === this) {
                return courseStatus === RegistrationStatus.Acquired ?
                    {
                        acquired: previous.acquired + course.creditsCount,
                        registered: previous.registered + course.creditsCount,
                    } :
                    courseStatus === RegistrationStatus.Registered ?
                        {
                            acquired: previous.acquired,
                            registered: previous.registered + course.creditsCount,
                        } :
                        previous;
            } else {
                return previous;
            }
        }, othersCount);
        return includesExcess || this.creditsCount === undefined ? creditsCounts : {
            acquired: Math.min(this.creditsCount.max, creditsCounts.acquired),
            registered: Math.min(this.creditsCount.max, creditsCounts.registered),
        };
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
    getRegisteredCreditsCount({ includesExcess, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount }: {
        includesExcess: boolean
        courseToStatus: Map<Course, RegistrationStatus>,
        courseToRequirement: Map<Course, Requirements>,
        selectionToRequirement: Map<SelectionRequirement, Requirement>,
        requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    }): RegisteredCreditsCounts {
        return (selectionToRequirement.get(this) || this.choices[0]).getRegisteredCreditsCount({ includesExcess, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount });
    }
    getRequiredCreditsCount(selectionToRequirement: Map<SelectionRequirement, Requirement>): Range {
        return (selectionToRequirement.get(this) || this.choices[0]).getRequiredCreditsCount(selectionToRequirement);
    }
}
