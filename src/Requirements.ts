import { $number, $object, isCompatible } from "@hiroto/json-type-checker";
import Course from "./Course";
import RegistrationStatus from "./RegistrationStatus";

type Requirements = RequirementWithChildren | RequirementWithCourses | SelectionRequirement;
export default Requirements;

abstract class Requirement {
    abstract getRegisteredCreditsCount({ includesExcess, courseToStatus, courseToRequirement, selectionNameToOptionName, requirementToOthersCount }: {
        includesExcess: boolean
        courseToStatus: Map<Course, RegistrationStatus>,
        courseToRequirement: Map<Course, Requirements>,
        selectionNameToOptionName: ReadonlyMap<string, string>;
        requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    }): RegisteredCreditsCounts;
    abstract getRequiredCreditsCount(selectionNameToOptionName: ReadonlyMap<string, string>): Range;
    constructor(readonly name: string) { }
    getStatus({ courseToStatus, courseToRequirement, selectionNameToOptionName, requirementToOthersCount }: {
        courseToStatus: Map<Course, RegistrationStatus>,
        courseToRequirement: Map<Course, Requirements>,
        selectionNameToOptionName: ReadonlyMap<string, string>
        requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    }): RegistrationStatus {
        const requiredCreditsCount = this.getRequiredCreditsCount(selectionNameToOptionName);
        const registeredCreditsCounts = this.getRegisteredCreditsCount({ includesExcess: false, courseToStatus, courseToRequirement, selectionNameToOptionName, requirementToOthersCount })
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
    readonly name: string;
    readonly description?: string;
    readonly children: Iterable<Requirements>;
    readonly creditsCount?: Range;
}

export class RequirementWithChildren extends Requirement implements RequirementWithChildrenInit {
    readonly description?: string;
    readonly children: readonly Requirements[];
    readonly creditsCount?: Range;
    constructor({ name, description, children, creditsCount }: RequirementWithChildrenInit) {
        super(name);
        this.description = description
        this.children = [...children];
        this.creditsCount = creditsCount;
    }
    getRegisteredCreditsCount({ includesExcess, courseToStatus, courseToRequirement, selectionNameToOptionName, requirementToOthersCount }: {
        includesExcess: boolean
        courseToStatus: Map<Course, RegistrationStatus>,
        courseToRequirement: Map<Course, Requirements>,
        selectionNameToOptionName: ReadonlyMap<string, string>,
        requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    }): RegisteredCreditsCounts {
        const creditsCounts = this.children.reduce(
            (previous, child) => {
                const childRegisteredCreditsCount = child.getRegisteredCreditsCount({ includesExcess, courseToStatus, courseToRequirement, selectionNameToOptionName, requirementToOthersCount });
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
    getRequiredCreditsCount(selectionNameToOptionName: ReadonlyMap<string, string>): Range {
        return this.creditsCount === undefined ? this.children.reduce((previous, child) => {
            const childRequiredCreditsCount = child.getRequiredCreditsCount(selectionNameToOptionName);
            return {
                min: previous.min + childRequiredCreditsCount.min,
                max: previous.max + childRequiredCreditsCount.max,
            }
        }, { min: 0, max: 0 }) : this.creditsCount;
    }
    getStatus({ courseToStatus, courseToRequirement, selectionNameToOptionName, requirementToOthersCount }: {
        courseToStatus: Map<Course, RegistrationStatus>,
        courseToRequirement: Map<Course, Requirements>,
        selectionNameToOptionName: ReadonlyMap<string, string>,
        requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    }): RegistrationStatus {
        return Math.min(
            super.getStatus({ courseToStatus, courseToRequirement, selectionNameToOptionName, requirementToOthersCount }),
            ...this.children.map(child => child.getStatus({ courseToStatus, courseToRequirement, selectionNameToOptionName, requirementToOthersCount }))
        );
    };
}

export interface RequirementWithCoursesInit {
    readonly name: string;
    readonly description?: string;
    readonly courses: Iterable<Course>;
    readonly creditsCount: Range;
    readonly allowsOthers?: boolean;
}

export class RequirementWithCourses extends Requirement {
    readonly description?: string;
    readonly courses: readonly Course[];
    readonly creditsCount: Range;
    readonly allowsOthers: boolean;
    constructor({ name, description, courses, creditsCount, allowsOthers = false }: RequirementWithCoursesInit) {
        super(name);
        this.description = description;
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
    readonly name: string;
    readonly selectionName: string;
    readonly options: Iterable<{
        name: string;
        requirement: Requirements;
    }>;
}

export class SelectionRequirement extends Requirement implements SelectionRequirementInit {
    readonly selectionName: string;
    readonly options: {
        name: string;
        requirement: Requirements;
    }[];
    readonly optionNameToRequirement: ReadonlyMap<string, Requirements>;
    constructor({ name, selectionName, options: options0 }: SelectionRequirementInit) {
        super(name);
        this.selectionName = selectionName;
        const options = [...options0]
        this.options = options;
        this.optionNameToRequirement = new Map(options.map(({ name, requirement }) => [name, requirement]));
    }
    getSelectedOptionName(selectionNameToOptionName: ReadonlyMap<string, string>) {
        const selectedOptionName = selectionNameToOptionName.get(this.selectionName) || this.options[0].name;
        return selectedOptionName;
    }
    getSelectedRequirement(selectionNameToOptionName: ReadonlyMap<string, string>) {
        const selectedOptionName = this.getSelectedOptionName(selectionNameToOptionName);
        const selectedRequirement = this.optionNameToRequirement.get(selectedOptionName);
        return selectedRequirement;
    }
    getRegisteredCreditsCount({ includesExcess, courseToStatus, courseToRequirement, selectionNameToOptionName, requirementToOthersCount }: {
        includesExcess: boolean;
        courseToStatus: Map<Course, RegistrationStatus>;
        courseToRequirement: Map<Course, Requirements>;
        selectionNameToOptionName: ReadonlyMap<string, string>;
        requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>;
    }): RegisteredCreditsCounts {
        const selectedRequirement = this.getSelectedRequirement(selectionNameToOptionName);
        if (selectedRequirement === undefined) {
            return { acquired: 0, registered: 0 };
        } else {
            return selectedRequirement.getRegisteredCreditsCount({ includesExcess, courseToStatus, courseToRequirement, selectionNameToOptionName, requirementToOthersCount });
        }
    }
    getRequiredCreditsCount(selectionNameToOptionName: ReadonlyMap<string, string>): Range {
        const selectedRequirement = this.getSelectedRequirement(selectionNameToOptionName);
        if (selectedRequirement === undefined) {
            return { min: 0, max: 0 };
        } else {
            return selectedRequirement.getRequiredCreditsCount(selectionNameToOptionName);
        }
    }
}
