import type Course from "./Course";
import RegistrationStatusLockTarget from "./RegistrationStatusLockTarget";
import type { RequirementWithCourses } from "./Requirements";

export interface RegisteredCreditCounts {
    acquired: number;
    registered: number;
}

export default interface Plan {
    readonly courseToStatus: ReadonlyMap<Course, RegistrationStatus>;
    readonly courseToRequirement: ReadonlyMap<Course, RequirementWithCourses>;
    readonly requirementToOthersCount: ReadonlyMap<RequirementWithCourses, RegisteredCreditCounts>;
    readonly selectionNameToOptionName: ReadonlyMap<string, string>;
}

export type CourseCode = string;
export type RequirementId = string;

export enum RegistrationStatus {
    Unregistered = 0,
    Registered = 1,
    Acquired = 2,
}

export const isRegistrable = ({ course, courseToStatus }: {
    course: Course,
    courseToStatus: ReadonlyMap<Course, RegistrationStatus>,
}) => ![...courseToStatus].some(
    ([course1, status]) =>
        course1 !== course && course1.title === course.title && status !== RegistrationStatus.Unregistered
);

export const getNextStatus = ({ currentStatus, lockTarget }: {
    currentStatus: RegistrationStatus,
    lockTarget: RegistrationStatusLockTarget,
}): RegistrationStatus => {
    switch (lockTarget) {
        case RegistrationStatusLockTarget.All:
            return currentStatus;
        case RegistrationStatusLockTarget.Acquired:
        case RegistrationStatusLockTarget.Unregistered:
            const difference = (3 + lockTarget - currentStatus) % 3;
            switch (difference) {
                case 0:
                    return currentStatus;
                case 1:
                    return (currentStatus + 2) % 3;
                default:
                    return (currentStatus + 1) % 3;
            }
        default:
            return (currentStatus + 1) % 3;
    }
}

export interface PlanJSON {
    readonly courseToStatus: { [courseCode: string]: RegistrationStatus };
    readonly courseToRequirement: { [courseCode: string]: RequirementId };
    readonly requirementToOthersCount: { [requirementName: string]: RegisteredCreditCounts };
    readonly selectionNameToOptionName: { [selectionName: string]: string };
}

export const toJSON =
    ({ courseToStatus, courseToRequirement, requirementToOthersCount, selectionNameToOptionName }: Plan): PlanJSON => ({
        courseToStatus: Object.fromEntries(
            [...courseToStatus].map(([course, status]) => [course.code, status])
        ),
        courseToRequirement: Object.fromEntries(
            [...courseToRequirement].map(([course, requirement]) => [course.code, requirement.id])
        ),
        requirementToOthersCount: Object.fromEntries(
            [...requirementToOthersCount].map(([requirement, creditsCounts]) => [requirement.id, creditsCounts])
        ),
        selectionNameToOptionName: Object.fromEntries(selectionNameToOptionName),
    });

export const fromJSON = (json: PlanJSON, { codeToCourse, idToRequirement }: {
    codeToCourse: ReadonlyMap<CourseCode, Course>,
    idToRequirement: ReadonlyMap<RequirementId, RequirementWithCourses>,
}): Plan => {
    const courseToStatus = new Map(
        Object.entries(json.courseToStatus).map(([code, status]) => {
            const course = codeToCourse.get(code);
            if (course === undefined) { throw new Error(); }
            return [course, status];
        })
    );

    const courseToRequirement = new Map(
        Object.entries(json.courseToRequirement).map(([courseCode, requirementId]) => {
            const course = codeToCourse.get(courseCode);
            const requirement = idToRequirement.get(requirementId);

            if (course === undefined) { throw new Error(); }
            if (requirement === undefined) { throw new Error(); }

            return [course, requirement];
        })
    );

    const requirementToOthersCount = new Map(
        Object.entries(json.requirementToOthersCount).map(([requirementId, creditsCounts]) => {
            const requirement = idToRequirement.get(requirementId);
            if (requirement === undefined) { throw new Error(); }
            return [requirement, creditsCounts];
        })
    );

    const selectionNameToOptionName = new Map(Object.entries(json.selectionNameToOptionName));

    return { courseToStatus, courseToRequirement, requirementToOthersCount, selectionNameToOptionName }
}

export const emptyPlan: Plan = {
    courseToStatus: new Map(),
    courseToRequirement: new Map(),
    requirementToOthersCount: new Map(),
    selectionNameToOptionName: new Map(),
};
