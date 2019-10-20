import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { Alert, Container, Navbar } from 'react-bootstrap';
import './App.css';
import RequirementSelector, { defaultRequirement } from './RequirementSelector';
import RequirementsRootView, { emptyPlan } from './RequirementsRootView';

const App = () => {
    const [requirement, setRequirement] = useState(defaultRequirement);
    const [plan, setPlan] = useState(emptyPlan);

    return (
        <>
            <Navbar variant="dark" bg="dark">
                <Navbar.Brand>卒業要件を満たしたい</Navbar.Brand>
            </Navbar>
            <Container>
                <Alert variant="danger" className="mt-3">
                    このツールの結果を利用する場合、必ず履修要覧や支援室などでその結果が正しいことを確認するようにしてください。
                    <strong>科目や要件の定義が誤っていたり、実際には認められない履修の組み合わせがある可能性があります。</strong>
                </Alert>
                <RequirementSelector onChange={requirement => {
                    setRequirement(requirement);
                    setPlan(emptyPlan);
                }} />
                <RequirementsRootView requirement={requirement} plan={plan} onChange={newPlan => setPlan(newPlan)} />
            </Container>
        </>
    );
}

export default App;