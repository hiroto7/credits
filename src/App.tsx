import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { Alert, Button, Container, Form, Navbar } from 'react-bootstrap';
import { useLocalStorage } from 'react-use';
import './App.css';
import codeToCourse from './courses';
import ExportAndImportView from './ExportAndImportView';
import Plan, { emptyPlan, fromJSON, PlanJSON, toJSON } from './Plan';
import requirementAndDictionaryMap from './requirements/';
import RequirementSelector, { defaultSelected } from './RequirementSelector';
import RequirementsRootView from './RequirementsRootView';

const COURSES_STATE = "courses-state"

const App = () => {
    const [selected, setSelected] = useState(defaultSelected);
    const [showsOnlyRegistered, setShowsOnlyRegistered] = useState(false);
    const [showsExportAndImportView, setShowsExportAndImportView] = useState(false);
    const { plan, setPlan } = usePlan(selected.name);

    return (
        <>
            <Navbar variant="dark" bg="dark">
                <Navbar.Brand>卒業要件を満たしたい</Navbar.Brand>
            </Navbar>
            <Container>
                <Alert variant="danger" className="my-3">
                    このツールの結果を利用する場合、必ず履修要覧や支援室などでその結果が正しいことを確認するようにしてください。
                    <strong>科目や要件の定義が誤っていたり、実際には認められない履修の組み合わせがある可能性があります。</strong>
                </Alert>
                <RequirementSelector onChange={setSelected} />
                <div className="mb-3">
                    {
                        showsExportAndImportView ? (
                            <ExportAndImportView
                                plan={plan} codeToCourse={codeToCourse} nameToRequirement={selected.dictionary}
                                onReturn={setPlan} onHide={() => setShowsExportAndImportView(false)}
                            />
                        ) : (
                                <Button variant="secondary" onClick={() => setShowsExportAndImportView(true)}>
                                    エクスポート / インポート
                                </Button>
                            )
                    }
                </div>
                <Form.Check custom className="mb-3" id="showsOnlyRegisteredCheck"
                    label="履修する科目のみ表示する"
                    checked={showsOnlyRegistered}
                    onChange={() => setShowsOnlyRegistered(!showsOnlyRegistered)}
                />
                <div className="mb-3">
                    <RequirementsRootView
                        requirement={selected.requirement} showsOnlyRegistered={showsOnlyRegistered}
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