import React from 'react';
import { Accordion, Button, Card, Form } from "react-bootstrap";
import Plan, { toJSON } from "./Plan";

const ExportView = ({ plan, eventKey }: {
    plan: Plan,
    eventKey: string,
}) => (
        <Card>
            <Card.Header>
                <Accordion.Toggle eventKey={eventKey} variant="link" as={Button}>
                    エクスポート
                </Accordion.Toggle>
            </Card.Header>
            <Accordion.Collapse eventKey={eventKey}>
                <Card.Body>
                    <p>テキストボックスの内容をコピーして、テキストファイルなどに保存します。</p>
                    <Form>
                        <Form.Group className="mb-0">
                            <Form.Label>JSON</Form.Label>
                            <Form.Control
                                readOnly className="input-monospace"
                                value={JSON.stringify(toJSON(plan))}
                                onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                            />
                        </Form.Group>
                    </Form>
                </Card.Body>
            </Accordion.Collapse>
        </Card>
    );

export default ExportView