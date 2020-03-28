import Course from "../Course";
import Plan, { fromJSON, PlanJSON, RegisteredCreditsCounts, RegistrationStatus, toJSON } from "../Plan";
import Requirements, { getRequirementAndDictionaryFromJSON, Range, RequirementsJSON, RequirementWithCourses } from "../Requirements";

function* f01(
    requiredCreditsCount: Range,
    acquiredCourses: readonly Course[],
    acquiredCreditsCountSum: number,
    selectedCourses: readonly Course[],
    selectedCreditsCountMin: number,
): Generator<readonly Course[], void, undefined> {
    if (
        acquiredCreditsCountSum >= requiredCreditsCount.min &&
        selectedCreditsCountMin > acquiredCreditsCountSum - requiredCreditsCount.max
    ) {
        yield selectedCourses;
    }
    if (acquiredCreditsCountSum < requiredCreditsCount.max) {
        for (const [index, course] of acquiredCourses.entries()) {
            const slicedCourseList = acquiredCourses.slice(index + 1);
            const courseLists = f01(
                requiredCreditsCount,
                slicedCourseList,
                acquiredCreditsCountSum + course.creditsCount,
                [...selectedCourses, course],
                Math.min(selectedCreditsCountMin, course.creditsCount),
            )
            yield* courseLists;
        }
    }
}

function* f02(
    requiredCreditsCount: Range,
    registeredCourses: readonly Course[],
    registeredCreditsCountSum: number,
    selectedCourses: readonly Course[],
    selectedCreditsCountMin: number,
): Generator<readonly Course[], void, undefined> {
    if (
        registeredCreditsCountSum >= requiredCreditsCount.min &&
        selectedCreditsCountMin > registeredCreditsCountSum - requiredCreditsCount.max
    ) {
        yield selectedCourses;
    }
    if (registeredCreditsCountSum < requiredCreditsCount.max) {
        for (const [index, course] of registeredCourses.entries()) {
            const slicedCourseList = registeredCourses.slice(index + 1);
            const courseLists = f02(
                requiredCreditsCount,
                slicedCourseList,
                registeredCreditsCountSum + course.creditsCount,
                [...selectedCourses, course],
                Math.min(selectedCreditsCountMin, course.creditsCount),
            );
            yield* courseLists;
        }
    }
}

function* f0(
    requiredCreditsCount: Range,
    registeredCourses: readonly Course[],
    acquiredCourses: readonly Course[],
    registeredCreditsCountSum: number,
    acquiredCreditsCountSum: number,
    selectedCourses: readonly Course[],
    selectedCreditsCountMin: number,
): Generator<readonly Course[], void, undefined> {
    if (registeredCreditsCountSum < requiredCreditsCount.max) {
        yield* f02(
            requiredCreditsCount,
            registeredCourses,
            registeredCreditsCountSum,
            selectedCourses,
            selectedCreditsCountMin,
        );
        if (acquiredCreditsCountSum < requiredCreditsCount.max) {
            for (const [index, course] of acquiredCourses.entries()) {
                const slicedCourseList = acquiredCourses.slice(index + 1);
                const courseLists = f0(
                    requiredCreditsCount,
                    registeredCourses,
                    slicedCourseList,
                    registeredCreditsCountSum + course.creditsCount,
                    acquiredCreditsCountSum + course.creditsCount,
                    [...selectedCourses, course],
                    Math.min(selectedCreditsCountMin, course.creditsCount),
                )
                yield* courseLists;
            }
        }
    } else {
        yield* f01(
            requiredCreditsCount,
            acquiredCourses,
            acquiredCreditsCountSum,
            selectedCourses,
            selectedCreditsCountMin,
        );
    }
}

const f1 = (array: readonly {
    requirement: RequirementWithCourses,
    generator: Generator<readonly Course[], void, undefined>,
}[]): {
    requirement: RequirementWithCourses,
    courseLists: readonly (readonly Course[])[],
} => {
    const array1: readonly {
        requirement: RequirementWithCourses,
        generator: Generator<readonly Course[], void, undefined>,
        courseLists: (readonly Course[])[],
    }[] = array.map(({ requirement, generator }) => ({
        requirement, generator,
        courseLists: [],
    }));
    while (true) {
        for (const { requirement, generator, courseLists } of array1) {
            const result = generator.next();
            if (result.done) {
                return { requirement, courseLists };
            } else {
                courseLists.push(result.value);
            }
        }
    }
}

function* f2(requirements: readonly RequirementWithCourses[], plan: Plan): Generator<Plan, void, undefined> {
    if (requirements.length === 0) {
        yield plan;
        return;
    }

    const t0: readonly {
        requirement: RequirementWithCourses,
        generator: Generator<readonly Course[], void, undefined>,
    }[] = requirements.map(requirement => {
        const registeredCourses = requirement.courses.filter(course => plan.courseToRequirement.get(course) === undefined && plan.courseToStatus.get(course) === RegistrationStatus.Registered);
        const acquiredCourses = requirement.courses.filter(course => plan.courseToRequirement.get(course) === undefined && plan.courseToStatus.get(course) === RegistrationStatus.Acquired);
        const generator = f0(
            requirement.creditsCount,
            registeredCourses,
            acquiredCourses,
            plan.requirementToOthersCount.get(requirement)?.registered ?? 0,
            plan.requirementToOthersCount.get(requirement)?.acquired ?? 0,
            [],
            Infinity,
        );
        return { requirement, generator };
    });

    const t1 = f1(t0);

    for (const courses of t1.courseLists) {
        const plan0: Plan = {
            ...plan,
            courseToRequirement: new Map([
                ...plan.courseToRequirement,
                ...courses.map(course => [course, t1.requirement] as const),
            ])
        };
        const plans = f2(requirements.filter(requirement => requirement !== t1.requirement), plan0)
        yield* plans;
    }
}

function* searchAssignment(requirement: Requirements, plan: Plan): Generator<readonly Plan[], void, undefined> {
    const requirements = requirement.getVisibleRequirements(plan.selectionNameToOptionName);
    const plan0 = { ...plan, courseToRequirement: new Map() };
    let t0: readonly {
        plan: Plan,
        creditsCounts: RegisteredCreditsCounts,
    }[] | undefined = undefined;
    for (const plan1 of f2(requirements, plan0)) {
        const creditsCounts = requirement.getRegisteredCreditsCounts(plan1, false);
        if (t0 === undefined) {
            t0 = [{
                plan: plan1,
                creditsCounts,
            }];
            yield [plan1];
        } else {
            let t1 = false;
            const t2: {
                plan: Plan,
                creditsCounts: RegisteredCreditsCounts,
            }[] = [];
            for (const t3 of t0) {
                if (!t1 && (
                    creditsCounts.acquired > t3.creditsCounts.acquired ||
                    creditsCounts.registered > t3.creditsCounts.registered
                )) {
                    t2.push({
                        plan: plan1,
                        creditsCounts,
                    });
                    t1 = true;
                }
                if ((
                    t3.creditsCounts.acquired > creditsCounts.acquired ||
                    t3.creditsCounts.registered > creditsCounts.registered
                ) && (
                        t3.creditsCounts.acquired === creditsCounts.acquired &&
                        t3.creditsCounts.registered === creditsCounts.registered
                    )) {
                    t2.push(t3);
                }
            }
            if (t1) {
                t0 = t2;
                yield t0.map(({ plan }) => plan);
            }
        }
    }
}

globalThis.addEventListener('message', event => {
    const { requirementJSON, planJSON, codeToCourse }: {
        requirementJSON: RequirementsJSON,
        planJSON: PlanJSON,
        codeToCourse: ReadonlyMap<string, Course>,
    } = event.data;

    const { requirement, nameToRequirement } = getRequirementAndDictionaryFromJSON(requirementJSON, codeToCourse);
    const plan = fromJSON(planJSON, { codeToCourse, nameToRequirement });

    for (const plans of searchAssignment(requirement, plan)) {
        postMessage(plans.map(toJSON));
    }
    postMessage('done');
});
