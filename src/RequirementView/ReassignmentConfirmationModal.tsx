import { useState } from "react";
import { Button, Card, Modal } from "react-bootstrap";
import type Plan from "../Plan";
import type { RequirementWithCourses } from "../Requirements";
import { RequirementSummaryView } from "./RequirementSummaryView";

const ReassignmentConfirmationModal: React.FC<{
    currentRequirement: RequirementWithCourses,
    plan: Plan,
    onReturn: (value: boolean) => void,
    onExited: () => void,
}> = ({ currentRequirement, plan, onReturn, onExited }) => {
    const [show, setShow] = useState(true);

    return (
        <Modal show={show} onHide={() => { setShow(false); onReturn(false); }} onExited={onExited}>
            <Modal.Header closeButton>
                <Modal.Title>科目群の割り当てを変更</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    この科目は、すでに以下の科目群に割り当てられています。
                    <strong>続けると、この科目群への割り当ては解除されます。</strong>
                </p>
                <p>各科目に割り当てできる科目群は1つまでです。</p>
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

export default ReassignmentConfirmationModal;