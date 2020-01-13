import Course from "./Course";
import RegistrationStatus from "./RegistrationStatus";
import { RegisteredCreditsCounts, RequirementWithCourses } from "./Requirements";

export type CourseCode = string;
export type RequirementName = string;

export interface PlanJSON {
    readonly courseToStatus: { [courseCode: string]: RegistrationStatus };
    readonly courseToRequirement: { [courseCode: string]: RequirementName };
    readonly requirementToOthersCount: { [requirementName: string]: RegisteredCreditsCounts };
    readonly selectionNameToOptionName: { [selectionName: string]: string };
}

export default interface Plan {
    readonly courseToStatus: ReadonlyMap<Course, RegistrationStatus>;
    readonly courseToRequirement: ReadonlyMap<Course, RequirementWithCourses>;
    readonly requirementToOthersCount: ReadonlyMap<RequirementWithCourses, RegisteredCreditsCounts>;
    readonly selectionNameToOptionName: ReadonlyMap<string, string>;
}

export const toJSON =
    ({ courseToStatus, courseToRequirement, requirementToOthersCount, selectionNameToOptionName }: Plan): PlanJSON => ({
        courseToStatus: Object.fromEntries(
            [...courseToStatus].map(([course, status]) => [course.code, status])
        ),
        courseToRequirement: Object.fromEntries(
            [...courseToRequirement].map(([course, requirement]) => [course.code, requirement.name])
        ),
        requirementToOthersCount: Object.fromEntries(
            [...requirementToOthersCount].map(([requirement, creditsCounts]) => [requirement.name, creditsCounts])
        ),
        selectionNameToOptionName: Object.fromEntries(selectionNameToOptionName),
    });

export const fromJSON = (json: PlanJSON, { codeToCourse, nameToRequirement }: {
    codeToCourse: ReadonlyMap<CourseCode, Course>,
    nameToRequirement: ReadonlyMap<RequirementName, RequirementWithCourses>,
}): Plan => {
    const courseToStatus = new Map(
        Object.entries(json.courseToStatus).map(([code, status]) => {
            const course = codeToCourse.get(code);
            if (course === undefined) { throw new Error(); }
            return [course, status];
        })
    );

    const courseToRequirement = new Map(
        Object.entries(json.courseToRequirement).map(([courseCode, requirementName]) => {
            const course = codeToCourse.get(courseCode);
            const requirement = nameToRequirement.get(requirementName);

            if (course === undefined) { throw new Error(); }
            if (requirement === undefined) { throw new Error(); }

            return [course, requirement];
        })
    );

    const requirementToOthersCount = new Map(
        Object.entries(json.requirementToOthersCount).map(([requirementName, creditsCounts]) => {
            const requirement = nameToRequirement.get(requirementName);
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