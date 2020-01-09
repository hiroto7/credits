import React, { useState } from 'react';
import { Accordion, Button, Card, Form, useAccordionToggle } from "react-bootstrap";
import Course from "./Course";
import Plan, { emptyPlan, fromJSON, toJSON } from "./Plan";
import { RequirementWithCourses } from "./Requirements";

const ImportView = ({ eventKey, codeToCourse, nameToRequirement, onSubmit }: {
    eventKey: string,
    codeToCourse: ReadonlyMap<string, Course>,
    nameToRequirement: ReadonlyMap<string, RequirementWithCourses>,
    onSubmit: (nextPlan: Plan) => void,
}) => {
    const [jsonString, setJSONString] = useState("");
    const toggle = useAccordionToggle(eventKey, () => { });

    const nextPlan = (() => {
        try {
            return fromJSON(
                JSON.parse(jsonString),
                { codeToCourse, nameToRequirement }
            );
        } catch {
            return undefined;
        }
    })();
    const isInvalid = nextPlan === undefined;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (nextPlan === undefined) {
            return;
        }
        onSubmit(nextPlan);
        toggle();
    };

    return (
        <>
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
                            <Button variant="danger" type="submit" disabled={isInvalid}>インポート</Button>
                        </Form>
                    </Card.Body>
                </Accordion.Collapse>
            </Card>
        </>
    );
}

export default ImportView