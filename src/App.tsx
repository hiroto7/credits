import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { Accordion, Alert, Container, Form, Navbar } from 'react-bootstrap';
import { useLocalStorage } from 'react-use';
import './App.css';
import CollectivelyCourseSetView from './CollectivelyCourseSetView';
import codeToCourse from './courses';
import ExportView from './ExportView';
import FilterType from './FilterType';
import ImportView from './ImportView';
import Plan, { emptyPlan, fromJSON, PlanJSON, toJSON } from './Plan';
import RegistrationStatusLockTarget from './RegistrationStatusLockTarget';
import requirementAndDictionaryMap from './requirements/';
import RequirementSelector, { defaultSelected } from './RequirementSelector';
import RequirementsRootView from './RequirementsRootView';

const COURSES_STATE = "courses-state"

const App = () => {
    const [selected, setSelected] = useState(defaultSelected);
    const [filterType, setFilterType] = useState(FilterType.None);
    const [lockTarget, setLockTarget] = useState(RegistrationStatusLockTarget.None);
    const { plan, setPlan } = usePlan(selected.name);

    const actualLockTarget =
        filterType === FilterType.None ?
            lockTarget :
            lockTarget === RegistrationStatusLockTarget.None ?
                RegistrationStatusLockTarget.Unregistered :
                lockTarget === RegistrationStatusLockTarget.Acquired ?
                    RegistrationStatusLockTarget.All :
                    lockTarget;

    return (
        <>
            <Navbar variant="dark" bg="dark">
                <Navbar.Brand>卒業要件を満たしたい</Navbar.Brand>
            </Navbar>
            <Container>
                <Alert variant="danger" className="my-3">
                    このツールの結果を利用する場合、必ず履修要覧や支援室などでその結果が正しいことを確認するようにしてください。
                    <strong>科目や要件の定義が誤っていることや、実際には認められない履修の組み合わせが存在することがあります。</strong>
                </Alert>
                <RequirementSelector onChange={setSelected} />
                <Accordion className="mb-3">
                    <CollectivelyCourseSetView
                        eventKey="0" codeToCourse={codeToCourse}
                        onSubmit={courseToStatus => setPlan({ ...plan, courseToStatus })}
                    />
                    <ExportView eventKey="1" plan={plan} />
                    <ImportView
                        eventKey="2" onSubmit={setPlan}
                        codeToCourse={codeToCourse} nameToRequirement={selected.dictionary}
                    />
                </Accordion>
                <Form.Group>
                    <Form.Label>科目の履修状態のロック</Form.Label>
                    {
                        [
                            {
                                label: "ロックしない",
                                lockTarget: RegistrationStatusLockTarget.None,
                                disabled: filterType !== FilterType.None,
                            },
                            {
                                label: "[履修する] と [修得済み] の間の変更のみ許可",
                                lockTarget: RegistrationStatusLockTarget.Unregistered,
                            },
                            {
                                label: "[履修しない] と [履修する] の間の変更のみ許可",
                                lockTarget: RegistrationStatusLockTarget.Acquired,
                                disabled: filterType !== FilterType.None,
                            },
                            {
                                label: "すべてロックする",
                                lockTarget: RegistrationStatusLockTarget.All,
                            },
                        ].map(({ label, disabled, lockTarget: lockTarget1 }) => (
                            <Form.Check
                                custom type="radio"
                                id={`lockTargetCheck${lockTarget1}`}
                                label={label} key={lockTarget1}
                                disabled={disabled}
                                checked={actualLockTarget === lockTarget1}
                                onChange={() => setLockTarget(lockTarget1)}
                            />
                        ))
                    }
                </Form.Group>
                <Form.Group>
                    <Form.Check
                        custom
                        id="filterTypeCheck0"
                        label="履修する科目のみ表示する"
                        checked={filterType !== FilterType.None}
                        onChange={
                            () => {
                                if (filterType === FilterType.None) {
                                    setFilterType(FilterType.Registered);
                                } else {
                                    setFilterType(FilterType.None);
                                }
                            }
                        }
                    />
                    <Form.Check
                        custom
                        id="filterTypeCheck1"
                        label="単位数の計算に含まれる科目のみ表示する"
                        checked={filterType === FilterType.Valid}
                        onChange={
                            () => {
                                if (filterType === FilterType.Valid) {
                                    setFilterType(FilterType.Registered);
                                } else {
                                    setFilterType(FilterType.Valid);
                                }
                            }
                        }
                    />
                </Form.Group>
                <hr />
                <div className="mb-3">
                    <RequirementsRootView
                        requirement={selected.requirement}
                        lockTarget={actualLockTarget} filterType={filterType}
                        plan={plan} onChange={setPlan}
                    />
                </div>
            </Container>
        </>
    );
}

const usePlanMap = () => {
    const [storedJSON, setStoredJSON] = useLocalStorage<readonly (readonly [string, PlanJSON])[]>(COURSES_STATE);
    const [planMap0, setPlanMap0] = useState(() => {
        try {
            const storedPlanEntries = storedJSON.map(([requirementName, planJSON]) => {
                const requirementAndDictionary = requirementAndDictionaryMap.get(requirementName);
                if (requirementAndDictionary === undefined) {
                    return undefined;
                } else {
                    try {
                        return [requirementName, fromJSON(planJSON, {
                            codeToCourse,
                            nameToRequirement: requirementAndDictionary.dictionary,
                        })] as const;
                    } catch {
                        return undefined;
                    }
                }
            }).filter((value): value is NonNullable<typeof value> => value !== undefined);
            const storedPlanMap: ReadonlyMap<string, Plan> = new Map(storedPlanEntries);
            return storedPlanMap;
        } catch {
            const storedPlanMap: ReadonlyMap<string, Plan> = new Map();
            return storedPlanMap;
        }
    });
    const setPlanMap = (newPlanMap: ReadonlyMap<string, Plan>) => {
        const planJSONEntries = [...newPlanMap].map(([requirementName, plan]) => [requirementName, toJSON(plan)] as const);
        setPlanMap0(newPlanMap);
        setStoredJSON(planJSONEntries);
    };
    return {
        planMap: planMap0,
        setPlanMap,
    };
}

const usePlan = (requirementName: string) => {
    const { planMap, setPlanMap } = usePlanMap();

    const plan = planMap.get(requirementName) || emptyPlan;
    const setPlan = (newPlan: Plan) => {
        const newPlanMap = new Map([
            ...planMap,
            [requirementName, newPlan]
        ]);
        setPlanMap(newPlanMap);
    };

    return { plan, setPlan };
}

export default App;