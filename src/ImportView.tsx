import React, { useState } from 'react';
import { Accordion, Button, Card, Form, Modal, useAccordionToggle } from "react-bootstrap";
import Course from "./Course";
import getValueFromModal, { useModals } from './getValueFromModal';
import Plan, { emptyPlan, fromJSONSafely, toJSON } from "./Plan";
import { RequirementWithCourses } from "./Requirements";

const ImportConfirmationModal = ({ onReturn, onExited }: {
    onReturn: (value: boolean) => void,
    onExited: () => void
}) => {
    const [show, setShow] = useState(true);

    return (
        <Modal show={show} onHide={() => { setShow(false); onReturn(false); }} onExited={onExited}>
            <Modal.Header closeButton>
                <Modal.Title>インポート</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                インポートすると現在の設定状態は失われますが、よろしいですか？
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => { setShow(false); onReturn(false); }}>いいえ</Button>
                <Button variant="danger" onClick={() => { setShow(false); onReturn(true); }}>はい</Button>
            </Modal.Footer>
        </Modal>
    );
}

const parseJSONSafely = (...args: Parameters<typeof JSON.parse>): ReturnType<typeof JSON.parse> | undefined => {
    try {
        return JSON.parse(...args)
    } catch {
        return undefined;
    }
}

const ImportView = ({ eventKey, codeToCourse, nameToRequirement, onSubmit }: {
    eventKey: string,
    codeToCourse: ReadonlyMap<string, Course>,
    nameToRequirement: ReadonlyMap<string, RequirementWithCourses>,
    onSubmit: (nextPlan: Plan) => void,
}) => {
    const [jsonString, setJSONString] = useState("");
    const toggle = useAccordionToggle(eventKey, () => { });
    const { modals, setModalsAndCount } = useModals();

    const nextPlan = fromJSONSafely(
        parseJSONSafely(jsonString),
        { codeToCourse, nameToRequirement }
    );
    const isInvalid = nextPlan === undefined;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (
            nextPlan === undefined ||
            !await getValueFromModal(ImportConfirmationModal, {}, setModalsAndCount)
        ) {
            return;
        }
        onSubmit(nextPlan);
        toggle();
    };

    return (
        <>
            {modals}
            <Card>
                <Card.Header>
                    <Accordion.Toggle eventKey={eventKey} variant="link" as={Button}>
                        インポート
                    </Accordion.Toggle>
                </Card.Header>
                <Accordion.Collapse eventKey={eventKey}>
                    <Card.Body>
                        <p>
                            テキストボックスに保存したテキストを貼り付けてから、 [インポート] ボタンを押します。
                            <strong>インポートすると現在の設定状態は失われます。</strong>
                        </p>
                        <Form onSubmit={handleSubmit}>
                            <Form.Group>
                                <Form.Label>JSON</Form.Label>
                                <Form.Control
                                    className="input-monospace" isInvalid={isInvalid}
                                    value={jsonString} placeholder={JSON.stringify(toJSON(emptyPlan))}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJSONString(e.target.value)}
                                />
                                <Form.Control.Feedback type="invalid">JSONが不正です</Form.Control.Feedback>
                            </Form.Group>
                            <Button type="submit" disabled={isInvalid}>インポート</Button>
                        </Form>
                    </Card.Body>
                </Accordion.Collapse>
            </Card>
        </>
    );
}

export default ImportView;