import React, { useState } from 'react';
import { Button, ListGroup, Modal, Badge } from "react-bootstrap";
import Course from './Course';
import Plan, { RegistrationStatus, RegisteredCreditsCounts } from './Plan';
import Requirements, { Range, RequirementWithCourses } from './Requirements';

function* f01(
    requiredCreditsCount: Range,
    acquiredCourses: readonly Course[],
    registeredCreditsCountSum: number,
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
                registeredCreditsCountSum + course.creditsCount,
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
    acquiredCreditsCountSum: number,
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
                acquiredCreditsCountSum,
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
            acquiredCreditsCountSum,
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
            registeredCreditsCountSum,
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

function* f3(requirement: Requirements, plan: Plan): Generator<readonly Plan[], void, undefined> {
    const requirements = requirement.f(plan.selectionNameToOptionName);
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

const V0: React.FC<{
    requirement: Requirements,
    plan: Plan,
    onSubmit: (plan: Plan) => void,
}> = ({ requirement, plan, onSubmit }) => {
    const [show, setShow] = useState(false);
    const [plans, setPlans] = useState<readonly Plan[] | undefined>(undefined);

    return (
        <>
            <Button
                variant="secondary"
                onClick={
                    () => {
                        setShow(true);
                        setPlans(undefined);
                        for (const p of f3(requirement, plan)) {
                            setPlans(p);
                        }
                    }
                }
            >
                要件を満たす割り当てを見つける
            </Button>
            <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>要件を満たす割り当てを見つける</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {
                        plans === undefined ? '要件を満たす割り当ては見つかりませんでした。' : (
                            <>
                                <p>要件を満たす割り当てが {plans.length} 個見つかりました。適用したいものを選択してください。</p>
                                <ListGroup>
                                    {
                                        plans.map(plan1 => {
                                            const status = requirement.getStatus(plan1);
                                            const creditsCounts = requirement.getRegisteredCreditsCounts(plan1, false);
                                            return (
                                                <ListGroup.Item
                                                    key={`${creditsCounts.acquired}-${creditsCounts.registered}`}
                                                    action
                                                    onClick={() => { setShow(false); onSubmit(plan1); }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            修得
                                                            <> </>
                                                            <strong className="text-success">{creditsCounts.acquired}</strong>
                                                            <> / </>
                                                            履修
                                                            <> </>
                                                            <strong className="text-primary">{creditsCounts.registered}</strong>
                                                        </div>
                                                        <Badge className="ml-2 flex-shrink-0" variant={status === RegistrationStatus.Acquired ? 'success' : status === RegistrationStatus.Registered ? 'primary' : 'secondary'}>
                                                            {status === RegistrationStatus.Acquired ? '修得OK' : status === RegistrationStatus.Registered ? '履修OK' : '不足'}
                                                        </Badge>
                                                    </div>
                                                </ListGroup.Item>
                                            )
                                        })
                                    }
                                </ListGroup>
                            </>
                        )
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShow(false)}>キャンセル</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default V0;