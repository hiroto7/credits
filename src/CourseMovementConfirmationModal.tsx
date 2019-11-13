import React, { useState } from "react";
import { Button, Card, Modal } from "react-bootstrap";
import Plan from "./Plan";
import { RequirementWithCourses } from "./Requirements";
import { RequirementSummaryView } from "./RequirementView";

const CourseMovementConfirmationModal = ({ currentRequirement, plan, onReturn, onExited }: {
    currentRequirement: RequirementWithCourses,
    plan: Plan,
    onReturn: (value: boolean) => void,
    onExited: () => void,
}) => {
    const [show, setShow] = useState(true);

    return (
        <Modal show={show} onHide={() => { setShow(false); onReturn(false); }} onExited={onExited}>
            <Modal.Body>
                <p>
                    この科目はすでに以下の要件に割り当てられています。
                    <strong>続けると、この要件への割り当ては解除されます。</strong>
                </p>
                <p>各科目に割り当てできる要件は1つまでです。</p>
                <Card body>
                    <RequirementSummaryView requirement={currentRequirement} plan={plan} />
                </Card>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => { setShow(false); onReturn(false); }}>キャンセル</Button>
                <Button variant="primary" onClick={() => { setShow(false); onReturn(true); }}>続ける</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CourseMovementConfirmationModal;